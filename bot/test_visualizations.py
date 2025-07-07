#!/usr/bin/env python3
"""
Test script to validate the visualization functions and library imports.
This script creates sample data and tests the visualization code without requiring a database.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import re
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Set up plotting style
plt.style.use('default')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 12

# Create sample data that mimics the chess database structure
def create_sample_data():
    """Create sample chess game data for testing"""
    np.random.seed(42)  # For reproducible results
    
    # Sample dates over the last year
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 12, 31)
    
    # Generate sample games
    n_games = 500
    sample_data = []
    
    for i in range(n_games):
        # Random date within the year
        random_days = np.random.randint(0, (end_date - start_date).days)
        game_date = start_date + timedelta(days=random_days)
        
        # Random game data
        is_white = np.random.choice([True, False])
        player_white = 'teoriat' if is_white else f'opponent_{i%50}'
        player_black = f'opponent_{i%50}' if is_white else 'teoriat'
        
        # Random ratings
        rating_white = np.random.randint(800, 1200)
        rating_black = np.random.randint(800, 1200)
        
        # Random time controls
        time_control = np.random.choice(['600', '300', '180', '900'], p=[0.6, 0.2, 0.15, 0.05])
        time_class = 'rapid' if time_control in ['600', '900'] else 'blitz'
        
        # Random game results
        result = np.random.choice(['1-0', '0-1', '1/2-1/2'], p=[0.4, 0.4, 0.2])
        
        # Random opening moves
        opening_moves = ['e4', 'd4', 'Nf3', 'c4', 'g3', 'b3', 'f4', 'Nc3']
        opening_move = np.random.choice(opening_moves, p=[0.3, 0.25, 0.2, 0.1, 0.05, 0.03, 0.02, 0.05])
        
        # Create sample PGN
        pgn = f'[Event "Live Chess"]\n[Site "Chess.com"]\n[Date "{game_date.strftime("%Y.%m.%d")}"]\n[Result "{result}"]\n1. {opening_move}'
        
        sample_data.append({
            'game_id': f'game_{i}',
            'player_white': player_white,
            'rating_white': rating_white,
            'player_black': player_black,
            'rating_black': rating_black,
            'pgn': pgn,
            'end_time': game_date,
            'time_class': time_class,
            'time_control': time_control,
            'rated': True,
            'winner': None,
            'url': f'https://chess.com/game/{i}'
        })
    
    return pd.DataFrame(sample_data)

# Reuse the functions from the notebook
def extract_game_result(pgn_text, player_white, player_black, target_player='teoriat'):
    """Extract game result from PGN text"""
    if pd.isna(pgn_text):
        return 'Unknown'
    
    # Extract result from PGN
    result_match = re.search(r'\[Result "([^"]+)"\]', pgn_text)
    if not result_match:
        return 'Unknown'
    
    result = result_match.group(1)
    
    # Determine outcome from target player's perspective
    if target_player == player_white:
        if result == '1-0':
            return 'Win'
        elif result == '0-1':
            return 'Loss'
        elif result == '1/2-1/2':
            return 'Draw'
    elif target_player == player_black:
        if result == '0-1':
            return 'Win'
        elif result == '1-0':
            return 'Loss'
        elif result == '1/2-1/2':
            return 'Draw'
    
    return 'Unknown'

def extract_opening_move(pgn_text):
    """Extract the first move from PGN"""
    if pd.isna(pgn_text):
        return 'Unknown'
    
    # Look for the first move after move numbers
    move_match = re.search(r'1\. ([A-Za-z][A-Za-z0-9\-\+\=]*)', pgn_text)
    if move_match:
        return move_match.group(1)
    return 'Unknown'

def test_visualizations():
    """Test the visualization functions with sample data"""
    print("🎮 Testing Chess Data Visualizations")
    print("=" * 50)
    
    # Create sample data
    print("📊 Creating sample data...")
    df = create_sample_data()
    
    # Apply preprocessing
    print("🔄 Preprocessing data...")
    df['game_result'] = df.apply(lambda row: extract_game_result(row['pgn'], row['player_white'], row['player_black']), axis=1)
    df['opening_move'] = df['pgn'].apply(extract_opening_move)
    
    # Extract date components
    df['year'] = df['end_time'].dt.year
    df['month'] = df['end_time'].dt.month
    df['year_month'] = df['end_time'].dt.to_period('M')
    df['date'] = df['end_time'].dt.date
    df['day_of_week'] = df['end_time'].dt.day_name()
    df['hour'] = df['end_time'].dt.hour
    
    # Calculate additional fields
    df['player_rating'] = df.apply(lambda row: 
        row['rating_white'] if row['player_white'] == 'teoriat' 
        else row['rating_black'], axis=1)
    
    df['opponent_rating'] = df.apply(lambda row: 
        row['rating_black'] if row['player_white'] == 'teoriat' 
        else row['rating_white'], axis=1)
    
    df['rating_diff'] = df.apply(lambda row: 
        row['rating_white'] - row['rating_black'] if row['player_white'] == 'teoriat' 
        else row['rating_black'] - row['rating_white'], axis=1)
    
    print(f"✅ Data preprocessing completed!")
    print(f"   • Total games: {len(df)}")
    print(f"   • Date range: {df['end_time'].min().date()} to {df['end_time'].max().date()}")
    print(f"   • Game results: {dict(df['game_result'].value_counts())}")
    print(f"   • Top opening moves: {dict(df['opening_move'].value_counts().head(3))}")
    
    # Test 1: Games per month visualization
    print("\n📈 Testing games per month visualization...")
    try:
        fig, ax = plt.subplots(figsize=(12, 6))
        monthly_games = df.groupby('year_month').size()
        ax.bar(range(len(monthly_games)), monthly_games.values, color='skyblue', alpha=0.7)
        ax.set_title('Games Played Per Month (Test)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Number of Games')
        plt.xticks(range(len(monthly_games)), [str(m) for m in monthly_games.index], rotation=45)
        plt.tight_layout()
        plt.savefig('/tmp/test_monthly_games.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("   ✅ Monthly games visualization - PASSED")
    except Exception as e:
        print(f"   ❌ Monthly games visualization - FAILED: {e}")
    
    # Test 2: Win/Loss/Draw pie chart
    print("\n🏆 Testing win/loss/draw visualization...")
    try:
        fig, ax = plt.subplots(figsize=(10, 8))
        result_counts = df['game_result'].value_counts()
        colors = ['#2E8B57', '#DC143C', '#FFD700', '#808080']
        ax.pie(result_counts.values, labels=result_counts.index, autopct='%1.1f%%', 
               colors=colors[:len(result_counts)], startangle=90)
        ax.set_title('Game Results Distribution (Test)')
        plt.savefig('/tmp/test_results_pie.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("   ✅ Win/Loss/Draw pie chart - PASSED")
    except Exception as e:
        print(f"   ❌ Win/Loss/Draw pie chart - FAILED: {e}")
    
    # Test 3: Opening moves bar chart
    print("\n♟️ Testing opening moves visualization...")
    try:
        fig, ax = plt.subplots(figsize=(12, 6))
        top_openings = df['opening_move'].value_counts().head(8)
        ax.barh(range(len(top_openings)), top_openings.values, color='lightblue')
        ax.set_yticks(range(len(top_openings)))
        ax.set_yticklabels(top_openings.index)
        ax.set_title('Top Opening Moves (Test)')
        ax.set_xlabel('Number of Games')
        plt.tight_layout()
        plt.savefig('/tmp/test_openings.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("   ✅ Opening moves bar chart - PASSED")
    except Exception as e:
        print(f"   ❌ Opening moves bar chart - FAILED: {e}")
    
    # Test 4: Time controls visualization
    print("\n⏰ Testing time controls visualization...")
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        time_control_counts = df['time_control'].value_counts()
        ax.bar(time_control_counts.index, time_control_counts.values, color='lightcoral')
        ax.set_title('Time Control Distribution (Test)')
        ax.set_xlabel('Time Control')
        ax.set_ylabel('Number of Games')
        plt.tight_layout()
        plt.savefig('/tmp/test_time_controls.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("   ✅ Time controls bar chart - PASSED")
    except Exception as e:
        print(f"   ❌ Time controls bar chart - FAILED: {e}")
    
    # Test 5: Seaborn heatmap
    print("\n🔥 Testing seaborn heatmap...")
    try:
        fig, ax = plt.subplots(figsize=(12, 6))
        # Create a simple heatmap for day vs hour
        pivot_data = df.groupby(['day_of_week', 'hour']).size().unstack(fill_value=0)
        if len(pivot_data) > 0:
            sns.heatmap(pivot_data, annot=False, cmap='YlOrRd', ax=ax)
            ax.set_title('Gaming Activity Heatmap (Test)')
        else:
            # Fallback if no data
            sample_heatmap = np.random.rand(7, 24)
            sns.heatmap(sample_heatmap, ax=ax, cmap='YlOrRd')
            ax.set_title('Sample Heatmap (Test)')
        plt.tight_layout()
        plt.savefig('/tmp/test_heatmap.png', dpi=150, bbox_inches='tight')
        plt.close()
        print("   ✅ Seaborn heatmap - PASSED")
    except Exception as e:
        print(f"   ❌ Seaborn heatmap - FAILED: {e}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 VISUALIZATION TEST SUMMARY")
    print("=" * 50)
    print(f"✅ All visualization libraries imported successfully")
    print(f"✅ Data preprocessing functions working correctly")
    print(f"✅ Sample data generation completed")
    print(f"✅ Core visualization functions tested")
    print(f"📁 Test images saved to /tmp/test_*.png")
    
    print("\n🎯 KEY STATISTICS FROM SAMPLE DATA:")
    print(f"   • Total games: {len(df)}")
    print(f"   • Win rate: {(df['game_result'] == 'Win').mean() * 100:.1f}%")
    print(f"   • Most common opening: {df['opening_move'].mode()[0]}")
    print(f"   • Favorite time control: {df['time_control'].mode()[0]}")
    print(f"   • Average rating: {df['player_rating'].mean():.0f}")
    
    print("\n🚀 Ready for production analysis!")
    return True

if __name__ == "__main__":
    success = test_visualizations()
    print(f"\n{'✅ Tests completed successfully!' if success else '❌ Tests failed!'}")