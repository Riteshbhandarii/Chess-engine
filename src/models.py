from datetime import datetime
from typing import Optional, Literal

from sqlmodel import SQLModel, Field

Result = Literal["win", "loss", "draw"]
Mode = Literal["bullet", "rapid"]


class Game(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    player_name: str = Field(index=True)
    result: Result
    mode: Mode

    pgn: Optional[str] = None
    played_at: datetime
