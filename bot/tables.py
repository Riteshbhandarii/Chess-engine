import requests
import psycopg2
from datetime import datetime
from data_fetcher import archives  # your list of URLs

headers = {
    "User-Agent": "ChessIngestor/1.0 (https://github.com/yourusername/yourrepo)"
}

conn = psycopg2.connect(
    host="localhost",
    database="chess_data",
    user="postgres",
    password="chess_engine",
)
cursor = conn.cursor()

table_query = """
CREATE TABLE IF NOT EXISTS chess_games (
    game_id TEXT PRIMARY KEY,
    player_white TEXT NOT NULL,
    rating_white INT,
    player_black TEXT NOT NULL,
    rating_black INT,
    pgn TEXT,
    end_time TIMESTAMP,
    time_class TEXT,
    time_control TEXT,
    rated BOOLEAN,
    winner TEXT,
    loser TEXT,
    result_type TEXT,
    game_result TEXT,
    url TEXT
);

"""
cursor.execute(table_query)
conn.commit()

print("Table 'chess_games' is ready.")

for url in archives:
    print(f"Fetching {url}")
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        games = data.get("games", [])

        for game in games:
            try:
                game_id = game['url'].split('/')[-1]
                player_white = game['white']['username']
                rating_white = game['white'].get('rating')
                player_black = game['black']['username']
                rating_black = game['black'].get('rating')
                pgn = game.get('pgn', '')
                end_time = datetime.fromtimestamp(game['end_time']) if 'end_time' in game else None
                time_class = game.get('time_class')
                time_control = game.get('time_control')
                rated = game.get('rated')
                game_result = game.get('result')  # 'white', 'black', 'draw', 'abort', etc.
                result_type = game.get('result_type')  # 'checkmate', 'resign', 'timeout', etc.
                
                # Determine winner, loser, and game outcome
                winner = None
                loser = None
                
                if game_result == 'white':
                    winner = player_white
                    loser = player_black
                elif game_result == 'black':
                    winner = player_black
                    loser = player_white
                elif game_result == 'draw':
                    winner = 'draw'
                    loser = 'draw'
                elif game_result in ['abort', 'timeout', 'resign']:
                    # Handle special cases
                    if 'winner' in game and game['winner']:
                        winner = game['winner']
                        loser = player_black if winner == player_white else player_white
                    else:
                        winner = 'aborted'
                        loser = 'aborted'
                else:
                    # Fallback to API winner field if available
                    api_winner = game.get('winner')
                    if api_winner:
                        winner = api_winner
                        loser = player_black if winner == player_white else player_white
                
                game_url = game.get('url')

                # Debug: Print detailed game outcome information
                print(f"Game {game_id}: {player_white} vs {player_black}")
                print(f"  Result: {game_result}, Type: {result_type}")
                print(f"  Winner: {winner}, Loser: {loser}")

                cursor.execute("""
                    INSERT INTO chess_games (
                        game_id, player_white, rating_white,
                        player_black, rating_black, pgn,
                        end_time, time_class, time_control,
                        rated, winner, loser, result_type, game_result, url
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (game_id) DO NOTHING;
                """, (
                    game_id, player_white, rating_white,
                    player_black, rating_black, pgn,
                    end_time, time_class, time_control,
                    rated, winner, loser, result_type, game_result, game_url
                ))

            except Exception as e:
                print(f"Error inserting game {game.get('url', 'unknown')}: {e}")
                conn.rollback()

        conn.commit()
        print(f"Inserted {len(games)} games from {url}")

    else:
        print(f"Failed to fetch {url}, status code {response.status_code}")

cursor.close()
conn.close()
print("Done.")
