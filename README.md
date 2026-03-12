# 🏰 Dungeon Shift

A puzzle game where the dungeon shifts after every move! Navigate through 11 levels of increasing difficulty as rooms swap positions with each step you take.

## 🎮 Play Now

**Live Game:** https://blackspider-ops.github.io/dungeon-shift/

## 🎯 Game Overview

Dungeon Shift is a turn-based puzzle game that challenges players to think strategically about movement and positioning. The core mechanic revolves around the dungeon's shifting rooms - after each move, quadrants of the map swap positions, creating new paths and obstacles.

### Key Features
- **11 Levels**: From tutorial to ultimate challenge
- **Progressive Difficulty**: New mechanics introduced gradually
- **Interactive Tutorial**: 19-step guided introduction with visual spotlights
- **Multiple Enemy Types**: Patrollers, Guards, and Chasers
- **Various Traps**: Spike traps and cracked floors
- **Undo System**: 5 undos per level (3 if hint is used)
- **Solution Playback**: Watch optimal solutions after completing levels
- **Level Progression**: Unlock levels by completing previous ones

## 🕹️ How to Play

### Controls
- **Movement**: Arrow Keys or WASD
- **Undo**: U key or click Undo button
- **Hint**: H key or click Hint button
- **Solution**: P key or click Solution button (after completing level)
- **Pause**: ESC key
- **Mute**: M key

### Objective
1. Collect all required keys (yellow icons)
2. Reach the purple exit portal
3. Avoid enemies and traps
4. Complete within the move limit

### The Shift Mechanic
The dungeon is divided into 4 quadrants that swap positions after each move:
- Top-Left ↔ Bottom-Right
- Top-Right ↔ Bottom-Left

The "Next Shift" indicator shows which quadrants will swap next.

## 🎲 Game Elements

### Enemies
- **Patrollers** (Red): Move along set paths
- **Guards** (Blue): Attack adjacent tiles
- **Chasers** (Purple): Follow the player

### Traps
- **Spike Traps**: Damage player when stepped on
- **Cracked Floors**: Break after one use

### Items
- **Keys**: Required to unlock the exit
- **Exit Portal**: Goal destination

## 🛠️ Development

### Tech Stack
- **Engine**: Phaser 3
- **Language**: JavaScript (ES6 modules)
- **Graphics**: Procedurally generated pixel art (Python/PIL)
- **Deployment**: GitHub Pages

### Project Structure
```
dungeon-shift/
├── src/
│   ├── scenes/          # Game scenes (Menu, Game, Boot)
│   ├── core/            # Core game systems
│   ├── entities/        # Player and enemy classes
│   ├── utils/           # Utility classes
│   └── data/            # Level definitions
├── assets/              # Generated game assets
├── dungeon-shift-assets/ # Asset generation scripts
└── index.html           # Entry point
```
### Core Systems
- **Grid System**: Manages tile-based game world
- **Turn Manager**: Handles player/enemy turns and game state
- **Shift System**: Implements room swapping mechanics
- **Chunk Manager**: Divides map into swappable quadrants
- **Level Loader**: Loads and validates level data
- **Tile Renderer**: Renders game world with proper layering

### Asset Generation
All game assets are procedurally generated using Python scripts:
```bash
cd dungeon-shift-assets
source venv/bin/activate
python3 generate_all.py
```

## 🎮 Level Progression

### Tutorial (Level 0)
- 19-step interactive tutorial
- Teaches all game mechanics
- Visual spotlights and guided instructions

### Levels 1-10
1. **First Steps**: Basic movement and key collection
2. **Shifting Maze**: Introduction to patroller enemies
3. **Spike Gauntlet**: Trap navigation
4. **Double Trouble**: Multiple keys and enemies
5. **The Watcher**: Guard enemy introduction
6. **Cracked Floors**: Path planning with breakable tiles
7. **The Hunter**: Chaser enemy mechanics
8. **Labyrinth**: Multiple enemy types combined
9. **Gauntlet Run**: High difficulty with all mechanics
10. **The Final Shift**: Ultimate challenge

## 🔧 Developer Mode

For testing purposes, open browser console and type:
```javascript
turn_on_dev_mode()  // Unlock all levels
turn_off_dev_mode() // Restore normal progression
```

## 🚀 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/blackspider-ops/dungeon-shift.git
   cd dungeon-shift
   ```

2. **Start local server**
   ```bash
   python3 -m http.server 8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📝 Alpha Testing Feedback

> "I was confused at first but I don't believe it was any product of miscommunication from the game and actually enjoyed picking the game up as it went on. Amazing idea of a game here!" - Carson

> "The preview representing the current divisions of the map could be better explained in smaller steps" - Kenneth

*Based on this feedback, we improved the tutorial's explanation of the shift mechanic.*

## 🎨 Screenshots

*Coming soon - add gameplay screenshots here*

## 📄 License

This project is open source. Feel free to fork, modify, and learn from the code!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 🙏 Acknowledgments

- Built with Phaser 3 game framework
- Pixel art generated with Python PIL
- Inspired by classic puzzle games with a unique twist

---

**Enjoy playing Dungeon Shift!** 🎮✨