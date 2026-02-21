# Dungeon Shift - Asset Map & Usage Guide

## Color Palette

The game uses a consistent 24-color palette across all assets:

### Core Colors
- Black: `#141419`
- Dark Gray: `#2D2D32`
- Gray: `#505055`
- Light Gray: `#8C8C91`
- White: `#F0F0F5`

### Stone/Wall Colors
- Stone Dark: `#3C3741`
- Stone: `#5F5A64`
- Stone Light: `#827D87`

### Floor Colors
- Floor Dark: `#46413C`
- Floor: `#645F55`
- Floor Light: `#827869`

### Accent Colors
- Gold: `#FFC832` / Gold Dark: `#B48C1E`
- Blue: `#3C78C8` / Blue Light: `#64A0F0`
- Green: `#50B450` / Green Dark: `#327832`
- Red: `#DC3C3C` / Red Dark: `#962828`
- Purple: `#A050B4` / Purple Light: `#C878DC`
- Orange: `#E67832`
- Slime Green: `#78C864`

---

## Environment Tileset (16x16)

**File**: `tileset/environment_tileset.png`

### Grid Layout (8 columns × 4 rows)

#### Row 0: Basic Tiles
- **[0,0]** Floor variant 1 - Basic stone floor with texture dots
- **[1,0]** Floor variant 2 - Diagonal pattern floor
- **[2,0]** Wall variant 1 - Stone block with brick pattern
- **[3,0]** Wall variant 2 - Horizontal brick pattern

#### Row 1: Doors & Portals
- **[0,1]** Door (locked) - Gray door with gold lock symbol
- **[1,1]** Door (unlocked) - Open doorway
- **[2,1]** Portal (locked) - Purple portal with red X
- **[3,1]** Portal (unlocked) - Glowing blue/purple portal
- **[4,1]** Key tile - Floor with gold key indicator

#### Row 2: Hazards
- **[0,2]** Spikes (retracted) - Safe, small holes visible
- **[1,2]** Spikes (extended) - Dangerous, spikes up
- **[2,2]** Cracked floor (stage 1) - Minor cracks
- **[3,2]** Cracked floor (stage 2) - Heavy cracks
- **[4,2]** Hole/Void - Black pit

#### Row 3: Special Tiles
- **[0,3]** Slime tile - Green slime puddle
- **[1,3]** Arrow trap (up) - Points upward
- **[2,3]** Arrow trap (right) - Points right
- **[3,3]** Switch (off) - Gray button
- **[4,3]** Switch (on) - Green glowing button
- **[5,3]** Anchor tile - Blue anchor symbol

### Usage Notes
- Arrow traps can be rotated for down/left directions
- All tiles have transparent backgrounds
- Consistent lighting from top-left

---

## Player Spritesheet (32x32)

**File**: `player/player_spritesheet.png`

### Grid Layout (5 columns × 4 rows)

Each row represents a direction, each column is an animation frame:
- Column 0: Idle pose
- Columns 1-4: Walk cycle frames

#### Row 0: Facing Down
- **[0,0]** Idle down
- **[1,0]** Walk down frame 1
- **[2,0]** Walk down frame 2
- **[3,0]** Walk down frame 3
- **[4,0]** Walk down frame 4

#### Row 1: Facing Up
- **[0,1]** Idle up
- **[1,1]** Walk up frame 1
- **[2,1]** Walk up frame 2
- **[3,1]** Walk up frame 3
- **[4,1]** Walk up frame 4

#### Row 2: Facing Left
- **[0,2]** Idle left
- **[1,2]** Walk left frame 1
- **[2,2]** Walk left frame 2
- **[3,2]** Walk left frame 3
- **[4,2]** Walk left frame 4

#### Row 3: Facing Right
- **[0,3]** Idle right
- **[1,3]** Walk right frame 1
- **[2,3]** Walk right frame 2
- **[3,3]** Walk right frame 3
- **[4,3]** Walk right frame 4

### Character Design
- Blue tunic with light blue highlights
- Brown hair and pants
- Skin tone for visible parts
- Simple, readable design
- Walk cycle animates legs with alternating movement

### Animation Timing
- Idle: Static frame
- Walk: 4 frames @ 8-12 FPS for smooth movement

---

## Enemy Spritesheet (32x32)

**File**: `enemies/patroller_spritesheet.png`

### Grid Layout (7 columns × 1 row)

#### Patroller Enemy (Red Blob)
- **[0,0]** Idle frame 1 - Normal blob
- **[1,0]** Idle frame 2 - Slightly bobbed
- **[2,0]** Move down - Stretched downward
- **[3,0]** Move up - Stretched upward
- **[4,0]** Move left - Stretched left
- **[5,0]** Move right - Stretched right
- **[6,0]** Alert state - Exclamation mark above

### Enemy Design
- Red blob creature with yellow eyes
- Black pupils for menacing look
- Slight shine/highlight on body
- Shadow underneath
- Stretches in movement direction

### Animation Timing
- Idle: Alternate frames @ 4-6 FPS for breathing effect
- Movement: Use directional frame when moving
- Alert: Show when player detected

---

## UI Icons

### 16x16 Icons
**File**: `ui/ui_icons_16x16.png`

Grid Layout (6 columns × 1 row):
- **[0,0]** Heart (full) - Red heart, filled
- **[1,0]** Heart (empty) - Red heart outline
- **[2,0]** Key - Gold key with teeth
- **[3,0]** Move counter - Gray footprint
- **[4,0]** Shift icon - Blue curved arrows
- **[5,0]** (Reserved for future use)

### 32x32 Icons
**File**: `ui/ui_icons_32x32.png`

Same layout as 16x16 but larger, more detailed versions.

### Usage
- Hearts: Health/life display
- Key: Inventory indicator for collected keys
- Move counter: Display remaining moves in puzzle
- Shift icon: Indicate shift/swap ability

---

## Implementation Guide

### Loading Sprites (Example in JavaScript/Canvas)

```javascript
// Load tileset
const tileset = new Image();
tileset.src = 'tileset/environment_tileset.png';

// Draw a specific tile (e.g., floor variant 1)
function drawTile(ctx, tileX, tileY, x, y) {
    ctx.drawImage(
        tileset,
        tileX * 16, tileY * 16, 16, 16,  // Source
        x, y, 16, 16                      // Destination
    );
}

// Draw floor at position (32, 32)
drawTile(ctx, 0, 0, 32, 32);
```

### Animation Example

```javascript
// Player walk animation
class Player {
    constructor() {
        this.direction = 'down';  // down, up, left, right
        this.frame = 0;
        this.frameTimer = 0;
    }
    
    update(deltaTime) {
        this.frameTimer += deltaTime;
        if (this.frameTimer > 100) {  // 10 FPS
            this.frame = (this.frame + 1) % 4;
            this.frameTimer = 0;
        }
    }
    
    draw(ctx, x, y) {
        const directionRow = {
            'down': 0, 'up': 1, 'left': 2, 'right': 3
        }[this.direction];
        
        const col = this.frame + 1;  // +1 to skip idle frame
        
        ctx.drawImage(
            playerSheet,
            col * 32, directionRow * 32, 32, 32,
            x, y, 32, 32
        );
    }
}
```

---

## File Structure Summary

```
dungeon-shift-assets/
├── README.md                    # Project overview
├── ASSET_MAP.md                 # This file
├── generate_all.py              # Master generation script
├── generate_assets.py           # Tileset generator
├── generate_player.py           # Player sprite generator
├── generate_enemies.py          # Enemy sprite generator
├── generate_ui.py               # UI icon generator
├── tileset/
│   └── environment_tileset.png  # 128x64 (8×4 tiles of 16x16)
├── player/
│   └── player_spritesheet.png   # 160x128 (5×4 sprites of 32x32)
├── enemies/
│   └── patroller_spritesheet.png # 224x32 (7×1 sprites of 32x32)
└── ui/
    ├── ui_icons_16x16.png       # 96x16 (6 icons of 16x16)
    └── ui_icons_32x32.png       # 192x32 (6 icons of 32x32)
```

---

## Generation Instructions

### Requirements
- Python 3.6+
- Pillow (PIL) library

### Install Dependencies
```bash
pip install Pillow
```

### Generate All Assets
```bash
cd dungeon-shift-assets
python generate_all.py
```

### Generate Individual Asset Types
```bash
python generate_assets.py   # Tileset only
python generate_player.py   # Player only
python generate_enemies.py  # Enemies only
python generate_ui.py       # UI icons only
```

---

## License & Usage

These assets are original creations for the Dungeon Shift game. All sprites use a consistent art style and color palette for visual cohesion.

**Style Notes**:
- Top-down perspective
- Fantasy dungeon theme
- Clean, readable pixel art
- High contrast for visibility
- No specific IP inspiration
- Suitable for puzzle/adventure games
