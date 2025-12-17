from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import chess  # pip install python-chess

from .rnn_model import ChessRNN          # same as in RNN_model.ipynb
from .encoding import encode_game_sequence   # you extract this from the notebook
from .move_index import uci_to_index, index_to_uci  # mapping dicts from notebook


app = FastAPI(title="TEORIAT Chess Engine API")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === match notebook hyperparameters exactly ===
INPUT_DIM = 768
HIDDEN_DIM = 256
LAYER_DIM = 2
OUTPUT_DIM = 4096

model = ChessRNN(
    input_dim=INPUT_DIM,
    hidden_dim=HIDDEN_DIM,
    layer_dim=LAYER_DIM,
    output_dim=OUTPUT_DIM,
).to(device)

model.load_state_dict(torch.load("src/notebooks/best_chess_model.pth",
                                 map_location=device))
model.eval()


class MoveRequest(BaseModel):
    # Full move history in UCI, e.g. ["e2e4", "e7e5", "g1f3"]
    moves: list[str]


class MoveResponse(BaseModel):
    # Model's chosen move in UCI, e.g. "g1f3"
    move: str


def reconstruct_game_data_from_moves(moves: list[str]) -> list[tuple[int, int, int]]:
    """
    Rebuild game_data = [(side_to_move, move_index, result_flag), ...]
    to match the structure used to generate cleaned_data.csv in the notebook.
    side_to_move: 1 for white, 0 for black (match notebook)
    move_index: 0..4095 (or your value) from the UCI->index mapping
    result_flag: 0 during inference (result unknown)
    """
    board = chess.Board()
    game_data = []

    for uci in moves:
        try:
            move = board.parse_uci(uci)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid UCI move: {uci}")

        side_to_move = 1 if board.turn == chess.WHITE else 0

        try:
            move_idx = uci_to_index(uci)  # same mapping as in training
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Move not in index mapping: {uci}")

        result_flag = 0
        game_data.append((side_to_move, move_idx, result_flag))

        board.push(move)

    return game_data


def build_input_from_moves(moves: list[str]) -> torch.Tensor:
    """
    Full pipeline: moves -> game_data -> encoded sequence tensor for RNN.
    Output shape: [1, seq_len, INPUT_DIM]
    """
    game_data = reconstruct_game_data_from_moves(moves)
    seq = encode_game_sequence(game_data)  # [seq_len, 768]; same as notebook
    return seq.unsqueeze(0)                # [1, seq_len, 768]


def decode_move_index(idx: int) -> str:
    """
    Convert model output index back to UCI move string.
    """
    try:
        return index_to_uci(idx)
    except KeyError:
        raise HTTPException(status_code=500, detail=f"Invalid move index: {idx}")


@app.get("/")
def root():
    return {"message": "TEORIAT chess engine API is running"}


@app.post("/move", response_model=MoveResponse)
def get_move(req: MoveRequest):
    if not req.moves:
        raise HTTPException(status_code=400, detail="moves list must not be empty")

    x = build_input_from_moves(req.moves).to(device)  # [1, seq_len, 768]

    with torch.no_grad():
        logits = model(x)                             # [1, 4096]
        move_idx = int(logits.argmax(dim=-1).item())

    uci_move = decode_move_index(move_idx)
    return MoveResponse(move=uci_move)
