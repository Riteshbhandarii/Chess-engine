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
                winner = game.get('winner')  # no fallback inference
                game_url = game.get('url')

                cursor.execute("""
                    INSERT INTO chess_games (
                        game_id, player_white, rating_white,
                        player_black, rating_black, pgn,
                        end_time, time_class, time_control,
                        rated, winner, url
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (game_id) DO NOTHING;
                """, (
                    game_id, player_white, rating_white,
                    player_black, rating_black, pgn,
                    end_time, time_class, time_control,
                    rated, winner, game_url
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
