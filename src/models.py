from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    player_name: str = Field(index=True)
    result: str  # "win" | "loss" | "draw"
    mode: Optional[str] = None
    pgn: Optional[str] = None
    played_at: datetime
