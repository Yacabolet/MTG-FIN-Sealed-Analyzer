# MTG Deck List Analyzer

A comprehensive web-based tool for analyzing Magic: The Gathering deck lists, providing insights on card rankings, color combinations, archetype optimization, and synergy detection.

## Features

### 📊 Card Analysis
- **Grade-based Rankings**: Cards are categorized from F to A+ grades
- **Archetype Optimization**: Grades are adjusted based on how well cards perform in specific color pairs
- **Creature Density Tracking**: Monitors creature count for optimal deck construction (13+ recommended)

### 🎨 Color Combination Analysis
- **Smart Recommendations**: Suggests optimal color pairs based on your specific cards
- **Archetype Scoring**: Calculates the best archetypes for your deck using adjusted grades
- **Splash Analysis**: Identifies premium cards worth splashing for with difficulty warnings

### ⚡ Synergy Detection
- **Card Synergies**: Automatically detects specific card interactions (e.g., Fang + Vanille)
- **Build-Around Support**: Identifies when you have enough support for build-around strategies
- **Theme Tracking**: Monitors equipment, tribal, artifact, and other thematic synergies

### 🏗️ Archetype Breakdown
- **Detailed Analysis**: Shows top 2 archetypes with complete card breakdowns
- **Tier Classification**: Separates cards into Premium (C+), Playable (C-/C), and Filler (D+ and below)
- **Visual Indicators**: 
  - `[++]` = Best in archetype
  - `[+]` = Good in archetype  
  - `[-]` = Poor in archetype
  - `⚡` = Card synergy available
  - `⭐` = Build-around enabled
  - `⚠️` = Needs more support

## How to Use

1. **Enter Your Deck List**: Use the format "1 Card Name" per line in the text area
2. **Click Analyze**: The tool will process your deck and provide comprehensive analysis
3. **Review Results**: 
   - Main cards (C+ and above) vs Filler cards (C- and below)
   - Recommended color combinations
   - Detailed archetype breakdowns with splash options
   - Lands analysis

## Example Deck List Format

```
1 Iron Giant
1 Garnet, Princess of Alexandria
1 Giott, King of the Dwarves
1 Exdeath, Void Warlock
1 Ignis Scientia
1 Rufus Shinra
1 Rinoa Heartilly
1 Zidane, Tantalus Thief
```

## Technical Details

### Project Structure
```
mtg-deck-analyzer/
├── index.html           # Main application interface
├── css/
│   └── styles.css      # Dark theme styling and responsive design
├── js/
│   ├── data.js         # Card rankings and synergy data
│   ├── utils.js        # Core analysis functions
│   └── app.js          # UI logic and event handling
├── README.md           # This file
└── .gitignore         # Git ignore rules
```

### Key Features
- **Dark Theme**: Modern dark UI optimized for extended use
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No External Dependencies**: Pure HTML/CSS/JavaScript - works offline
- **Comprehensive Data**: 500+ cards with detailed archetype analysis

## Development

### Running Locally
1. Clone the repository
2. Open `index.html` in any modern web browser
3. No build process or server required!

### Adding New Cards
1. Update the `EMBEDDED_RANKINGS_DATA` array in `js/data.js`
2. Add any new synergies to `CARD_SYNERGIES` object
3. Update `CREATURE_GENERATORS` array if the card creates tokens

### Customizing Analysis
- **Grade Adjustments**: Modify `getAdjustedGrade()` in `utils.js`
- **Synergy Detection**: Extend `detectSynergies()` function
- **Theme Support**: Add new themes to `countThemeCards()`

## Card Grading System

| Grade | Description | Usage |
|-------|-------------|-------|
| A+/A  | Format staples and bomb rares | Always play |
| A-    | Excellent cards with minor drawbacks | High priority |
| B+    | Very good cards | Strong inclusions |
| B/B-  | Good cards with some conditions | Solid playables |
| C+    | Decent cards, filler with upside | Playable |
| C/C-  | Basic playables | Fill out deck |
| D+/D  | Below rate, situational | Avoid unless desperate |
| D-/F  | Unplayable | Don't include |

## Archetype Guide

### Supported Color Pairs
- **WU** (White/Blue): Control and tempo strategies
- **WB** (White/Black): Midrange and removal-based
- **WR** (White/Red): Aggressive and equipment-focused
- **WG** (White/Green): Creature-based strategies
- **UB** (Blue/Black): Control and value engines
- **UR** (Blue/Red): Spells matter and tempo
- **UG** (Blue/Green): Ramp and card advantage
- **BR** (Black/Red): Aggressive and sacrifice themes
- **BG** (Black/Green): Midrange and graveyard value
- **RG** (Red/Green): Aggressive creatures and combat tricks

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests for:
- New card additions
- Grading adjustments
- Synergy improvements
- UI enhancements
- Bug fixes

## License

This project is open source and available under the [MIT License](LICENSE).

---

*Built for the MTG community with ❤️*