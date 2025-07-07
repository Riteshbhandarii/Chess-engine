import requests
import psycopg2
import time
from datetime import datetime
from typing import Optional, Dict, Any
from loguru import logger
from data_fetcher import archives  # your list of URLs

# Configure logging
logger.add("chess_ingestion.log", rotation="10 MB", retention="10 days")

# Configuration
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds
REQUEST_TIMEOUT = 30  # seconds

headers = {
    "User-Agent": "ChessIngestor/1.0 (https://github.com/yourusername/yourrepo)"
}


def connect_to_database() -> Optional[psycopg2.extensions.connection]:
    """
    Establish database connection with error handling.

    Returns:
        Database connection object or None if connection fails
    """
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="chess_data",
            user="postgres",
            password="chess_engine",
        )
        logger.info("Successfully connected to database")
        return conn
    except psycopg2.Error as e:
        logger.error(f"Database connection failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error connecting to database: {e}")
        return None


def setup_database_table(conn: psycopg2.extensions.connection) -> bool:
    """
    Create chess_games table with error handling.

    Args:
        conn: Database connection object

    Returns:
        True if table setup successful, False otherwise
    """
    try:
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
        cursor.close()
        logger.info("Database table 'chess_games' is ready")
        return True
    except psycopg2.Error as e:
        logger.error(f"Database table setup failed: {e}")
        conn.rollback()
        return False
    except Exception as e:
        logger.error(f"Unexpected error setting up database table: {e}")
        conn.rollback()
        return False


# Initialize database connection
conn = connect_to_database()
if conn is None:
    logger.error("Failed to connect to database. Exiting.")
    exit(1)

if not setup_database_table(conn):
    logger.error("Failed to setup database table. Exiting.")
    conn.close()
    exit(1)


def fetch_with_retry(
    url: str, headers: Dict[str, str], max_retries: int = MAX_RETRIES
) -> Optional[Dict[str, Any]]:
    """
    Fetch data from URL with retry logic and error handling.

    Args:
        url: URL to fetch data from
        headers: HTTP headers to use
        max_retries: Maximum number of retry attempts

    Returns:
        JSON response data or None if all attempts fail
    """
    for attempt in range(max_retries):
        try:
            logger.info(
                f"Fetching {url} (attempt {attempt + 1}/{max_retries})"
            )
            response = requests.get(
                url, headers=headers, timeout=REQUEST_TIMEOUT
            )

            if response.status_code == 200:
                try:
                    data = response.json()
                    logger.info(f"Successfully fetched data from {url}")
                    return data
                except requests.exceptions.JSONDecodeError as e:
                    logger.error(f"Failed to decode JSON from {url}: {e}")
                    return None
            else:
                logger.warning(f"HTTP {response.status_code} for {url}")
                if response.status_code == 429:  # Rate limited
                    logger.info(
                        f"Rate limited. Waiting {RETRY_DELAY * 2} seconds "
                        "before retry..."
                    )
                    time.sleep(RETRY_DELAY * 2)
                elif response.status_code >= 500:  # Server error, retry
                    logger.info(
                        f"Server error. Retrying in {RETRY_DELAY} seconds..."
                    )
                    time.sleep(RETRY_DELAY)
                else:
                    # Client error, don't retry
                    logger.error(
                        f"Client error {response.status_code} for {url}, "
                        "skipping retries"
                    )
                    return None

        except requests.exceptions.ConnectionError as e:
            logger.error(
                f"Connection error for {url} (attempt {attempt + 1}): {e}"
            )
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
        except requests.exceptions.Timeout as e:
            logger.error(
                f"Timeout error for {url} (attempt {attempt + 1}): {e}"
            )
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
        except requests.exceptions.RequestException as e:
            logger.error(
                f"Request error for {url} (attempt {attempt + 1}): {e}"
            )
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
        except Exception as e:
            logger.error(
                f"Unexpected error for {url} (attempt {attempt + 1}): {e}"
            )
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)

    logger.error(f"Failed to fetch {url} after {max_retries} attempts")
    return None


def validate_api_response(data: Dict[str, Any], url: str) -> bool:
    """
    Validate API response structure before processing.

    Args:
        data: API response data
        url: URL that was fetched for logging

    Returns:
        True if response is valid, False otherwise
    """
    if not isinstance(data, dict):
        logger.error(
            f"Invalid response format from {url}: expected dict, got {type(data)}"
        )
        return False

    if "games" not in data:
        logger.warning(f"No 'games' key in response from {url}")
        return False

    if not isinstance(data["games"], list):
        logger.error(
            f"Invalid games format from {url}: expected list, got {type(data['games'])}"
        )
        return False

    logger.info(
        f"API response validation successful for {url}: "
        f"{len(data['games'])} games found"
    )
    return True


def validate_game_data(game: Dict[str, Any]) -> bool:
    """
    Validate individual game data structure.

    Args:
        game: Game data dictionary

    Returns:
        True if game data is valid, False otherwise
    """
    required_fields = ["url", "white", "black"]

    for field in required_fields:
        if field not in game:
            logger.warning(f"Missing required field '{field}' in game data")
            return False

    if not isinstance(game.get("white"), dict) or "username" not in game["white"]:
        logger.warning("Invalid white player data in game")
        return False

    if not isinstance(game.get("black"), dict) or "username" not in game["black"]:
        logger.warning("Invalid black player data in game")
        return False

    return True


def process_game(game: Dict[str, Any], cursor: psycopg2.extensions.cursor) -> bool:
    """
    Process individual game data and insert into database.

    Args:
        game: Game data dictionary
        cursor: Database cursor

    Returns:
        True if game processed successfully, False otherwise
    """
    try:
        # Validate game data first
        if not validate_game_data(game):
            logger.warning(f"Skipping invalid game data: {game.get('url', 'unknown')}")
            return False

        # Extract game data with error handling
        game_id = game["url"].split("/")[-1]
        player_white = game["white"]["username"]
        rating_white = game["white"].get("rating")
        player_black = game["black"]["username"]
        rating_black = game["black"].get("rating")
        pgn = game.get("pgn", "")

        # Handle end_time conversion with error handling
        end_time = None
        if "end_time" in game:
            try:
                end_time = datetime.fromtimestamp(game["end_time"])
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid end_time for game {game_id}: {e}")

        time_class = game.get("time_class")
        time_control = game.get("time_control")
        rated = game.get("rated")
        winner = game.get("winner")
        game_url = game.get("url")

        cursor.execute(
            """
            INSERT INTO chess_games (
                game_id, player_white, rating_white,
                player_black, rating_black, pgn,
                end_time, time_class, time_control,
                rated, winner, url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (game_id) DO NOTHING;
        """,
            (
                game_id,
                player_white,
                rating_white,
                player_black,
                rating_black,
                pgn,
                end_time,
                time_class,
                time_control,
                rated,
                winner,
                game_url,
            ),
        )

        logger.debug(f"Successfully processed game {game_id}")
        return True

    except psycopg2.Error as e:
        logger.error(
            f"Database error processing game {game.get('url', 'unknown')}: {e}"
        )
        return False
    except KeyError as e:
        logger.error(
            f"Missing required field processing game {game.get('url', 'unknown')}: {e}"
        )
        return False
    except Exception as e:
        logger.error(
            f"Unexpected error processing game {game.get('url', 'unknown')}: {e}"
        )
        return False


# Main processing loop
logger.info("Starting chess game data ingestion")
total_games_processed = 0
total_games_failed = 0

for url in archives:
    try:
        # Fetch data with retry logic
        data = fetch_with_retry(url, headers)

        if data is None:
            logger.error(f"Failed to fetch data from {url}, skipping")
            continue

        # Validate API response
        if not validate_api_response(data, url):
            logger.error(f"Invalid API response from {url}, skipping")
            continue

        games = data.get("games", [])
        games_processed = 0
        games_failed = 0

        cursor = conn.cursor()

        for game in games:
            if process_game(game, cursor):
                games_processed += 1
                total_games_processed += 1
            else:
                games_failed += 1
                total_games_failed += 1

        # Commit after processing all games from this URL
        try:
            conn.commit()
            logger.info(f"Successfully processed {games_processed} games from {url}")
            if games_failed > 0:
                logger.warning(f"Failed to process {games_failed} games from {url}")
        except psycopg2.Error as e:
            logger.error(f"Failed to commit games from {url}: {e}")
            conn.rollback()

        cursor.close()

    except Exception as e:
        logger.error(f"Unexpected error processing URL {url}: {e}")
        continue

logger.info(
    f"Data ingestion completed. Total games processed: {total_games_processed}, "
    f"Total games failed: {total_games_failed}"
)

# Clean up
try:
    conn.close()
    logger.info("Database connection closed successfully")
except Exception as e:
    logger.error(f"Error closing database connection: {e}")

logger.info("Chess game data ingestion finished")
