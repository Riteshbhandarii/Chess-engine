import chess

board = chess.Board()

def make_move_uci(uci: str) -> bool:
    try:
        move = chess.Move.from_uci(uci)
    except ValueError:
        return False
    if move in board.legal_moves:
        board.push(move)
        return True
    return False

def get_board_fen() -> str:
    return board.fen()

def get_legal_moves():
    return [m.uci() for m in board.legal_moves]

def reset_board():
    board.reset()
