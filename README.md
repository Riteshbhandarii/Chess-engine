# TEORIAT Chess Engine

Building a personalized chess engine that plays like me, based on my Chess.com game history using recurrent neural networks.

## What It Does

- Fetches all my Chess.com games
- Analyzes move sequences and playing patterns  
- **Trains an RNN to learn my move sequences**
- **Creates an AI that plays chess like me**
- Stores everything in PostgreSQL for fast analysis

---

## Neural Network Approach

### **Goal: Sequential Move Prediction**

Instead of building a "perfect" chess engine, we're building an AI that **learns my playing style** by understanding move sequences. The model learns patterns like "after I play e4, then e5, I usually follow with Nf3."

### **Data Format**

- **Input**: Sequence of moves with metadata
  - Each move: (color, move\_as\_integer, your\_move)
  - Move integers: 0-1926 (**1927 unique moves** total)
  - Color: 0 or 1 (White/Black)
  - Your move: 0 or 1 (my move or opponent's)
- **Output**: Probability distribution over 1927 possible next moves
- **Training**: 166,277 moves from my games organized as sequences

### **How It Works**

1. **Move Embedding**: Each move ID (0-1926) is converted into a learned vector
   - Embedding dimension: 16-32 numbers per move
   - The network learns which moves are similar during training
   - Example: Opening moves might cluster together in embedding space

2. **Sequence Processing**: RNN/LSTM processes move sequences
   - Input: Previous moves in the game (embedded + color + turn info)
   - The network learns temporal patterns in my gameplay
   - Captures opening preferences, middlegame tactics, endgame style

3. **Move Prediction**: Output layer predicts next move
   - 1927 output neurons (one per possible move)
   - Softmax activation gives probability distribution
   - Predicts what I would play given the game history

### **Why RNN Instead of Position-Based?**

- **Learns temporal patterns**: Understands move sequences, not just static positions
- **Captures my opening repertoire**: Learns "after e4, I usually play this"
- **More natural for game flow**: Chess is sequential - the RNN respects that
- **Smaller input size**: Embeddings are more efficient than encoding full board states

---

## Database Structure

- **`chess_games`** - All game metadata (5,821 games)
- **`game_moves`** - Every move from every game (166,277 moves) 
- **`opening_patterns`** - Your opening repertoire (2,357 patterns)

---

## Neural Network Architecture (Final)

- **Embedding Layer**: 1927 moves → 32-dimensional vectors
- **Additional Features**: color (1), your\_move (1)
- **Input per timestep**: 34 features (32 + 1 + 1)
- **LSTM Layers**: 128 → 64 hidden units
- **Output Layer**: 1927 neurons (softmax over all moves)
- **Achieved Accuracy**: **72.4% Top-1** and **91.8% Top-5** on unseen test data! (Significantly exceeded the original 40%+ target.)

---

## Data Splitting Strategy

- **Training/Validation split by complete games** (not random moves)
- Implemented **TimeSeriesSplit** to prevent data leakage and ensure true generalization to future/unseen games.

---

## Tech Stack

- **Python** - Data processing and analysis
- **PyTorch** - Neural network framework (RNN/LSTM)
- **PostgreSQL** - Game and move storage
- **Jupyter** - Analysis and development
- **Chess.com API** - Game data source
- **python-chess** - PGN parsing and chess logic

---

## Future Improvements

- **Implement 5-Fold Cross-Validation** (Initial training used a single TimeSeriesSplit fold for rapid testing; full cross-validation will provide a more robust performance metric).
