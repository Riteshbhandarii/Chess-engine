from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import chess
import json
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TEORIAT Chess Engine API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]) 
# Device setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Model hyperparameters (match notebook exactly)
VOCAB_SIZE = 1928
EMBEDDING_DIM = 128
HIDDEN_DIM = 256
NUM_LAYERS = 2
DROPOUT = 0.3
PAD_TOKEN = 1927
MAX_SEQ_LEN = 6


# Model definition (copy from notebook)
class ChessRNN(torch.nn.Module):
    def __init__(self, vocab_size=1928, embedding_dim=128, hidden_dim=256, num_layers=2, dropout=0.3):
        super(ChessRNN, self).__init__()
        
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
            batch_first=True
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
        
        rnn_output, hidden_state = self.rnn(combined)
        last_hidden = hidden_state[-1, :, :]
        
        x = self.dropout(last_hidden)
        x = self.fc_intermediate(x)
        x = self.relu(x)
        x = self.dropout(x)
        logits = self.fc(x)
        
        return logits


# Load move mappings
move_to_number = json.load(open("move_to_number.json"))
number_to_move = {int(v): k for k, v in move_to_number.items()}

# Load model
model = ChessRNN(
    vocab_size=VOCAB_SIZE,
    embedding_dim=EMBEDDING_DIM,
    hidden_dim=HIDDEN_DIM,
    num_layers=NUM_LAYERS,
    dropout=DROPOUT
).to(device)

model.load_state_dict(torch.load("best_chess_model.pth", map_location=device))
model.eval()


# API models
class MoveRequest(BaseModel):
    moves: list[str]  # UCI format: ["e2e4", "e7e5"]


class MoveResponse(BaseModel):
    move: str  # UCI format: "g1f3"


def uci_to_san(board: chess.Board, uci_move: str) -> str:
    """Convert UCI (e2e4) to SAN (e4)"""
    move = chess.Move.from_uci(uci_move)
    return board.san(move)


def san_to_uci(board: chess.Board, san_move: str) -> str:
    """Convert SAN (e4) to UCI (e2e4)"""
    move = board.parse_san(san_move)
    return move.uci()


def prepare_game_data(uci_moves: list[str]) -> tuple[list[int], list[int], list[int]]:
    """Convert UCI moves to model input format"""
    board = chess.Board()
    colors = []
    moves = []
    theory = []
    
    for uci in uci_moves:
        # Convert UCI to SAN for move lookup
        san = uci_to_san(board, uci)
        
        # Get color (1=white, 0=black)
        color = 1 if board.turn == chess.WHITE else 0
        
        # Get move index
        if san not in move_to_number:
            raise HTTPException(400, f"Unknown move: {san}")
        move_idx = move_to_number[san]
        
        # Theory flag (0 for inference)
        theory_flag = 0
        
        colors.append(color)
        moves.append(move_idx)
        theory.append(theory_flag)
        
        board.push_uci(uci)
    
    # Pad sequence to length 6
    while len(moves) < MAX_SEQ_LEN:
        colors.insert(0, 0)
        moves.insert(0, PAD_TOKEN)
        theory.insert(0, 0)
    
    # Take last 6 moves
    colors = colors[-MAX_SEQ_LEN:]
    moves = moves[-MAX_SEQ_LEN:]
    theory = theory[-MAX_SEQ_LEN:]
    
    return colors, moves, theory


@app.get("/")
def root():
    return {"message": "TEORIAT Chess Engine API", "status": "running"}


@app.post("/move", response_model=MoveResponse)
def get_move(req: MoveRequest):
    if not req.moves:
        raise HTTPException(400, "Moves list cannot be empty")
    
    # Prepare input
    colors, moves, theory = prepare_game_data(req.moves)
    
    colors_tensor = torch.tensor([colors]).to(device)
    moves_tensor = torch.tensor([moves]).to(device)
    theory_tensor = torch.tensor([theory]).to(device)
    
    # Get prediction
    with torch.no_grad():
        logits = model(colors_tensor, moves_tensor, theory_tensor)
        move_idx = int(logits.argmax(dim=-1).item())
    
    # Convert back to UCI
    san_move = number_to_move[move_idx]
    board = chess.Board()
    for uci in req.moves:
        board.push_uci(uci)
    
    try:
        uci_move = san_to_uci(board, san_move)
        
        # Validate move is legal
        if chess.Move.from_uci(uci_move) not in board.legal_moves:
            raise HTTPException(500, f"Model predicted illegal move: {san_move}")
        
        return MoveResponse(move=uci_move)
    
    except ValueError:
        raise HTTPException(500, f"Invalid move predicted: {san_move}")


@app.get("/legal_moves")
def get_legal_moves(moves: str = ""):
    """Get legal moves for current position"""
    board = chess.Board()
    if moves:
        for uci in moves.split(","):
            board.push_uci(uci)
    
    return {"legal_moves": [m.uci() for m in board.legal_moves]}