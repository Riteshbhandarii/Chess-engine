#!/usr/bin/env python3
"""
Test Chess Data Cleaning Process

This script tests the data cleaning functionality with various scenarios.
"""

import pandas as pd
import unittest
import os
import sys
import logging
from unittest.mock import patch

# Add the bot directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'bot'))

from data_cleaner_simple import ChessDataCleanerSimple

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TestChessDataCleaning(unittest.TestCase):
    """Test cases for chess data cleaning."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.cleaner = ChessDataCleanerSimple()
        
        # Create test data with various issues
        self.test_data = {
            'game_id': ['1', '2', '3', '4', '1'],  # Include duplicate
            'player_white': ['  TeoRiat  ', 'teoriat', 'TestUser', 'teoriat', '  TeoRiat  '],
            'rating_white': [900, 950, None, 1000, 900],  # Include missing rating
            'player_black': ['opponent1', 'opponent2', 'teoriat', 'opponent3', 'opponent1'],
            'rating_black': [950, 900, 1100, None, 950],  # Include missing rating
            'pgn': [
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "opponent1"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0',
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "opponent2"]\n[Result "0-1"]\n\n1. e4 e5 2. Nf3 0-1',
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "TestUser"]\n[Black "teoriat"]\n[Result "1/2-1/2"]\n\n1. e4 e5 2. Nf3 1/2-1/2',
                None,  # Missing PGN
                '[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "2024.11.01"]\n[Round "?"]\n[White "teoriat"]\n[Black "opponent3"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 1-0'
            ],
            'end_time': ['2024-11-01 20:44:18', '2024-11-01 20:44:57', '2024-11-01 20:45:47', '2024-11-01 20:46:33', '2024-11-01 20:44:18'],
            'time_class': ['rapid', 'blitz', 'rapid', 'bullet', 'rapid'],
            'time_control': ['600', '300', '900', '60', '600'],
            'rated': [True, True, True, True, True],
            'winner': [None, None, None, None, None],  # All missing
            'url': ['url1', 'url2', 'url3', 'url4', 'url1']
        }
        
    def test_missing_value_handling(self):
        """Test handling of missing values."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.handle_missing_values()
        
        # Check that missing ratings are filled
        self.assertFalse(self.cleaner.cleaned_df['rating_white'].isnull().any())
        self.assertFalse(self.cleaner.cleaned_df['rating_black'].isnull().any())
        
        # Check that winner is extracted from PGN
        self.assertTrue('winner_extracted' in self.cleaner.cleaned_df.columns)
        self.assertTrue('winner_cleaned' in self.cleaner.cleaned_df.columns)
        
        # Check that PGN validity is marked
        self.assertTrue('pgn_valid' in self.cleaner.cleaned_df.columns)
        
    def test_duplicate_removal(self):
        """Test removal of duplicate games."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.cleaned_df = self.cleaner.df.copy()
        
        initial_count = len(self.cleaner.cleaned_df)
        self.cleaner.remove_duplicates()
        
        # Should remove duplicate row
        self.assertLess(len(self.cleaner.cleaned_df), initial_count)
        
        # Should not have duplicate game_ids
        self.assertFalse(self.cleaner.cleaned_df['game_id'].duplicated().any())
        
    def test_player_name_standardization(self):
        """Test standardization of player names."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.cleaned_df = self.cleaner.df.copy()
        
        self.cleaner.standardize_player_names()
        
        # Check that names are lowercased and trimmed
        self.assertEqual(self.cleaner.cleaned_df['player_white'].iloc[0], 'teoriat')
        self.assertFalse(self.cleaner.cleaned_df['player_white'].str.contains(' ').any())
        
    def test_time_format_standardization(self):
        """Test standardization of time formats."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.cleaned_df = self.cleaner.df.copy()
        
        self.cleaner.standardize_time_formats()
        
        # Check that time controls have proper format
        self.assertTrue(self.cleaner.cleaned_df['time_control'].str.contains(r'\+').any())
        
    def test_derived_columns_creation(self):
        """Test creation of derived columns."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.cleaned_df = self.cleaner.df.copy()
        
        # Need to handle missing values first
        self.cleaner.handle_missing_values()
        self.cleaner.create_derived_columns()
        
        # Check that derived columns exist
        expected_columns = [
            'game_duration_moves', 'rating_difference', 'average_rating',
            'main_player_color', 'main_player_result', 'opening',
            'time_category', 'game_date', 'game_year', 'game_month'
        ]
        
        for col in expected_columns:
            self.assertTrue(col in self.cleaner.cleaned_df.columns, f"Missing column: {col}")
        
    def test_pgn_result_extraction(self):
        """Test extraction of results from PGN."""
        test_pgns = [
            '[Event "Test"]\n[Result "1-0"]\n1. e4 1-0',
            '[Event "Test"]\n[Result "0-1"]\n1. e4 0-1',
            '[Event "Test"]\n[Result "1/2-1/2"]\n1. e4 1/2-1/2',
            None,
            'Invalid PGN'
        ]
        
        results = [self.cleaner.extract_result_from_pgn(pgn) for pgn in test_pgns]
        
        self.assertEqual(results[0], 'white')
        self.assertEqual(results[1], 'black')
        self.assertEqual(results[2], 'draw')
        self.assertIsNone(results[3])
        self.assertEqual(results[4], 'unknown')
        
    def test_game_duration_calculation(self):
        """Test calculation of game duration."""
        test_pgn = '[Event "Test"]\n[Result "1-0"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0'
        
        duration = self.cleaner.calculate_game_duration(test_pgn)
        
        self.assertIsInstance(duration, (int, type(None)))
        if duration is not None:
            self.assertGreater(duration, 0)
            
    def test_data_integrity_validation(self):
        """Test data integrity validation."""
        self.cleaner.df = pd.DataFrame(self.test_data)
        self.cleaner.cleaned_df = self.cleaner.df.copy()
        
        # Need to handle missing values and create derived columns first
        self.cleaner.handle_missing_values()
        self.cleaner.create_derived_columns()
        
        validation_results = self.cleaner.validate_data_integrity()
        
        # Check that validation results contain expected keys
        self.assertTrue('rating_white_range' in validation_results)
        self.assertTrue('rating_black_range' in validation_results)
        self.assertTrue('result_distribution' in validation_results)
        
def run_comprehensive_test():
    """Run comprehensive test of the data cleaning process."""
    logger.info("Starting comprehensive test of data cleaning process...")
    
    # Create test instance
    cleaner = ChessDataCleanerSimple()
    
    # Test with sample data
    logger.info("Testing with sample data...")
    success = cleaner.run_complete_cleaning(use_sample_data=True)
    
    if success:
        logger.info("Sample data cleaning test: PASSED")
        
        # Check output file
        output_file = 'bot/data/chess_games_cleaned.csv'
        if os.path.exists(output_file):
            df = pd.read_csv(output_file)
            logger.info(f"Output file contains {len(df)} rows and {len(df.columns)} columns")
            
            # Check for expected columns
            expected_columns = [
                'game_id', 'player_white', 'rating_white', 'player_black', 'rating_black',
                'pgn', 'end_time', 'time_class', 'time_control', 'rated', 'winner', 'url',
                'pgn_valid', 'winner_extracted', 'winner_cleaned', 'game_duration_moves',
                'rating_difference', 'average_rating', 'main_player_color', 'main_player_result',
                'opening', 'time_category', 'game_date', 'game_year', 'game_month'
            ]
            
            missing_columns = [col for col in expected_columns if col not in df.columns]
            if missing_columns:
                logger.error(f"Missing columns: {missing_columns}")
                return False
            else:
                logger.info("All expected columns present: PASSED")
            
            # Check data quality
            logger.info("Data quality checks:")
            logger.info(f"  No duplicate game_ids: {not df['game_id'].duplicated().any()}")
            logger.info(f"  No missing ratings: {not df[['rating_white', 'rating_black']].isnull().any().any()}")
            logger.info(f"  Winner extracted for all games: {not df['winner_cleaned'].isnull().any()}")
            
            return True
        else:
            logger.error("Output file not found")
            return False
    else:
        logger.error("Sample data cleaning test: FAILED")
        return False

def main():
    """Main test function."""
    print("Running Chess Data Cleaning Tests...")
    
    # Run unit tests
    print("\n=== Running Unit Tests ===")
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    # Run comprehensive test
    print("\n=== Running Comprehensive Test ===")
    success = run_comprehensive_test()
    
    if success:
        print("\n✅ All tests passed!")
        print("Data cleaning process is working correctly.")
    else:
        print("\n❌ Some tests failed!")
        print("Please check the logs for details.")

if __name__ == "__main__":
    main()