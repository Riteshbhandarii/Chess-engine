#!/usr/bin/env python3
"""
Export Chess Game Data from Database to CSV

This script exports the current chess game data from PostgreSQL to CSV
so it can be processed by the data cleaning script.
"""

import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def export_database_to_csv():
    """Export database data to CSV file."""
    try:
        # Database connection
        db_connection_string = "postgresql+psycopg2://postgres:chess_engine@localhost/chess_data"
        engine = create_engine(db_connection_string)
        
        logger.info("Connecting to database...")
        
        # Read data from database
        df = pd.read_sql("SELECT * FROM chess_games", engine)
        logger.info(f"Loaded {len(df)} games from database")
        
        # Ensure output directory exists
        output_dir = 'bot/data'
        os.makedirs(output_dir, exist_ok=True)
        
        # Export to CSV
        output_file = os.path.join(output_dir, 'chess_games_raw.csv')
        df.to_csv(output_file, index=False)
        logger.info(f"Exported data to {output_file}")
        
        # Print basic info
        logger.info(f"Columns: {list(df.columns)}")
        logger.info(f"Data types: {df.dtypes.to_dict()}")
        logger.info(f"Missing values: {df.isnull().sum().to_dict()}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        return False

def main():
    """Main function."""
    success = export_database_to_csv()
    
    if success:
        print("Database export completed successfully!")
        print("Raw data saved to: bot/data/chess_games_raw.csv")
        print("You can now run the data cleaning script with real data.")
    else:
        print("Database export failed. Check logs for details.")

if __name__ == "__main__":
    main()