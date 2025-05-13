import requests
import time

# List of archive URLs provided
archives = [
    "https://api.chess.com/pub/player/teoriat/games/2023/01",
    "https://api.chess.com/pub/player/teoriat/games/2023/02",
    "https://api.chess.com/pub/player/teoriat/games/2023/03",
    "https://api.chess.com/pub/player/teoriat/games/2023/04",
    "https://api.chess.com/pub/player/teoriat/games/2023/05",
    "https://api.chess.com/pub/player/teoriat/games/2023/06",
    "https://api.chess.com/pub/player/teoriat/games/2023/07",
    "https://api.chess.com/pub/player/teoriat/games/2023/08",
    "https://api.chess.com/pub/player/teoriat/games/2023/09",
    "https://api.chess.com/pub/player/teoriat/games/2023/10",
    "https://api.chess.com/pub/player/teoriat/games/2023/11",
    "https://api.chess.com/pub/player/teoriat/games/2023/12",
    "https://api.chess.com/pub/player/teoriat/games/2024/01",
    "https://api.chess.com/pub/player/teoriat/games/2024/02",
    "https://api.chess.com/pub/player/teoriat/games/2024/03",
    "https://api.chess.com/pub/player/teoriat/games/2024/04",
    "https://api.chess.com/pub/player/teoriat/games/2024/05",
    "https://api.chess.com/pub/player/teoriat/games/2024/06",
    "https://api.chess.com/pub/player/teoriat/games/2024/07",
    "https://api.chess.com/pub/player/teoriat/games/2024/08",
    "https://api.chess.com/pub/player/teoriat/games/2024/09",
    "https://api.chess.com/pub/player/teoriat/games/2024/10",
    "https://api.chess.com/pub/player/teoriat/games/2024/11",
    "https://api.chess.com/pub/player/teoriat/games/2024/12",
    "https://api.chess.com/pub/player/teoriat/games/2025/01",
    "https://api.chess.com/pub/player/teoriat/games/2025/02",
    "https://api.chess.com/pub/player/teoriat/games/2025/03",
    "https://api.chess.com/pub/player/teoriat/games/2025/04",
    "https://api.chess.com/pub/player/teoriat/games/2025/05"
]

