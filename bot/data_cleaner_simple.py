#!/usr/bin/env python3
"""
Chess Data Cleaning Script - Simplified Version

This script cleans and prepares chess game data for advanced analysis.
It works with CSV files as input/output to avoid database dependencies.
"""

import pandas as pd
import numpy as np
import chess.pgn
from io import StringIO
import re
from datetime import datetime
import logging
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChessDataCleanerSimple:
    def __init__(self):
        """Initialize the data cleaner."""
        self.df = None
        self.cleaned_df = None
        
    def load_data_from_csv(self, csv_file='bot/data/chess_games_raw.csv'):
        """Load chess game data from CSV file."""
        logger.info(f"Loading chess game data from {csv_file}...")
        try:
            if os.path.exists(csv_file):
                self.df = pd.read_csv(csv_file)
                logger.info(f"Loaded {len(self.df)} games from CSV")
                return True
            else:
                logger.error(f"CSV file not found: {csv_file}")
                return False
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            return False
    
    def create_sample_data(self):
        """Create sample data for testing purposes."""
        logger.info("Creating sample data for testing...")
        
        # Sample data structure based on the existing schema
        sample_data = {
            'game_id': ['120636157526', '120636207488', '120636220324', '120636157526'],  # Include duplicate
            'player_white': ['teoriat', 'teoriat', 'MarvelousLuck', 'teoriat'],
            'rating_white': [903, 911, 921, 903],
            'player_black': ['EloLear', 'winnerArmenian', 'teoriat', 'EloLear'],
            'rating_black': [938, 901, 919, 938],
            'pgn': [
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "EloLear"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1-0',
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "winnerArmenian"]\n[Result "0-1"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 0-1',
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "MarvelousLuck"]\n[Black "teoriat"]\n[Result "1/2-1/2"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1/2-1/2',
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "EloLear"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 1-0'
            ],
            'end_time': ['2024-11-01 20:44:18', '2024-11-01 20:44:57', '2024-11-01 20:45:47', '2024-11-01 20:44:18'],
            'time_class': ['rapid', 'rapid', 'rapid', 'rapid'],
            'time_control': ['600', '600', '600', '600'],
            'rated': [True, True, True, True],
            'winner': [None, None, None, None],  # All missing as in original data
            'url': [
                'https://www.chess.com/game/live/120636157526',
                'https://www.chess.com/game/live/120636207488',
                'https://www.chess.com/game/live/120636220324',
                'https://www.chess.com/game/live/120636157526'
            ]
        }
        
        self.df = pd.DataFrame(sample_data)
        logger.info(f"Created sample data with {len(self.df)} games")
        return True
    
    def analyze_data_quality(self):
        """Analyze the current data quality and log findings."""
        logger.info("=== DATA QUALITY ANALYSIS ===")
        logger.info(f"Total games: {len(self.df)}")
        
        # Check for missing values
        missing_values = self.df.isnull().sum()
        logger.info("Missing values by column:")
        for col, count in missing_values.items():
            if count > 0:
                logger.info(f"  {col}: {count} missing values")
        
        # Check for empty strings
        for col in self.df.select_dtypes(include=['object']).columns:
            if col in self.df.columns:
                empty_count = (self.df[col] == '').sum()
                if empty_count > 0:
                    logger.info(f"  {col}: {empty_count} empty strings")
        
        # Check for duplicates
        duplicates = self.df.duplicated().sum()
        duplicate_game_ids = self.df['game_id'].duplicated().sum()
        logger.info(f"Duplicate rows: {duplicates}")
        logger.info(f"Duplicate game_ids: {duplicate_game_ids}")
        
        return {
            'total_games': len(self.df),
            'missing_values': missing_values.to_dict(),
            'duplicates': duplicates,
            'duplicate_game_ids': duplicate_game_ids
        }
    
    def extract_result_from_pgn(self, pgn_text):
        """Extract game result from PGN text."""
        if not pgn_text or pd.isna(pgn_text):
            return None
        
        try:
            # Parse PGN to extract result
            game = chess.pgn.read_game(StringIO(pgn_text))
            if game and game.headers.get('Result'):
                result = game.headers['Result']
                if result == '1-0':
                    return 'white'
                elif result == '0-1':
                    return 'black'
                elif result == '1/2-1/2':
                    return 'draw'
                else:
                    return 'unknown'
            
            # Fallback: look for result pattern in PGN text
            result_patterns = [
                r'1-0\s*$',    # White wins
                r'0-1\s*$',    # Black wins
                r'1/2-1/2\s*$' # Draw
            ]
            
            for i, pattern in enumerate(result_patterns):
                if re.search(pattern, pgn_text, re.MULTILINE):
                    return ['white', 'black', 'draw'][i]
            
            return 'unknown'
            
        except Exception as e:
            logger.warning(f"Error parsing PGN: {e}")
            return 'unknown'
    
    def extract_opening_from_pgn(self, pgn_text):
        """Extract opening name from PGN text."""
        if not pgn_text or pd.isna(pgn_text):
            return None
        
        try:
            game = chess.pgn.read_game(StringIO(pgn_text))
            if game and game.headers.get('Opening'):
                return game.headers['Opening']
            elif game and game.headers.get('ECO'):
                return game.headers['ECO']
            return None
        except Exception as e:
            return None
    
    def calculate_game_duration(self, pgn_text):
        """Calculate game duration from PGN text (number of moves)."""
        if not pgn_text or pd.isna(pgn_text):
            return None
        
        try:
            game = chess.pgn.read_game(StringIO(pgn_text))
            if game:
                moves = 0
                node = game
                while node.variations:
                    moves += 1
                    node = node.variations[0]
                return moves
            return None
        except Exception as e:
            return None
    
    def standardize_player_names(self):
        """Standardize player name formats."""
        logger.info("Standardizing player names...")
        
        # Remove leading/trailing whitespace and convert to lowercase for consistency
        self.cleaned_df['player_white'] = self.cleaned_df['player_white'].str.strip().str.lower()
        self.cleaned_df['player_black'] = self.cleaned_df['player_black'].str.strip().str.lower()
        
        # Log unique player count
        unique_players = set(self.cleaned_df['player_white'].unique()) | set(self.cleaned_df['player_black'].unique())
        logger.info(f"Found {len(unique_players)} unique players")
    
    def standardize_time_formats(self):
        """Standardize time control formats."""
        logger.info("Standardizing time control formats...")
        
        # Convert time_control to consistent format
        def standardize_time_control(time_control):
            if pd.isna(time_control) or time_control == '':
                return 'unknown'
            
            # Convert to string and clean
            time_str = str(time_control).strip()
            
            # Handle common formats
            if time_str.isdigit():
                return f"{time_str}+0"  # Add increment if missing
            elif '+' in time_str:
                return time_str  # Already in proper format
            else:
                return time_str
        
        self.cleaned_df['time_control'] = self.cleaned_df['time_control'].apply(standardize_time_control)
        
        # Standardize time_class
        self.cleaned_df['time_class'] = self.cleaned_df['time_class'].str.strip().str.lower()
        
    def handle_missing_values(self):
        """Handle missing and malformed fields."""
        logger.info("Handling missing values...")
        
        # Create a copy for cleaning
        self.cleaned_df = self.df.copy()
        
        # Handle missing ratings - fill with median rating for the time class
        for rating_col in ['rating_white', 'rating_black']:
            if self.cleaned_df[rating_col].isnull().any():
                median_rating = self.cleaned_df[rating_col].median()
                self.cleaned_df[rating_col].fillna(median_rating, inplace=True)
                logger.info(f"Filled missing {rating_col} with median: {median_rating}")
        
        # Handle missing PGN - mark as invalid
        missing_pgn = self.cleaned_df['pgn'].isnull().sum()
        if missing_pgn > 0:
            self.cleaned_df['pgn_valid'] = ~self.cleaned_df['pgn'].isnull()
            logger.info(f"Marked {missing_pgn} games with missing PGN")
        else:
            self.cleaned_df['pgn_valid'] = True
        
        # Handle missing winner field - extract from PGN
        logger.info("Extracting winner information from PGN...")
        self.cleaned_df['winner_extracted'] = self.cleaned_df['pgn'].apply(self.extract_result_from_pgn)
        
        # Use extracted winner if original is missing
        self.cleaned_df['winner_cleaned'] = self.cleaned_df['winner'].fillna(self.cleaned_df['winner_extracted'])
        
        winner_extracted_count = (self.cleaned_df['winner'].isnull() & 
                                self.cleaned_df['winner_extracted'].notnull()).sum()
        logger.info(f"Extracted winner information for {winner_extracted_count} games")
        
        # Handle missing end_time
        if self.cleaned_df['end_time'].isnull().any():
            missing_end_time = self.cleaned_df['end_time'].isnull().sum()
            logger.info(f"Found {missing_end_time} games with missing end_time")
        
        # Handle missing URLs
        missing_urls = self.cleaned_df['url'].isnull().sum()
        if missing_urls > 0:
            logger.info(f"Found {missing_urls} games with missing URLs")
    
    def remove_duplicates(self):
        """Remove or flag duplicate games."""
        logger.info("Removing duplicate games...")
        
        initial_count = len(self.cleaned_df)
        
        # Remove exact duplicates
        self.cleaned_df = self.cleaned_df.drop_duplicates()
        exact_duplicates_removed = initial_count - len(self.cleaned_df)
        
        # Remove games with duplicate game_ids (keep first occurrence)
        self.cleaned_df = self.cleaned_df.drop_duplicates(subset=['game_id'], keep='first')
        game_id_duplicates_removed = initial_count - exact_duplicates_removed - len(self.cleaned_df)
        
        logger.info(f"Removed {exact_duplicates_removed} exact duplicates")
        logger.info(f"Removed {game_id_duplicates_removed} duplicate game_ids")
        logger.info(f"Final count: {len(self.cleaned_df)} games")
    
    def create_derived_columns(self):
        """Create derived columns for analysis."""
        logger.info("Creating derived columns...")
        
        # Game duration (number of moves)
        self.cleaned_df['game_duration_moves'] = self.cleaned_df['pgn'].apply(self.calculate_game_duration)
        
        # Rating difference (white - black)
        self.cleaned_df['rating_difference'] = (self.cleaned_df['rating_white'] - 
                                              self.cleaned_df['rating_black'])
        
        # Average rating
        self.cleaned_df['average_rating'] = (self.cleaned_df['rating_white'] + 
                                           self.cleaned_df['rating_black']) / 2
        
        # Player color for main player (assuming 'teoriat' is the main player)
        main_player = 'teoriat'
        self.cleaned_df['main_player_color'] = self.cleaned_df.apply(
            lambda row: 'white' if row['player_white'] == main_player else 
                       'black' if row['player_black'] == main_player else 'neither', 
            axis=1
        )
        
        # Game result for main player
        self.cleaned_df['main_player_result'] = self.cleaned_df.apply(
            lambda row: self._get_player_result(row, main_player), axis=1
        )
        
        # Extract opening information
        self.cleaned_df['opening'] = self.cleaned_df['pgn'].apply(self.extract_opening_from_pgn)
        
        # Time control category
        self.cleaned_df['time_category'] = self.cleaned_df['time_control'].apply(
            self._categorize_time_control
        )
        
        # Date components
        self.cleaned_df['end_time'] = pd.to_datetime(self.cleaned_df['end_time'])
        self.cleaned_df['game_date'] = self.cleaned_df['end_time'].dt.date
        self.cleaned_df['game_year'] = self.cleaned_df['end_time'].dt.year
        self.cleaned_df['game_month'] = self.cleaned_df['end_time'].dt.month
        
        logger.info("Created derived columns: game_duration_moves, rating_difference, average_rating, main_player_color, main_player_result, opening, time_category, game_date, game_year, game_month")
    
    def _get_player_result(self, row, player_name):
        """Get result for a specific player."""
        if row['main_player_color'] == 'neither':
            return 'not_playing'
        
        winner = row['winner_cleaned']
        if pd.isna(winner) or winner == 'unknown':
            return 'unknown'
        
        if winner == 'draw':
            return 'draw'
        elif (winner == 'white' and row['main_player_color'] == 'white') or \
             (winner == 'black' and row['main_player_color'] == 'black'):
            return 'win'
        else:
            return 'loss'
    
    def _categorize_time_control(self, time_control):
        """Categorize time control into standard categories."""
        if pd.isna(time_control) or time_control == 'unknown':
            return 'unknown'
        
        time_str = str(time_control).lower()
        
        if 'bullet' in time_str:
            return 'bullet'
        elif 'blitz' in time_str:
            return 'blitz'
        elif 'rapid' in time_str:
            return 'rapid'
        elif 'classical' in time_str or 'standard' in time_str:
            return 'classical'
        else:
            # Try to categorize by time
            try:
                base_time = int(time_str.split('+')[0])
                if base_time < 180:  # Less than 3 minutes
                    return 'bullet'
                elif base_time < 600:  # Less than 10 minutes
                    return 'blitz'
                elif base_time < 1800:  # Less than 30 minutes
                    return 'rapid'
                else:
                    return 'classical'
            except:
                return 'unknown'
    
    def validate_data_integrity(self):
        """Validate data integrity with various checks."""
        logger.info("Validating data integrity...")
        
        validation_results = {}
        
        # Check if ratings are within reasonable range
        rating_cols = ['rating_white', 'rating_black']
        for col in rating_cols:
            min_rating = self.cleaned_df[col].min()
            max_rating = self.cleaned_df[col].max()
            invalid_ratings = ((self.cleaned_df[col] < 100) | (self.cleaned_df[col] > 4000)).sum()
            validation_results[f'{col}_range'] = {
                'min': min_rating,
                'max': max_rating,
                'invalid_count': invalid_ratings
            }
            logger.info(f"{col}: range {min_rating}-{max_rating}, {invalid_ratings} invalid")
        
        # Check if game results are consistent
        result_consistency = self.cleaned_df['winner_cleaned'].value_counts()
        validation_results['result_distribution'] = result_consistency.to_dict()
        logger.info(f"Result distribution: {result_consistency.to_dict()}")
        
        # Check for valid game durations
        valid_durations = self.cleaned_df['game_duration_moves'].notna().sum()
        validation_results['valid_game_durations'] = valid_durations
        logger.info(f"Games with valid duration: {valid_durations}/{len(self.cleaned_df)}")
        
        # Check for valid PGN format
        valid_pgn = self.cleaned_df['pgn_valid'].sum()
        validation_results['valid_pgn_count'] = valid_pgn
        logger.info(f"Games with valid PGN: {valid_pgn}/{len(self.cleaned_df)}")
        
        # Check temporal consistency
        if 'end_time' in self.cleaned_df.columns:
            end_time_series = pd.to_datetime(self.cleaned_df['end_time'])
            temporal_range = (end_time_series.min(), end_time_series.max())
            validation_results['temporal_range'] = temporal_range
            logger.info(f"Temporal range: {temporal_range[0]} to {temporal_range[1]}")
        
        return validation_results
    
    def save_cleaned_data(self, csv_file='bot/data/chess_games_cleaned.csv'):
        """Save the cleaned dataset to CSV."""
        logger.info(f"Saving cleaned data to: {csv_file}")
        
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(csv_file), exist_ok=True)
            
            # Save to CSV
            self.cleaned_df.to_csv(csv_file, index=False)
            logger.info(f"Successfully saved {len(self.cleaned_df)} cleaned games to {csv_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving cleaned data: {e}")
            return False
    
    def generate_cleaning_report(self):
        """Generate a comprehensive cleaning report."""
        logger.info("Generating cleaning report...")
        
        report = {
            'original_count': len(self.df),
            'cleaned_count': len(self.cleaned_df),
            'removed_count': len(self.df) - len(self.cleaned_df),
            'columns_added': [col for col in self.cleaned_df.columns if col not in self.df.columns],
            'missing_values_handled': {
                'winner_extracted': (self.cleaned_df['winner'].isnull() & 
                                   self.cleaned_df['winner_extracted'].notnull()).sum(),
                'ratings_filled': 'median imputation applied'
            },
            'data_quality_improvements': {
                'standardized_player_names': True,
                'standardized_time_formats': True,
                'extracted_game_results': True,
                'created_derived_columns': True,
                'validated_data_integrity': True
            }
        }
        
        logger.info("=== CLEANING REPORT ===")
        logger.info(f"Original games: {report['original_count']}")
        logger.info(f"Cleaned games: {report['cleaned_count']}")
        logger.info(f"Removed games: {report['removed_count']}")
        logger.info(f"New columns added: {len(report['columns_added'])}")
        logger.info(f"New columns: {report['columns_added']}")
        
        return report
    
    def run_complete_cleaning(self, use_sample_data=False):
        """Run the complete data cleaning process."""
        logger.info("Starting complete data cleaning process...")
        
        # Step 1: Load data
        if use_sample_data:
            if not self.create_sample_data():
                logger.error("Failed to create sample data. Aborting.")
                return False
        else:
            if not self.load_data_from_csv():
                logger.error("Failed to load data. Aborting.")
                return False
        
        # Step 2: Analyze data quality
        quality_analysis = self.analyze_data_quality()
        
        # Step 3: Handle missing values
        self.handle_missing_values()
        
        # Step 4: Standardize formats
        self.standardize_player_names()
        self.standardize_time_formats()
        
        # Step 5: Remove duplicates
        self.remove_duplicates()
        
        # Step 6: Create derived columns
        self.create_derived_columns()
        
        # Step 7: Validate data integrity
        validation_results = self.validate_data_integrity()
        
        # Step 8: Save cleaned data
        if not self.save_cleaned_data():
            logger.error("Failed to save cleaned data")
            return False
        
        # Step 9: Generate report
        report = self.generate_cleaning_report()
        
        logger.info("Data cleaning process completed successfully!")
        return True

def main():
    """Main function to run the data cleaning process."""
    cleaner = ChessDataCleanerSimple()
    
    # Use sample data for demonstration
    success = cleaner.run_complete_cleaning(use_sample_data=True)
    
    if success:
        print("Data cleaning completed successfully!")
        print(f"Cleaned data saved to: bot/data/chess_games_cleaned.csv")
    else:
        print("Data cleaning failed. Check logs for details.")

if __name__ == "__main__":
    main()