# Chess Engine Setup Guide

## 1. Create Virtual Environment

```bash
# Navigate to project directory
cd /Users/riteshbhandari/Chess-engine

# Create virtual environment
python3 -m venv chess_venv

# Activate virtual environment
source chess_venv/bin/activate

# Verify activation (should show chess_venv in prompt)
which python
```

## 2. Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt

# Verify installation
python -c "import torch; print(f'PyTorch version: {torch.__version__}')"
python -c "import chess; print('python-chess installed successfully')"
```

## 3. Start Development

```bash
# Start Jupyter notebook
jupyter notebook bot/notebooks/

# Or start JupyterLab
jupyter lab bot/notebooks/
```

## 4. Deactivate Environment

```bash
# When done working
deactivate
```

## Environment Details

- **Python Version**: 3.8+
- **Virtual Environment**: chess_venv
- **Key Libraries**: PyTorch, python-chess, pandas, PostgreSQL

