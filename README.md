# TEORIAT Chess Engine

TEORIAT is a personalized chess engine that learns to play like you using your Chess.com game history. Instead of striving for perfect play, it captures **your unique playing style** using recurrent neural networks (RNNs).

---

## Features

- Fetches all your Chess.com games  
- Analyzes move sequences and patterns  
- Trains an RNN to learn your move sequences  
- Predicts your next move based on historical gameplay  
- Stores all data in PostgreSQL for fast analysis  

---

## Neural Network Approach

### Goal: Sequential Move Prediction

The engine focuses on predicting the next move based on previous sequences, rather than evaluating positions perfectly. It learns patterns such as *“after e4 and e5, I usually play Nf3.”*

### Data Format

- **Input per move**:  
  - `color` (0 = White, 1 = Black)  
  - `move_id` (0–1926; 1927 unique moves)  
  - `theoriat_move` (0 = opponent, 1 = TEORIAT)  

- **Output**: Probability distribution over 1927 possible moves  
- **Dataset**: 166,277 moves from 5,821 games, organized in sequences  

### How It Works

1. **Move Embedding**  
   - Each move ID is converted into a 32-dimensional vector  
   - Embedding captures similarities between moves  

2. **Sequence Processing**  
   - LSTM processes sequences of moves with metadata (`color` + `theoriat_move`)  
   - Captures opening preferences, tactics, and endgame style  

3. **Move Prediction**  
   - Output layer: 1927 neurons with softmax activation  
   - Predicts the probability of the next move by TEORIAT  

### Why RNN/LSTM?

- Learns temporal patterns, not just board positions  
- Captures personalized opening repertoire  
- Efficient input representation compared to full board encoding  

---

## Neural Network Architecture

- **Embedding Layer:** 1927 moves → 32-dimensional vectors  
- **Additional Features:** color (1), theoriat_move (1)  
- **Input per timestep:** 34 features (32 + 1 + 1)  
- **LSTM Layers:** 128 → 64 hidden units  
- **Output Layer:** 1927 neurons (softmax)  
- **Performance:** 72.4% Top-1 accuracy, 91.8% Top-5 accuracy on unseen games  

---

## Database Structure

- **`chess_games`** – Metadata for all games (5,821 games)  
- **`game_moves`** – Every move from every game (166,277 moves)  
- **`opening_patterns`** – Learned opening repertoire (2,357 patterns)  

---

## Data Splitting Strategy

- Split by complete games to prevent leakage  
- TimeSeriesSplit ensures generalization to future/unseen games  

---

## Tech Stack

- **Python** – Data processing and analysis  
- **PyTorch** – Neural network framework (RNN/LSTM)  
- **PostgreSQL** – Data storage for games and moves  
- **Jupyter Notebook** – Development and analysis  
- **Chess.com API** – Game data source  
- **python-chess** – PGN parsing and chess logic  

---

## Future Improvements

- Implement 5-fold cross-validation for robust performance metrics  
- Explore transformer-based architectures for sequence prediction  
- Expand move embeddings to include contextual board state  

---

## License

This project is licensed under the MIT License.
