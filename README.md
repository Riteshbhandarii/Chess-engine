Below is a **clean, GitHub-ready `README.md`** version of your content.
You can **copy-paste this directly** into your repository’s README.

---

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
* [License](#license)

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

* PyTorch LSTM-based model for sequential move prediction
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

Create a `docs/` directory in the repository and place your exported images there, then wire them up as below:

```text
## Screenshots

![Landing page](docs/landing-teoriat.jpg)
![Username selection](docs/username-teoriat.jpg)
![Game settings](docs/settings-teoriat.jpg)
![In-game view](docs/game-teoriat.jpg)
![Leaderboard](docs/leaderboard-teoriat.jpg)

```

---

## Modeling Approach

### Problem Definition

Given a game’s move history up to the current ply, predict the next move TEORIAT will play **if it is TEORIAT’s turn**.

The model is not asked to evaluate positions or compute best moves—it is trained purely to imitate historical behavior.

---

### Input Representation

Each move is converted into a compact tuple:

* `color_id` — `1` for white, `0` for black
* `move_id` — integer index for the SAN move in the global vocabulary
* `teoriat_flag` — `1` if the move was played by TEORIAT, `0` otherwise

For each timestep:

* `move_id` → embedding layer (dimension `32`)
* `color_id` and `teoriat_flag` concatenated as scalar features

**Resulting feature vector:** `34` dimensions per move

Target labels at TEORIAT decision points are the corresponding `move_id` values.

---

### Network Architecture

Implemented in PyTorch as a stacked LSTM classifier:

* **Embedding**

  * `vocab_size → 32`

* **Recurrent Stack**

  * LSTM layer with `128` hidden units
  * LSTM layer with `64` hidden units
  * Optional dropout between layers

* **Classification Head**

  * Fully connected layer with non-linearity
  * Output layer with `vocab_size` logits for softmax

Training details:

* Loss: Cross-entropy
* Optimizer: Adam
* Optional One-Cycle learning-rate schedule

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

* Replace LSTM with transformer-based architectures
* Add lightweight board-state features
* Implement k-fold cross-validation and richer evaluation
* Public player profiles and game browser
* Online learning / continual fine-tuning from new games

---

## License

This project is released under the **MIT License**.
See the `LICENSE` file for details.

---

