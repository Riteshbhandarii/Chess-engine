"""Complete database operations for chess games and moves"""

import requests
import psycopg2
from datetime import datetime
import chess
import chess.pgn
import io
from collections import Counter

# Chess.com API URLs for teoriat's games
archives = [
    f"https://api.chess.com/pub/player/teoriat/games/{year}/{month:02d}"
    for year in [2023, 2024, 2025]
    for month in range(1, 13)
    if not (year == 2025 and month > 8)  # Only up to August 2025
]

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'database': 'chess_data', 
    'user': 'postgres',
    'password': 'chess_engine'
}

HEADERS = {'User-Agent': 'TeoriatEngine/1.0'}

def create_tables():
    """Create all chess tables"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Main games table
    cursor.execute("""
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
    """)
    
    # Individual moves table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_moves (
            id SERIAL PRIMARY KEY,
            game_id TEXT REFERENCES chess_games(game_id),
            move_number INT,
            player_color TEXT,
            move_san TEXT,
            position_before TEXT,
            position_after TEXT,
            is_teoriat_move BOOLEAN,
            teoriat_color TEXT
        );
    """)
    
    # Opening patterns table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS opening_patterns (
            id SERIAL PRIMARY KEY,
            pattern_name TEXT,
            moves_sequence TEXT[],
            teoriat_color TEXT,
            frequency INT DEFAULT 1,
            win_rate FLOAT
        );
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_moves_teoriat ON game_moves(is_teoriat_move);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_moves_game ON game_moves(game_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_openings_freq ON opening_patterns(frequency DESC);")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("All tables ready")

def fetch_games():
    """Fetch games from Chess.com API"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    total_inserted = 0
    
    for url in archives:
        print(f"Fetching {url.split('/')[-2:]}")
        
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            continue
            
        games = response.json().get('games', [])
        
        for game in games:
            try:
                # Extract game data
                white_player = game['white']['username']
                black_player = game['black']['username']
                pgn_text = game.get('pgn', '')
                
                # Get winner/loser from PGN (more reliable)
                winner, loser = determine_winner_loser_from_pgn(pgn_text, white_player, black_player)
                
                data = (
                    game['url'].split('/')[-1],  # game_id
                    white_player,                # player_white
                    game['white'].get('rating'), # rating_white
                    black_player,                # player_black
                    game['black'].get('rating'), # rating_black
                    pgn_text,                   # pgn
                    datetime.fromtimestamp(game['end_time']) if 'end_time' in game else None,
                    game.get('time_class'),      # time_class
                    game.get('time_control'),    # time_control
                    game.get('rated'),           # rated
                    winner,                      # winner (from PGN)
                    loser,                       # loser (from PGN)
                    game.get('result_type'),     # result_type
                    game.get('result'),          # game_result
                    game.get('url')              # url
                )
                
                cursor.execute("""
                    INSERT INTO chess_games VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (game_id) DO NOTHING
                """, data)
                
            except Exception as e:
                print(f"Error: {e}")
        
        conn.commit()
        total_inserted += len(games)
        print(f"{len(games)} games")
    
    cursor.close()
    conn.close()
    print(f"Total: {total_inserted} games fetched")

def determine_winner_loser_from_pgn(pgn_text, white_player, black_player):
    """Extract winner/loser from PGN result - more reliable than API"""
    if not pgn_text:
        return None, None
    
    import re
    result_match = re.search(r'\[Result "([^"]+)"\]', pgn_text)
    if not result_match:
        return None, None
    
    result = result_match.group(1)
    if result == '1-0':  # White wins
        return white_player, black_player
    elif result == '0-1':  # Black wins
        return black_player, white_player
    elif result == '1/2-1/2':  # Draw
        return 'draw', 'draw'
    return None, None

def parse_pgn_and_store_moves(pgn_text, game_id, player_name="teoriat"):
    """Parse PGN and store individual moves"""
    try:
        game = chess.pgn.read_game(io.StringIO(pgn_text))
        if not game:
            return False
            
        # Determine teoriat's color
        if game.headers.get('White') == player_name:
            teoriat_color = 'white'
        elif game.headers.get('Black') == player_name:
            teoriat_color = 'black'
        else:
            return False  # Teoriat didn't play
            
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check if moves already stored
        cursor.execute("SELECT COUNT(*) FROM game_moves WHERE game_id = %s", (game_id,))
        if cursor.fetchone()[0] > 0:
            cursor.close()
            conn.close()
            return True  # Already processed
        
        board = game.board()
        moves_stored = 0
        
        for i, move in enumerate(game.mainline_moves()):
            current_color = 'white' if board.turn else 'black'
            is_teoriat_move = (current_color == teoriat_color)
            
            # Store move
            cursor.execute("""
                INSERT INTO game_moves (
                    game_id, move_number, player_color, move_san,
                    position_before, position_after, is_teoriat_move, teoriat_color
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                game_id,
                (i // 2) + 1,  # Move number
                current_color,
                board.san(move),
                board.fen(),
                board.copy().push(move).fen(),
                is_teoriat_move,
                teoriat_color
            ))
            
            board.push(move)
            moves_stored += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        return moves_stored > 0
        
    except Exception as e:
        return False

def analyze_and_store_openings():
    """Analyze teoriat's openings and store patterns"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Clear existing patterns
    cursor.execute("DELETE FROM opening_patterns")
    
    # Get teoriat's moves grouped by game and color
    cursor.execute("""
        SELECT game_id, teoriat_color, 
               ARRAY_AGG(move_san ORDER BY move_number) as moves
        FROM game_moves 
        WHERE is_teoriat_move = true 
        GROUP BY game_id, teoriat_color
        HAVING COUNT(*) >= 4
    """)
    
    games_moves = cursor.fetchall()
    
    white_openings = Counter()
    black_openings = Counter()
    
    for game_id, color, moves in games_moves:
        if len(moves) >= 4:
            opening = ' '.join(moves[:4])  # First 4 moves
            
            if color == 'white':
                white_openings[opening] += 1
            else:
                black_openings[opening] += 1
    
    # Store white openings
    for opening, frequency in white_openings.items():
        moves_array = opening.split()
        cursor.execute("""
            INSERT INTO opening_patterns (pattern_name, moves_sequence, teoriat_color, frequency)
            VALUES (%s, %s, %s, %s)
        """, (
            f"White: {' '.join(moves_array[:3])}",
            moves_array,
            'white',
            frequency
        ))
    
    # Store black openings  
    for opening, frequency in black_openings.items():
        moves_array = opening.split()
        cursor.execute("""
            INSERT INTO opening_patterns (pattern_name, moves_sequence, teoriat_color, frequency)
            VALUES (%s, %s, %s, %s)
        """, (
            f"Black: {' '.join(moves_array[:3])}",
            moves_array,
            'black',
            frequency
        ))
    
    conn.commit()
    
    total_patterns = len(white_openings) + len(black_openings)
    print(f"Stored {total_patterns} opening patterns")
    
    cursor.close()
    conn.close()
    return total_patterns

def process_all_games():
    """Process all games to extract and store moves"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get games that need processing
    cursor.execute("""
        SELECT game_id, pgn, player_white, player_black
        FROM chess_games 
        WHERE (player_white = 'teoriat' OR player_black = 'teoriat')
        AND pgn IS NOT NULL 
        AND LENGTH(pgn) > 100
        AND game_id NOT IN (SELECT DISTINCT game_id FROM game_moves WHERE game_id IS NOT NULL)
    """)
    
    games_to_process = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if not games_to_process:
        print("No games to process")
        return
    
    print(f"Processing {len(games_to_process)} games...")
    processed = 0
    
    for game_id, pgn, white, black in games_to_process:
        if parse_pgn_and_store_moves(pgn, game_id):
            processed += 1
            if processed % 50 == 0:
                print(f"Processed {processed}/{len(games_to_process)} games")
    
    print(f"Processed {processed} games successfully")
    
    # Now analyze openings
    print("Analyzing openings...")
    analyze_and_store_openings()

def fix_existing_winner_data():
    """Fix any games with missing winner data"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT game_id, player_white, player_black, pgn 
        FROM chess_games 
        WHERE winner IS NULL AND pgn IS NOT NULL
    """)
    
    games_to_fix = cursor.fetchall()
    if games_to_fix:
        print(f"Fixing {len(games_to_fix)} games with missing winner data...")
        
        for game_id, white, black, pgn in games_to_fix:
            winner, loser = determine_winner_loser_from_pgn(pgn, white, black)
            if winner and loser:
                cursor.execute("""
                    UPDATE chess_games 
                    SET winner = %s, loser = %s
                    WHERE game_id = %s
                """, (winner, loser, game_id))
        
        conn.commit()
        print(f"Fixed {len(games_to_fix)} games")
    
    cursor.close()
    conn.close()

def show_stats():
    """Show database statistics"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    tables = ['chess_games', 'game_moves', 'opening_patterns']
    
    print("DATABASE STATS:")
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"  {table:20s}: {count:>8,d} rows")
        except:
            print(f"  {table:20s}: Not found")
    
    # Show teoriat-specific stats
    try:
        cursor.execute("SELECT COUNT(*) FROM game_moves WHERE is_teoriat_move = true")
        teoriat_moves = cursor.fetchone()[0]
        print(f"  {'teoriat moves':20s}: {teoriat_moves:>8,d} moves")
        
        cursor.execute("SELECT COUNT(*) FROM chess_games WHERE winner = 'teoriat'")
        wins = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM chess_games WHERE (player_white = 'teoriat' OR player_black = 'teoriat')")
        total = cursor.fetchone()[0]
        print(f"  {'win rate':20s}: {wins/total*100:>7.1f}%")
    except:
        pass
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    print("TEORIAT CHESS ENGINE - Database Setup")
    print("=" * 40)
    
    # 1. Create all tables
    create_tables()
    
    # 2. Fetch games from Chess.com
    fetch_games()
    
    # 3. Fix any missing winner data
    fix_existing_winner_data()
    
    # 4. Process all games to extract moves
    process_all_games()
    
    # 5. Show final stats
    print("\nFINAL RESULTS:")
    show_stats()