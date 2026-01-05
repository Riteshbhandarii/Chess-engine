from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field


class Result(str, Enum):
    win = "win"
    loss = "loss"
    draw = "draw"


class Mode(str, Enum):
    bullet = "bullet"
    rapid = "rapid"


class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    player_name: str = Field(index=True)
    result: Result
    mode: Mode
    pgn: Optional[str] = None
    played_at: datetime
