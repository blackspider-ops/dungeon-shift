# Dungeon Shift - Pixel Art Assets

🎮 **Complete, original top-down pixel art asset pack for 2D grid puzzle games**

![Status](https://img.shields.io/badge/status-ready-brightgreen) ![Style](https://img.shields.io/badge/style-pixel%20art-blue) ![License](https://img.shields.io/badge/license-custom-orange)

## ✨ What's Included

### 🗺️ Environment Tileset (16×16)
**17 unique tiles** including:
- 2 floor variants with different patterns
- 2 wall variants with brick details
- Locked/unlocked doors and portals
- Hazards: spikes, cracked floors, holes
- Special tiles: slime, arrow traps, switches, anchors

**File**: `tileset/environment_tileset.png` (128×64 pixels)

### 🏃 Player Sprites (32×32)
**20 animation frames**:
- 4 directional idle poses
- 4-frame walk cycle for each direction (16 frames total)
- Blue tunic hero with clean, readable design

**File**: `player/player_spritesheet.png` (160×128 pixels)

### 👾 Enemy Sprites (32×32)
**7 animation frames**:
- 2-frame idle breathing animation
- 4 directional movement frames
- Alert state with exclamation mark
- Red blob "Patroller" enemy design

**File**: `enemies/patroller_spritesheet.png` (224×32 pixels)

### 🎨 UI Icons
**5 essential icons** in two sizes:
- Hearts (full/empty) for health
- Key icon for inventory
- Move counter (footprint)
- Shift/swap arrows

**Files**: 
- `ui/ui_icons_16x16.png` (96×16 pixels)
- `ui/ui_icons_32x32.png` (192×32 pixels)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate All Assets
```bash
python generate_all.py
```

### 3. Use in Your Game
All PNG files are ready to use with transparent backgrounds!

---

## 📋 Asset Specifications

| Feature | Details |
|---------|---------|
| **Style** | Top-down pixel art, fantasy dungeon theme |
| **Palette** | 24 colors, high contrast |
| **Tile Size** | 16×16 pixels |
| **Sprite Size** | 32×32 pixels |
| **Format** | PNG with alpha transparency |
| **Lighting** | Consistent top-left light source |

---

## 📁 Directory Structure

```
dungeon-shift-assets/
├── 📄 README.md                    ← You are here
├── 📄 QUICKSTART.md                ← 3-step setup guide
├── 📄 ASSET_MAP.md                 ← Detailed sprite coordinates
├── 📄 USAGE_EXAMPLES.md            ← Code examples (Canvas, Phaser, Unity, Godot)
├── 📄 VISUAL_REFERENCE.md          ← Color palette & design guide
├── 📄 LICENSE.md                   ← Usage terms
│
├── 🎨 tileset/
│   └── environment_tileset.png     ← 17 tiles (128×64)
│
├── 🏃 player/
│   └── player_spritesheet.png      ← 20 frames (160×128)
│
├── 👾 enemies/
│   └── patroller_spritesheet.png   ← 7 frames (224×32)
│
├── 🎯 ui/
│   ├── ui_icons_16x16.png          ← 5 icons (96×16)
│   └── ui_icons_32x32.png          ← 5 icons (192×32)
│
└── 🐍 Generation Scripts
    ├── generate_all.py             ← Master script
    ├── generate_assets.py          ← Tileset generator
    ├── generate_player.py          ← Player generator
    ├── generate_enemies.py         ← Enemy generator
    └── generate_ui.py              ← UI generator
```

---

## 🎯 Key Features

✅ **100% Original** - No copied or derivative artwork  
✅ **Consistent Style** - Unified art direction across all assets  
✅ **High Contrast** - Clear visibility on any background  
✅ **Pixel Perfect** - Crisp rendering at integer scales  
✅ **Transparent PNGs** - Ready for any game engine  
✅ **Fully Documented** - Extensive guides and examples  
✅ **Customizable** - Python scripts for easy modifications  
✅ **Game Engine Ready** - Examples for Canvas, Phaser, Unity, Godot  

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **QUICKSTART.md** | Get started in 3 steps |
| **ASSET_MAP.md** | Sprite coordinates and grid layouts |
| **USAGE_EXAMPLES.md** | Code examples for popular engines |
| **VISUAL_REFERENCE.md** | Color palette, timing, design philosophy |
| **LICENSE.md** | Usage terms and attribution |

---

## 🎨 Color Palette

24-color palette with high contrast:

**Core**: Black, grays, white  
**Environment**: Stone and floor tones  
**Accents**: Gold, blue, green, red, purple, orange  

See `VISUAL_REFERENCE.md` for complete color codes.

---

## 🎮 Usage Examples

### HTML5 Canvas
```javascript
const tileset = new Image();
tileset.src = 'tileset/environment_tileset.png';

// Draw floor tile at position (32, 32)
ctx.drawImage(tileset, 0, 0, 16, 16, 32, 32, 32, 32);
```

### Phaser 3
```javascript
this.load.spritesheet('tiles', 'tileset/environment_tileset.png', {
    frameWidth: 16, frameHeight: 16
});
```

### Unity
```csharp
Sprite.Create(tilesetTexture, rect, pivot, 16);
```

### Godot
```gdscript
texture = load("res://tileset/environment_tileset.png")
```

See `USAGE_EXAMPLES.md` for complete implementations!

---

## 🛠️ Customization

Want different colors or designs? Easy!

1. Edit the `PALETTE` dictionary in any Python script
2. Modify the `draw_*` functions for different shapes
3. Run `python generate_all.py` to regenerate
4. See changes instantly!

---

## 📊 Asset Statistics

| Asset Type | Count | Total Frames | File Size |
|------------|-------|--------------|-----------|
| Environment Tiles | 17 | - | 128×64 px |
| Player Animations | 4 directions | 20 frames | 160×128 px |
| Enemy Animations | 1 type | 7 frames | 224×32 px |
| UI Icons | 5 icons | 2 sizes | 96×16 & 192×32 px |

**Total**: 42+ unique sprites ready for your game!

---

## 🎯 Perfect For

- Grid-based puzzle games
- Dungeon crawlers
- Roguelikes
- Top-down adventures
- Puzzle platformers
- Educational game projects
- Game jams

---

## 🤝 Contributing

Found a bug in the generation scripts? Want to add new tiles?

1. Modify the Python scripts
2. Test your changes
3. Share your improvements!

---

## 📜 License

**Assets**: Custom license - free for personal and commercial use with attribution  
**Scripts**: MIT License - use freely

See `LICENSE.md` for details.

---

## 🌟 Credits

Created as an original asset pack for "Dungeon Shift"  
Generated using Python + Pillow (PIL)

---

## 💡 Tips

- Use integer scaling (2×, 3×, 4×) for pixel-perfect rendering
- Disable texture filtering in your game engine
- Animate walk cycles at 8-12 FPS
- Layer sprites: Floor → Objects → Entities → UI
- Use smaller collision boxes than sprite size

---

## 📞 Support

Questions? Check the documentation:
1. `QUICKSTART.md` - Setup issues
2. `ASSET_MAP.md` - Sprite coordinates
3. `USAGE_EXAMPLES.md` - Integration help
4. `VISUAL_REFERENCE.md` - Design questions

---

**Ready to build your dungeon puzzle game? Start with `QUICKSTART.md`!** 🎮✨
