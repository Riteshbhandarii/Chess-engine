
# TEORIAT Chess Engine

**TEORIAT** is a personalized chess engine that learns to imitate a specific player’s style from their Chess.com game history.
Rather than aiming for perfect play, it models how *you* actually play and serves that behavior through a production-ready web application.

---

## Table of Contents

* [Overview](#overview)
* [Architecture](#architecture)
* [Core Features](#core-features)
* [Modeling Approach](#modeling-approach)
* [Data Pipeline](#data-pipeline)
* [Web Application](#web-application)
* [Local Development](#local-development)
* [Deployment](#deployment)
* [Roadmap](#roadmap)

---

## Overview

TEORIAT consumes complete Chess.com game histories, stores them in PostgreSQL, and trains a recurrent neural network to predict the next move TEORIAT would play given the current game history.

The trained model is exposed behind a **FastAPI** backend, while a **React** frontend provides a polished playing experience with timers, move lists, and a persistent leaderboard.

---

## Architecture

High-level components:

### Data Layer

* PostgreSQL database for games, moves, and mined opening patterns
* Python scripts and notebooks for extraction, cleaning, and exploratory analysis

### Modeling Layer

* PyTorch GRU-based model for sequential move prediction, blended with chess heuristics at inference
* Time-series-aware train/validation splitting and evaluation

### Backend

* FastAPI application providing REST endpoints for:

  * Online play (move generation via TEORIAT)
  * Leaderboard aggregation and persistence
  * Internal utilities for data loading and health checks

### Frontend

* React single-page application (SPA) deployed on Vercel
* Uses `react-chessboard` for interactive play
* Communicates with the backend via a configurable API base URL

---

## Core Features

### ♟ Personalized Engine Behavior

Learns statistical patterns from your own games and reproduces them over the board.

### 📥 Full Game Ingestion from Chess.com

Scripts for fetching, parsing, and storing complete game histories in PostgreSQL.

### 🧠 Neural Move Prediction

Sequence-to-distribution model that outputs probabilities over the move vocabulary at each TEORIAT decision point.

### 🌐 Production-Ready Web UI

Landing page, username selection, game configuration, and live play in a cohesive visual style.

### 🏆 Persistent Leaderboard

Aggregated stats per user and per time control (bullet / rapid vs TEORIAT), backed by the same database as the engine data.

---


## Screenshots

![Landing page with the tagline "The art of thinking ahead" and a Begin button](docs/landing-teoriat.webp)
![Username selection screen](docs/username-teoriat.webp)
![Game settings screen with a board preview, time control and side choice](docs/settings-teoriat.webp)
![In-game view with board, clocks, captured pieces and move list](docs/game-teoriat.webp)
![Leaderboard table of players and results](docs/leaderboard-teoriat.webp)



---

## Modeling Approach

### Problem Definition

Given a game’s move history up to the current ply, predict the next move TEORIAT will play **if it is TEORIAT’s turn**.

The model is not asked to evaluate positions or compute best moves—it is trained purely to imitate historical behavior.

---

### Input Representation

The model sees the last `6` plies of the game (`MAX_SEQ_LEN`), left-padded with a pad token when the game is shorter. Each ply has three features:

* `move_id` — integer index of the SAN move in the move vocabulary (`1928` entries including padding)
* `color_id` — `1` if white played the move, `0` if black
* `theory_flag` — currently always `0` at inference

For each timestep:

* `move_id` → embedding layer (dimension `128`)
* `color_id` → embedding layer (dimension `32`)
* `theory_flag` → embedding layer (dimension `32`)

The three embeddings are concatenated into a `192`-dimensional vector and passed through layer normalisation.

---

### Network Architecture

Implemented in PyTorch (`ChessRNN` in `src/app.py`):

* **Recurrent Stack**

  * 2-layer GRU with `256` hidden units
  * Dropout `0.3` between layers

* **Classification Head**

  * Dropout, then a fully connected layer (`256 → 256`) with ReLU
  * Dropout, then an output layer with `vocab_size` logits

At inference the top `120` model candidates are re-scored with simple heuristics (captures, checks, hanging pieces, repetition) and the final move is sampled from the best few (temperature `0.9`). An opening book (`src/book.bin`) is used when present.

Training uses cross-entropy loss; see `src/notebooks/RNN_model.ipynb` for the training code.

---

## Data Pipeline

The data pipeline is designed for reproducibility and clean separation of concerns.

---

### Database Schema

**`chess_games`**

* Per-game metadata (IDs, timestamps, results, time controls, etc.)

**`game_moves`**

* One row per move:

  * `game_id`
  * `move_number`, `ply_number`
  * `player_color`
  * `move_san`
  * `is_teoriat_move`
  * `teoriat_color`

**`opening_patterns`**

* Aggregated opening sequences
* Frequencies and basic performance statistics

---

### Extraction and Cleaning

* Connects to PostgreSQL via SQLAlchemy
* Loads moves per game and aggregates ordered sequences
* Converts SAN moves into `(color_id, move_id, teoriat_flag)` encodings
* Uses time-series-aware splitting (e.g. `TimeSeriesSplit` at game level) to prevent data leakage

The notebooks and `src/tables.py` need extra packages that the API does not: install them with `pip install -r requirements-dev.txt`.

---

## Web Application

### Backend (FastAPI)

Located under `src/`.

Responsibilities:

* Load trained PyTorch model at startup
* Accept move history and return TEORIAT’s next move
* Persist completed games and results
* Serve aggregated leaderboard data

Runs with **Uvicorn** and is designed for deployment on **Render**.

---

### Frontend (React)

Located under `teoriat-chess/`.

Key screens:

* **Landing / Hero**
* **Username / Sign-In**
* **Game Setup**

  * Time controls (bullet / rapid)
  * Side selection (white or black)
* **Game View**

  * Interactive board
  * Move history
  * Captured pieces
  * Dual clocks
  * Result dialog
* **Leaderboard**

  * Separate bullet and rapid tables
  * Per-user win/loss/draw stats vs TEORIAT

**Configuration**

* Environment variable:

  ```
  REACT_APP_API_BASE
  ```
* Defaults to `http://127.0.0.1:8000` in development
* Set to Render backend URL in production

---

## Local Development

### Prerequisites

* Python 3.10+
* Node.js & npm
* PostgreSQL instance

---

### Backend

```bash
# from repository root
cd src

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r ../requirements.txt

# set database and model environment variables
uvicorn src.app:app --reload
```

Backend runs at:
`http://127.0.0.1:8000`

---

### Frontend

```bash
cd teoriat-chess
npm install
npm start
```

Frontend runs at:
`http://localhost:3000`

---

## Deployment

### Backend (Render)

1. Create a new **Web Service** from the repository
2. Root directory: repository root
3. Start command:

   ```bash
   uvicorn src.app:app --host 0.0.0.0 --port 8000
   ```
4. Configure environment variables:

   * Database URL
   * Model paths
   * Secret keys (if any)

---

### Frontend (Vercel)

1. Import repository into Vercel
2. Project root: `teoriat-chess`
3. Build command:

   ```bash
   npm run build
   ```
4. Output directory:

   ```
   build
   ```
5. Environment variable:

   ```
   REACT_APP_API_BASE=https://<your-render-service>.onrender.com
   ```

Vercel will auto-deploy on each push.

---

## Roadmap

* Replace the GRU with transformer-based architectures
* Add lightweight board-state features
* Implement k-fold cross-validation and richer evaluation
* Public player profiles and game browser
* Online learning / continual fine-tuning from new games
