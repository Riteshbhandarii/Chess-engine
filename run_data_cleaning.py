#!/usr/bin/env python3
"""
Chess Data Cleaning - Usage Example

This script demonstrates how to use the chess data cleaning system.
"""

import pandas as pd
import os
from bot.data_cleaner_simple import ChessDataCleanerSimple

def main():
    print("Chess Data Cleaning - Usage Example")
    print("=" * 50)
    
    # Initialize the cleaner
    cleaner = ChessDataCleanerSimple()
    
    # Option 1: Use sample data for demonstration
    print("\n1. Running with sample data...")
    success = cleaner.run_complete_cleaning(use_sample_data=True)
    
    if success:
        print("✅ Sample data cleaning completed successfully!")
        
        # Show results
        output_file = 'bot/data/chess_games_cleaned.csv'
        if os.path.exists(output_file):
            df = pd.read_csv(output_file)
            print(f"\nCleaned dataset contains {len(df)} games with {len(df.columns)} columns")
            print("\nNew columns added:")
            original_columns = [
                'game_id', 'player_white', 'rating_white', 'player_black', 'rating_black',
                'pgn', 'end_time', 'time_class', 'time_control', 'rated', 'winner', 'url'
            ]
            new_columns = [col for col in df.columns if col not in original_columns]
            for col in new_columns:
                print(f"  - {col}")
            
            print("\nSample of cleaned data:")
            print(df[['game_id', 'player_white', 'player_black', 'winner_cleaned', 
                     'main_player_result', 'rating_difference', 'time_category']].head())
    
    # Option 2: Process real data from database (if available)
    print("\n2. To process real data from database:")
    print("   a. First export database data:")
    print("      python bot/export_database.py")
    print("   b. Then run cleaning on exported data:")
    print("      cleaner.run_complete_cleaning(use_sample_data=False)")
    
    # Option 3: Process custom CSV file
    print("\n3. To process custom CSV file:")
    print("   cleaner.load_data_from_csv('path/to/your/data.csv')")
    print("   cleaner.run_complete_cleaning(use_sample_data=False)")
    
    print("\n" + "=" * 50)
    print("Data cleaning process completed!")
    print("Check 'bot/data/chess_games_cleaned.csv' for results.")

if __name__ == "__main__":
    main()