# Quick Start Guide

## Generate Your Assets in 3 Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate All Assets
```bash
python generate_all.py
```

### 3. Find Your Assets
All PNG files will be created in their respective folders:
- `tileset/environment_tileset.png`
- `player/player_spritesheet.png`
- `enemies/patroller_spritesheet.png`
- `ui/ui_icons_16x16.png`
- `ui/ui_icons_32x32.png`

## What You Get

### Environment Tileset (16x16)
17 unique tiles including floors, walls, doors, portals, hazards, and special tiles.

### Player Sprites (32x32)
20 frames total: 4 directions × (1 idle + 4 walk frames)

### Enemy Sprites (32x32)
7 frames: 2 idle, 4 directional movement, 1 alert state

### UI Icons
5 icons in both 16x16 and 32x32 sizes

## Customization

Want to change colors or designs? Edit the Python scripts:
- `PALETTE` dictionary contains all colors
- Individual `draw_*` functions create each sprite
- Modify and re-run to see changes instantly

## Need Help?

Check `ASSET_MAP.md` for detailed sprite coordinates and usage examples.
