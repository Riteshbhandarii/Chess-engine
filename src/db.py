from pathlib import Path
from sqlmodel import SQLModel, Session, create_engine

from . import models  # ensure tables are registered

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "leaderboard.db"

sqlite_url = f"sqlite:///{DB_PATH}"
connect_args = {"check_same_thread": False}

engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
