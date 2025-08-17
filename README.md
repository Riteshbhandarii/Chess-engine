# TEORIAT Chess Engine

Building a personalized chess engine that plays like me, based on my Chess.com game history.

## What It Does

- Fetches all my Chess.com games
- Analyzes my moves and opening preferences  
- Creates an engine that mimics my playing style
- Stores everything in PostgreSQL for fast analysis

## Quick Start

1. **Setup Database:**
   ```bash
   # Make sure PostgreSQL is running with database 'chess_data'
   python bot/tables.py
   ```

2. **Analyze in Jupyter:**
   ```bash
   jupyter notebook bot/notebooks/
   ```

3. **Query Your Data:**
   ```python
   games = pd.read_sql("SELECT * FROM chess_games", engine)
   your_moves = pd.read_sql("SELECT * FROM game_moves WHERE is_teoriat_move = true", engine)
   openings = pd.read_sql("SELECT * FROM opening_patterns ORDER BY frequency DESC", engine)
   ```

## Database Structure

- **`chess_games`** - All game metadata (6,102 games)
- **`game_moves`** - Every move from every game (61,600 moves) 
- **`opening_patterns`** - Your opening repertoire (440 patterns)

## Tech Stack

- **Python** - Data processing and analysis
- **PostgreSQL** - Game and move storage
- **Jupyter** - Analysis and engine development
- **Chess.com API** - Game data source
- **python-chess** - PGN parsing and chess logic



