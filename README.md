# TEORIAT Chess Engine

Building a personalized chess engine that plays like me, based on my Chess.com game history using neural networks.

## What It Does

- Fetches all my Chess.com games
- Analyzes my moves and opening preferences  
- **Trains a neural network to predict my moves**
- **Creates an AI that plays chess like me**
- Stores everything in PostgreSQL for fast analysis

## Neural Network Approach

### **Goal: Move Prediction**
Instead of building a "perfect" chess engine, we're building an AI that **learns my playing style** and predicts what moves I would make.

### **Data Format**
- **Input**: Chess position → 768 numbers (64 squares × 12 piece types)
- **Output**: Move prediction → 4,096 numbers (all possible moves)
- **Training**: 166,277 moves from my games

### **How It Works**
1. **Position Encoding**: Each chess position becomes 768 numbers
   - 64 squares × 12 piece types = 768 features
   - Each square gets 12 numbers: [white_pawn, white_rook, ..., black_king]
   - 1 = piece is there, 0 = piece is not there

2. **Move Encoding**: Each move becomes 4,096 numbers
   - 64×64 = 4,096 possible moves (from any square to any square)
   - Only one position is 1 (the move I played), rest are 0

3. **Neural Network**: Learns patterns like "In this position, I usually play this move"

## Quick Start

1. **Setup Database:**
   ```bash
   # Make sure PostgreSQL is running with database 'chess_data'
   python bot/tables.py
   ```

2. **Preprocess Data for Neural Network:**
   ```bash
   # Convert chess positions and moves to neural network format
   python bot/preprocessing.py
   ```

3. **Train Neural Network:**
   ```bash
   # Train move prediction model on your data
   python bot/train_model.py
   ```

4. **Play Against Your AI:**
   ```bash
   # Play chess against an AI that plays like you
   python bot/chess_interface.py
   ```

## Database Structure

- **`chess_games`** - All game metadata (5,821 games)
- **`game_moves`** - Every move from every game (166,277 moves) 
- **`opening_patterns`** - Your opening repertoire (2,357 patterns)

## Neural Network Architecture

- **Input Layer**: 768 neurons (chess position)
- **Hidden Layers**: 512 → 256 → 128 neurons
- **Output Layer**: 4,096 neurons (possible moves)
- **Training Time**: 2-4 hours on MacBook Pro 2019
- **Memory Usage**: ~3GB (fits in 8GB RAM)

## Tech Stack

- **Python** - Data processing and analysis
- **PyTorch** - Neural network framework
- **PostgreSQL** - Game and move storage
- **Jupyter** - Analysis and development
- **Chess.com API** - Game data source
- **python-chess** - PGN parsing and chess logic



