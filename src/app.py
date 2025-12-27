from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import json
import random

import chess
import chess.polyglot
import torch


app = FastAPI(title="TEORIAT Chess Engine API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

VOCAB_SIZE = 1928
EMBEDDING_DIM = 128
HIDDEN_DIM = 256
NUM_LAYERS = 2
DROPOUT = 0.3
PAD_TOKEN = 1927
MAX_SEQ_LEN = 6

TOPK = 120
TEMPERATURE = 0.85
STYLE_SAMPLE_K = 6

PIECE_VALUE = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
    chess.KING: 0,
}


class ChessRNN(torch.nn.Module):
    def __init__(
        self,
        vocab_size=VOCAB_SIZE,
        embedding_dim=EMBEDDING_DIM,
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT,
    ):
        super().__init__()
        self.move_embedding = torch.nn.Embedding(vocab_size, embedding_dim, padding_idx=PAD_TOKEN)
        self.color_embedding = torch.nn.Embedding(2, 32)
        self.theory_embedding = torch.nn.Embedding(2, 32)

        input_dim = embedding_dim + 32 + 32
        self.layer_norm = torch.nn.LayerNorm(input_dim)

        self.rnn = torch.nn.GRU(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True,
        )

        self.dropout = torch.nn.Dropout(dropout)
        self.fc_intermediate = torch.nn.Linear(hidden_dim, hidden_dim)
        self.relu = torch.nn.ReLU()
        self.fc = torch.nn.Linear(hidden_dim, vocab_size)

    def forward(self, colors, moves, theory):
        move_embedded = self.move_embedding(moves)
        color_embedded = self.color_embedding(colors)
        theory_embedded = self.theory_embedding(theory)

        combined = torch.cat([move_embedded, color_embedded, theory_embedded], dim=2)
        combined = self.layer_norm(combined)

        _, hidden_state = self.rnn(combined)
        last_hidden = hidden_state[-1, :, :]

        x = self.dropout(last_hidden)
        x = self.fc_intermediate(x)
        x = self.relu(x)
        x = self.dropout(x)
        return self.fc(x)


BASE_DIR = Path(__file__).resolve().parent
MOVE_TO_NUMBER_PATH = BASE_DIR / "move_to_number.json"
MODEL_PATH = BASE_DIR / "best_chess_model.pth"
BOOK_PATH = BASE_DIR / "book.bin"

if not MOVE_TO_NUMBER_PATH.exists():
    raise RuntimeError(f"Missing file: {MOVE_TO_NUMBER_PATH}")
if not MODEL_PATH.exists():
    raise RuntimeError(f"Missing file: {MODEL_PATH}")

with MOVE_TO_NUMBER_PATH.open("r", encoding="utf-8") as f:
    move_to_number = json.load(f)
number_to_move = {int(v): k for k, v in move_to_number.items()}

model = ChessRNN().to(device)
model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
model.eval()


class MoveRequest(BaseModel):
    moves: list[str]


class MoveResponse(BaseModel):
    move: str


def build_board_from_uci(uci_moves: list[str]) -> chess.Board:
    board = chess.Board()
    for uci in uci_moves:
        try:
            mv = chess.Move.from_uci(uci)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid UCI: {uci}")
        if mv not in board.legal_moves:
            raise HTTPException(status_code=400, detail=f"Illegal move: {uci} in {board.fen()}")
        board.push(mv)
    return board


def prepare_game_data(uci_moves: list[str]) -> tuple[list[int], list[int], list[int]]:
    board = chess.Board()
    colors: list[int] = []
    moves: list[int] = []
    theory: list[int] = []

    for uci in uci_moves:
        try:
            mv = chess.Move.from_uci(uci)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid UCI: {uci}")
        if mv not in board.legal_moves:
            raise HTTPException(status_code=400, detail=f"Illegal move: {uci} in {board.fen()}")

        san = board.san(mv)
        color = 1 if board.turn == chess.WHITE else 0

        move_idx = move_to_number.get(san)
        if move_idx is None:
            move_idx = PAD_TOKEN

        colors.append(color)
        moves.append(int(move_idx))
        theory.append(0)
        board.push(mv)

    while len(moves) < MAX_SEQ_LEN:
        colors.insert(0, 0)
        moves.insert(0, PAD_TOKEN)
        theory.insert(0, 0)

    return colors[-MAX_SEQ_LEN:], moves[-MAX_SEQ_LEN:], theory[-MAX_SEQ_LEN:]


def model_logits_for(req_moves: list[str]) -> torch.Tensor:
    colors, moves, theory = prepare_game_data(req_moves)
    colors_t = torch.tensor([colors], device=device)
    moves_t = torch.tensor([moves], device=device)
    theory_t = torch.tensor([theory], device=device)
    with torch.no_grad():
        return model(colors_t, moves_t, theory_t)


def try_book_move(board: chess.Board) -> chess.Move | None:
    if not BOOK_PATH.exists():
        return None
    try:
        with chess.polyglot.open_reader(str(BOOK_PATH)) as reader:
            entry = reader.weighted_choice(board)
            mv = entry.move
            return mv if mv in board.legal_moves else None
    except IndexError:
        return None


def capture_score(board: chess.Board, mv: chess.Move) -> int:
    if not board.is_capture(mv):
        return 0

    if board.is_en_passant(mv):
        captured_value = PIECE_VALUE[chess.PAWN]
    else:
        captured = board.piece_at(mv.to_square)
        captured_value = PIECE_VALUE.get(captured.piece_type, 0) if captured else 0

    attacker = board.piece_at(mv.from_square)
    attacker_value = PIECE_VALUE.get(attacker.piece_type, 0) if attacker else 0

    return 120 + 14 * captured_value - 2 * attacker_value


def hang_penalty(board_after: chess.Board, mv: chess.Move) -> int:
    sq = mv.to_square
    piece = board_after.piece_at(sq)
    if not piece:
        return 0

    opp = board_after.turn
    me = not opp

    attacked = board_after.is_attacked_by(opp, sq)
    defended = board_after.is_attacked_by(me, sq)

    v = PIECE_VALUE.get(piece.piece_type, 0)
    if attacked and not defended:
        return 450 * v
    if attacked:
        return 50 * v
    return 0


def worst_reply_capture_loss(board_after: chess.Board) -> int:
    worst = 0
    for reply in board_after.legal_moves:
        if not board_after.is_capture(reply):
            continue
        captured = board_after.piece_at(reply.to_square)
        if not captured:
            continue
        worst = max(worst, PIECE_VALUE.get(captured.piece_type, 0))
        if worst >= 9:
            break
    return worst


def repetition_penalty(board_after: chess.Board) -> int:
    if board_after.is_repetition(2):
        return 1200
    if board_after.can_claim_threefold_repetition():
        return 4000
    return 0


def sample_index(indices: list[int], scores: list[float], temperature: float) -> int:
    t = max(0.05, float(temperature))
    logits = torch.tensor(scores, dtype=torch.float32) / t
    probs = torch.softmax(logits, dim=0)
    j = int(torch.multinomial(probs, num_samples=1).item())
    return indices[j]


def pick_legal_move(board: chess.Board, logits: torch.Tensor, topk: int = TOPK) -> chess.Move:
    _, top_idx = torch.topk(logits[0], k=min(topk, logits.shape[-1]))

    candidates: list[tuple[chess.Move, float]] = []

    for idx in top_idx.tolist():
        san = number_to_move.get(int(idx))
        if not san:
            continue
        try:
            mv = board.parse_san(san)
        except ValueError:
            continue
        if mv not in board.legal_moves:
            continue

        score = 0.0
        score += float(capture_score(board, mv))
        if board.gives_check(mv):
            score += 45.0

        board.push(mv)
        if board.is_checkmate():
            score += 100000.0
        score -= float(hang_penalty(board, mv))
        score -= 600.0 * float(worst_reply_capture_loss(board))
        score -= float(repetition_penalty(board))
        board.pop()

        candidates.append((mv, score))

    if not candidates:
        legal = list(board.legal_moves)
        if not legal:
            raise HTTPException(status_code=400, detail="No legal moves (game over).")
        return random.choice(legal)

    candidates.sort(key=lambda x: x[1], reverse=True)
    keep = candidates[: min(STYLE_SAMPLE_K, len(candidates))]

    moves = [m for m, _ in keep]
    scores = [s for _, s in keep]
    choice = sample_index(list(range(len(moves))), scores, TEMPERATURE)
    return moves[choice]


@app.get("/")
def root():
    return {"message": "TEORIAT Chess Engine API", "status": "running"}


@app.post("/move", response_model=MoveResponse)
def get_move(req: MoveRequest):
    if not req.moves:
        raise HTTPException(status_code=400, detail="Moves list cannot be empty")

    board = build_board_from_uci(req.moves)

    book_mv = try_book_move(board)
    if book_mv:
        return MoveResponse(move=book_mv.uci())

    logits = model_logits_for(req.moves)
    mv = pick_legal_move(board, logits, topk=TOPK)
    return MoveResponse(move=mv.uci())


@app.get("/legal_moves")
def get_legal_moves(moves: str = ""):
    uci_moves = [m for m in moves.split(",") if m] if moves else []
    board = build_board_from_uci(uci_moves) if uci_moves else chess.Board()
    return {"legal_moves": [m.uci() for m in board.legal_moves]}
