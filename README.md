TEORIAT Chess Engine
TEORIAT is a personalized chess engine that learns to play like a specific player using their Chess.com game history. It focuses on predicting your move sequences, not perfect engine play, and is deployed as a full web app (frontend on Vercel, backend on Render).
​

Demo
Frontend: https://chess-engine-...vercel.app

Backend API: https://<your-render-service>.onrender.com/api

Screenshots
Place these images inside a docs/ folder in the repo and adjust filenames if needed.

Landing page / quote screen
![Landing page](docs/landing.jpg)

Username & sign‑in dialog
![Username dialog](docs/username.jpg)

Game settings (time control, side selection)
![Game settings](docs/settings.jpg)

In‑game view with clocks, move list and captured pieces
![Game view](docs/game.jpg)

Leaderboard views for rapid and bullet vs TEORIAT
![Leaderboard](docs/leaderboard.jpg)

Features
Fetches and stores all Chess.com games for a given user into PostgreSQL.

Cleans and aggregates moves into per‑game sequences with metadata (color, move id, TEORIAT or opponent).
​

Trains a recurrent neural network that predicts the next TEORIAT move given the full move history of the game so far.
​

Exposes the trained model behind a FastAPI backend for online play and result storage.

Frontend React app with:

Themed landing page and username selection

Time controls (rapid / bullet) and side selection

Live board, clocks, sound effects and move list

Persistent leaderboard split by mode (bullet vs TEORIAT, rapid vs TEORIAT).
​

Data & Preprocessing
All raw data is stored in PostgreSQL and analyzed via notebooks in Analysis.ipynb.
​

Tables

chess_games: per‑game metadata (IDs, time control, result, timestamps).

game_moves: every move with:

player_color

move_san

is_teoriat_move (whether this move was played by TEORIAT)

teoriat_color (color TEORIAT had in the game).
​

opening_patterns: mined opening sequences (SAN strings, frequency and basic stats).
​

Move sequences

Moves are grouped per game_id and converted into ordered lists:

(color, san, is_teoriat_move) for analysis.

(color_id, move_id, theoriat_flag) for model training.
​

color_id: 1 for white, 0 for black.

move_id: integer index for the unique SAN move in the global move vocabulary.

theoriat_flag: 1 if TEORIAT played the move, 0 otherwise.
​

Train / validation split

Splitting is done at the game level using TimeSeriesSplit so that later games are evaluated as “future” data and there is no move leakage between train and validation sets.
​

Neural Network
Problem formulation

Given a sequence of moves in a game, the model predicts the next move played by TEORIAT (conditional on the game history so far). The targets are the move_id values for positions where is_teoriat_move == 1.
​

Input encoding

For each move in a game sequence:

color_id ∈ {0, 1} (black / white).

move_id ∈ [0, vocab_size) where vocab_size = number of unique SAN moves.

theoriat_flag ∈ {0, 1} to distinguish TEORIAT moves vs opponent moves.
​

The pipeline:

move_id is passed through an embedding layer of size 32.

color_id and theoriat_flag are concatenated as extra scalar features.

Final per‑timestep feature vector has dimension 32 + 2 = 34.
​

Architecture

Defined in RNN_model.ipynb as a stacked LSTM classifier:
​

Embedding layer: vocab_size → 32.

LSTM layers:

First LSTM: 128 hidden units.

Second LSTM (stacked): 64 hidden units, with dropout between layers.

Fully connected head:

Linear → ReLU → Linear → output logits of size vocab_size.

Loss: cross‑entropy on the predicted move_id for TEORIAT moves.

Optimizer: Adam or SGD with OneCycleLR learning rate schedule.

Training setup

Batches are sequences of full games, padded and masked where necessary.

TimeSeriesSplit over games: earlier games for training, later ones for validation.
​

Metrics tracked:

Top‑1 accuracy on TEORIAT move prediction.

Top‑k accuracy (e.g. k = 5) to measure how often TEORIAT’s move is in the top candidate list.

(You can update exact numbers here once you fix on the final trained model.)

Backend
The backend is a FastAPI service located under src/ and deployed to Render.

Key components

app.py: FastAPI app, CORS config, and router mounting for the leaderboard and engine endpoints.

models.py / db.py: SQLModel models and session management for PostgreSQL.

leaderboard_routes.py: endpoints for:

Registering finished games (mode, result, timestamps).

Aggregated stats per user and per mode (wins, losses, draws, total games).
​

tables.py: scripts for fetching Chess.com games, converting PGNs, and populating the database with games and moves.
​

Representative endpoints

POST /api/play/move – send current move list / FEN, get TEORIAT’s reply (via the trained model).

POST /api/leaderboard/game – submit a finished game result.

GET /api/leaderboard – fetch bullet and rapid leaderboards.

(Adjust endpoint names here to match your actual FastAPI routes.)

Frontend
The frontend is a React single‑page app located in teoriat-chess/ and deployed to Vercel.
​

Routing

SignIn page – choose username (stored client‑side and used for leaderboard records).
​

Main menu / quote screen – entry point with background artwork and “BEGIN” CTA.

Play page – the core chess UI with:

react-chessboard for board rendering and move interaction.

Time control selection (10 min rapid, 1 min bullet).

Side selection (play white or black).

Custom clocks, move list, captured piece display and result modal.
​

LeaderBoard page – shows separate tables:

Bullet vs TEORIAT.

Rapid vs TEORIAT, including wins, losses, draws and total games per user.
​

API integration

Both Play.jsx and LeaderBoard.jsx use an API_BASE constant:

js
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";
In production, REACT_APP_API_BASE is set in Vercel to the Render backend URL, so all requests go through /api/... on your Render service.
​

UI / UX

Custom CSS for a dark, cinematic feel using background art and subtle gradients.

Responsive layout: board size adapts to viewport width, clocks and panels reposition gracefully on smaller screens.
​

Local Development
Backend

bash
# from repo root
cd src
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

pip install -r ../requirements.txt

uvicorn src.app:app --reload
Backend will run at http://127.0.0.1:8000.

Frontend

bash
cd teoriat-chess
npm install
npm start
Frontend will run at http://localhost:3000 and talk to http://127.0.0.1:8000 by default.

Deployment
Backend: Render Web Service

Start command:

bash
uvicorn src.app:app --host 0.0.0.0 --port 8000
Environment variables: Postgres credentials, model path, etc.

Frontend: Vercel

Root directory: teoriat-chess

Build command: npm run build

Output directory: build

Env var:

REACT_APP_API_BASE=https://<your-render-service>.onrender.com

License
This project is licensed under the MIT License.
