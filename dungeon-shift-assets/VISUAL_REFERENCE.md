# Visual Reference Guide

## Color Palette Reference

### Primary Colors
```
Black       #141419  ████  Core shadows, outlines
Dark Gray   #2D2D32  ████  Deep shadows
Gray        #505055  ████  Mid-tones
Light Gray  #8C8C91  ████  Highlights
White       #F0F0F5  ████  Bright highlights, shine
```

### Environment Colors
```
Stone Dark  #3C3741  ████  Wall shadows
Stone       #5F5A64  ████  Wall base
Stone Light #827D87  ████  Wall highlights

Floor Dark  #46413C  ████  Floor shadows
Floor       #645F55  ████  Floor base
Floor Light #827869  ████  Floor highlights
```

### Accent Colors
```
Gold        #FFC832  ████  Keys, treasure
Gold Dark   #B48C1E  ████  Gold shadows

Blue        #3C78C8  ████  Portals, UI
Blue Light  #64A0F0  ████  Portal glow

Green       #50B450  ████  Active switches
Green Dark  #327832  ████  Green shadows

Red         #DC3C3C  ████  Enemies, danger
Red Dark    #962828  ████  Enemy shadows

Purple      #A050B4  ████  Portals
Purple Light #C878DC ████  Portal effects

Orange      #E67832  ████  Traps, alerts
Slime Green #78C864  ████  Slime hazards
```

---

## Tileset Grid Reference

```
Environment Tileset (128x64 pixels = 8×4 tiles of 16×16)

Row 0: Basic Tiles
┌────┬────┬────┬────┬────┬────┬────┬────┐
│Flr1│Flr2│Wal1│Wal2│    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┘

Row 1: Doors & Portals
┌────┬────┬────┬────┬────┬────┬────┬────┐
│DLck│DOpn│PLck│POpn│ Key│    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┘

Row 2: Hazards
┌────┬────┬────┬────┬────┬────┬────┬────┐
│SpkR│SpkE│Crk1│Crk2│Hole│    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┘

Row 3: Special Tiles
┌────┬────┬────┬────┬────┬────┬────┬────┐
│Slim│ArwU│ArwR│SwOf│SwOn│Ancr│    │    │
└────┴────┴────┴────┴────┴────┴────┴────┘

Legend:
Flr = Floor, Wal = Wall, DLck = Door Locked, DOpn = Door Open
PLck = Portal Locked, POpn = Portal Open
SpkR = Spikes Retracted, SpkE = Spikes Extended
Crk = Cracked, Slim = Slime, Arw = Arrow Trap
SwOf = Switch Off, SwOn = Switch On, Ancr = Anchor
```

---

## Player Spritesheet Grid Reference

```
Player Spritesheet (160x128 pixels = 5×4 sprites of 32×32)

┌─────┬─────┬─────┬─────┬─────┐
│Idle │Walk1│Walk2│Walk3│Walk4│ ← Down
├─────┼─────┼─────┼─────┼─────┤
│Idle │Walk1│Walk2│Walk3│Walk4│ ← Up
├─────┼─────┼─────┼─────┼─────┤
│Idle │Walk1│Walk2│Walk3│Walk4│ ← Left
├─────┼─────┼─────┼─────┼─────┤
│Idle │Walk1│Walk2│Walk3│Walk4│ ← Right
└─────┴─────┴─────┴─────┴─────┘

Character Features:
- Blue tunic with light blue highlights
- Brown hair and pants
- Skin tone visible on face and arms
- Simple, readable silhouette
- 4-frame walk cycle per direction
```

---

## Enemy Spritesheet Grid Reference

```
Patroller Enemy (224x32 pixels = 7×1 sprites of 32×32)

┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│Idle1│Idle2│Down │ Up  │Left │Right│Alert│
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Enemy Features:
- Red blob creature
- Yellow eyes with black pupils
- Stretches in movement direction
- Shadow underneath
- Exclamation mark when alert
```

---

## UI Icons Grid Reference

```
UI Icons 16×16 (96x16 pixels = 6×1 icons)

┌────┬────┬────┬────┬────┬────┐
│♥ F │♥ E │Key │Foot│Swap│    │
└────┴────┴────┴────┴────┴────┘

UI Icons 32×32 (192x32 pixels = 6×1 icons)

┌─────┬─────┬─────┬─────┬─────┬─────┐
│ ♥ F │ ♥ E │ Key │Foot │Swap │     │
└─────┴─────┴─────┴─────┴─────┴─────┘

Legend:
♥ F = Heart Full, ♥ E = Heart Empty
Key = Key icon, Foot = Move counter
Swap = Shift/swap arrows
```

---

## Animation Timing Guide

### Player Animations
- **Idle**: Static frame (no animation)
- **Walk Cycle**: 4 frames @ 8-12 FPS
  - Frame timing: 83-125ms per frame
  - Loop: 1 → 2 → 3 → 4 → repeat

### Enemy Animations
- **Idle Breathing**: 2 frames @ 4-6 FPS
  - Frame timing: 166-250ms per frame
  - Loop: 1 ↔ 2
- **Movement**: Use directional frame (static)
- **Alert**: Show for 1 second, then return to idle

### Environmental Animations
- **Portal (unlocked)**: Can pulse/glow
  - Suggested: Fade between bright and dim @ 2-3 FPS
- **Switch (on)**: Can add subtle glow pulse
- **Spikes**: Transition over 200-300ms when extending/retracting

---

## Sprite Layering Order (Bottom to Top)

1. **Floor Layer**: Floor tiles, holes
2. **Floor Objects**: Slime, switches, cracked floors
3. **Hazards**: Spikes (when extended)
4. **Entities**: Player, enemies
5. **Walls**: Wall tiles, doors
6. **Effects**: Portal glow, particle effects
7. **UI Layer**: Hearts, keys, counters

---

## Collision Box Recommendations

### Player (32×32 sprite)
- Collision box: 16×16 centered
- Offset: (8, 16) from sprite origin
- Allows smooth movement around corners

### Enemy (32×32 sprite)
- Collision box: 20×20 centered
- Offset: (6, 6) from sprite origin
- Slightly larger than player for challenge

### Tiles (16×16)
- **Walls**: Full 16×16 collision
- **Doors (locked)**: Full 16×16 collision
- **Doors (open)**: No collision
- **Spikes (extended)**: Full 16×16 damage zone
- **Spikes (retracted)**: No collision
- **Holes**: Full 16×16 fall zone
- **Switches**: 8×8 centered trigger zone

---

## Design Philosophy

### Readability First
- High contrast between elements
- Clear silhouettes
- Distinct colors for different mechanics
- No ambiguous shapes

### Consistent Style
- Top-down perspective throughout
- Consistent lighting (top-left)
- Same pixel density across all assets
- Unified color palette

### Gameplay Clarity
- Dangerous elements use warm colors (red, orange)
- Interactive elements use cool colors (blue, green)
- Locked/inactive states are darker
- Active/unlocked states are brighter/glowing

---

## Customization Tips

### Changing Colors
Edit the `PALETTE` dictionary in any generation script:
```python
PALETTE = {
    'red': (220, 60, 60),  # Change to your preferred red
    # ... other colors
}
```

### Adding New Tiles
1. Add a new `draw_*` function in `generate_assets.py`
2. Call it in `create_tileset()` with grid coordinates
3. Re-run the generation script

### Modifying Sprites
- Each sprite has its own `draw_*` function
- Modify the drawing commands (rectangles, ellipses, lines)
- Adjust positions and sizes as needed
- Re-generate to see changes

### Scaling for Different Resolutions
- 1x: Original size (16×16 tiles, 32×32 sprites)
- 2x: Recommended for 720p (32×32 tiles, 64×64 sprites)
- 3x: Good for 1080p (48×48 tiles, 96×96 sprites)
- 4x: For 4K displays (64×64 tiles, 128×128 sprites)

Always use integer scaling to maintain pixel-perfect appearance!
