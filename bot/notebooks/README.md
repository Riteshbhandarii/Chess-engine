# Chess Data Analysis Documentation

## Overview

This directory contains comprehensive analysis tools for chess game data visualization and insights. The analysis focuses on the main player "teoriat" and provides detailed statistics about gameplay patterns, performance metrics, and strategic insights.

## Files

### 📓 `Analysis.ipynb`
Main Jupyter notebook containing comprehensive chess data analysis with the following sections:

1. **Data Overview** - Basic statistics and data structure
2. **Games Per Month/Year** - Activity patterns and trends
3. **Win/Loss/Draw Statistics** - Performance analysis
4. **Opening Move Frequencies** - Strategic move analysis
5. **Time Controls Analysis** - Playing preferences
6. **Additional Insights** - Rating trends and patterns
7. **Summary & Observations** - Key findings and recommendations

### 🧪 `test_visualizations.py`
Test script to validate visualization functions and ensure all dependencies work correctly without requiring a database connection.

## Key Visualizations

### 📊 Activity Analysis
- **Monthly Games**: Bar chart showing games played per month
- **Yearly Games**: Annual gaming activity
- **Activity Trends**: Line chart of gaming patterns over time
- **Daily Heatmap**: Day of week vs hour heatmap

### 🏆 Performance Metrics
- **Win/Loss/Draw Pie Chart**: Overall game outcome distribution
- **Results by Time Control**: Performance across different time formats
- **Win Rate Over Time**: Performance trends
- **Results by Rating Difference**: Performance vs opponent strength

### ♟️ Strategic Analysis
- **Top Opening Moves**: Most frequently used opening moves
- **Opening Sequences**: Common 2-move opening patterns
- **Opening Success Rate**: Win rate by opening move
- **White vs Black Openings**: Comparison of play styles

### ⏰ Time Management
- **Time Control Distribution**: Preferred game formats
- **Time Class Analysis**: Rapid vs Blitz vs Bullet preferences
- **Time Control vs Results**: Performance by time format
- **Time Control Usage Over Time**: Evolution of preferences

### 📈 Advanced Insights
- **Rating Progression**: Rating changes over time
- **Opponent Rating Distribution**: Strength of opponents faced
- **Games by Day of Week**: Activity patterns
- **Game Length Analysis**: Average moves per game

## Data Requirements

The analysis expects a PostgreSQL database with the following structure:

```sql
CREATE TABLE chess_games (
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
```

## Dependencies

### Required Libraries
- `pandas` - Data manipulation and analysis
- `matplotlib` - Core plotting library
- `seaborn` - Statistical visualization
- `numpy` - Numerical computing
- `sqlalchemy` - Database connectivity
- `psycopg2` - PostgreSQL adapter

### Optional Libraries
- `python-chess` - Chess-specific analysis (if needed)
- `jupyter` - Notebook environment

## Usage

### Running the Analysis

1. **Start the Database**: Ensure PostgreSQL is running with the chess_games table populated
2. **Open Notebook**: Launch Jupyter and open `Analysis.ipynb`
3. **Execute Cells**: Run all cells to generate comprehensive analysis
4. **Review Results**: Examine visualizations and summary statistics

### Testing Without Database

```bash
python test_visualizations.py
```

This will:
- Generate sample chess data
- Test all visualization functions
- Create test images in `/tmp/`
- Validate library dependencies

## Key Metrics Analyzed

### Performance Indicators
- **Win Rate**: Percentage of games won
- **Draw Rate**: Percentage of drawn games
- **Rating Progression**: Rating changes over time
- **Performance by Time Control**: Success rates in different formats

### Activity Patterns
- **Monthly Activity**: Games per month
- **Daily Patterns**: Preferred playing days
- **Time Preferences**: Most common time controls
- **Session Patterns**: Gaming frequency

### Strategic Insights
- **Opening Repertoire**: Most played openings
- **Opening Success**: Win rates by opening
- **Color Preferences**: Performance as White vs Black
- **Opponent Analysis**: Rating differences and results

## Sample Output

The analysis generates comprehensive statistics such as:

```
=== CHESS ANALYSIS SUMMARY ===
📊 Dataset: 5,863 games over 2+ years
🎯 Win Rate: 45.2% (2,650/5,863 games)
🏆 Best Opening: e4 (32.1% of games, 48.5% win rate)
⏰ Preferred Format: 600 seconds (rapid)
📈 Rating Change: +87 points improvement
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database contains data

2. **Missing Dependencies**
   - Install required packages: `pip install -r requirements.txt`
   - Check Python version compatibility

3. **Visualization Errors**
   - Ensure matplotlib backend is properly configured
   - Check for data type issues in PGN parsing

### Performance Tips

1. **Large Datasets**: Consider sampling for initial analysis
2. **Memory Usage**: Process data in chunks if needed
3. **Plot Performance**: Reduce figure DPI for faster rendering

## Future Enhancements

### Planned Features
- [ ] Interactive visualizations with Plotly
- [ ] Advanced opening theory analysis
- [ ] Opponent-specific performance tracking
- [ ] Time-based performance patterns
- [ ] Machine learning insights

### Customization Options
- [ ] Custom date ranges
- [ ] Different target players
- [ ] Additional time controls
- [ ] Export options (PDF, HTML)

## Contributing

When adding new visualizations:

1. Follow the existing code structure
2. Add appropriate error handling
3. Include summary statistics
4. Update this documentation
5. Test with sample data

## License

This analysis tool is part of the Chess Engine project and follows the same license terms.