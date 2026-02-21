#!/usr/bin/env python3
"""
Generate player sprites for Dungeon Shift
32x32 sprites with 4-direction walk cycles
"""

from PIL import Image, ImageDraw
import os

# Use same palette as tileset
PALETTE = {
    'black': (20, 20, 25),
    'dark_gray': (45, 45, 50),
    'gray': (80, 80, 85),
    'light_gray': (140, 140, 145),
    'white': (240, 240, 245),
    'skin': (230, 180, 140),
    'skin_dark': (190, 140, 100),
    'blue': (60, 120, 200),
    'blue_dark': (40, 80, 140),
    'blue_light': (100, 160, 240),
    'brown': (100, 70, 50),
    'brown_dark': (70, 50, 35),
    'red': (220, 60, 60),
}

def create_player_spritesheet():
    """Create player spritesheet with all animations"""
    sprite_size = 32
    # Layout: 4 rows (directions) x 5 columns (idle + 4 walk frames)
    cols = 5
    rows = 4
    
    img = Image.new('RGBA', (sprite_size * cols, sprite_size * rows), (0, 0, 0, 0))
    
    # Row 0: Down
    draw_player_idle(img, 0, 0, sprite_size, 'down')
    for i in range(4):
        draw_player_walk(img, i+1, 0, sprite_size, 'down', i)
    
    # Row 1: Up
    draw_player_idle(img, 0, 1, sprite_size, 'up')
    for i in range(4):
        draw_player_walk(img, i+1, 1, sprite_size, 'up', i)
    
    # Row 2: Left
    draw_player_idle(img, 0, 2, sprite_size, 'left')
    for i in range(4):
        draw_player_walk(img, i+1, 2, sprite_size, 'left', i)
    
    # Row 3: Right
    draw_player_idle(img, 0, 3, sprite_size, 'right')
    for i in range(4):
        draw_player_walk(img, i+1, 3, sprite_size, 'right', i)
    
    return img

def draw_player_idle(img, col, row, size, direction):
    """Draw idle player sprite"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Body center
    cx = x + size // 2
    cy = y + size // 2
    
    if direction == 'down':
        # Head
        draw.ellipse([cx-5, cy-8, cx+4, cy+1], fill=PALETTE['skin'])
        # Eyes
        draw.point((cx-2, cy-4), fill=PALETTE['black'])
        draw.point((cx+1, cy-4), fill=PALETTE['black'])
        # Body (tunic)
        draw.rectangle([cx-5, cy+1, cx+4, cy+10], fill=PALETTE['blue'])
        draw.rectangle([cx-4, cy+2, cx+3, cy+9], fill=PALETTE['blue_light'])
        # Arms
        draw.rectangle([cx-7, cy+2, cx-6, cy+8], fill=PALETTE['skin'])
        draw.rectangle([cx+5, cy+2, cx+6, cy+8], fill=PALETTE['skin'])
        # Legs
        draw.rectangle([cx-4, cy+10, cx-2, cy+15], fill=PALETTE['brown'])
        draw.rectangle([cx+1, cy+10, cx+3, cy+15], fill=PALETTE['brown'])
        
    elif direction == 'up':
        # Head (back of head)
        draw.ellipse([cx-5, cy-8, cx+4, cy+1], fill=PALETTE['brown_dark'])
        # Body
        draw.rectangle([cx-5, cy+1, cx+4, cy+10], fill=PALETTE['blue_dark'])
        # Arms
        draw.rectangle([cx-7, cy+2, cx-6, cy+8], fill=PALETTE['skin_dark'])
        draw.rectangle([cx+5, cy+2, cx+6, cy+8], fill=PALETTE['skin_dark'])
        # Legs
        draw.rectangle([cx-4, cy+10, cx-2, cy+15], fill=PALETTE['brown_dark'])
        draw.rectangle([cx+1, cy+10, cx+3, cy+15], fill=PALETTE['brown_dark'])
        
    elif direction == 'left':
        # Head (side view)
        draw.ellipse([cx-6, cy-8, cx+3, cy+1], fill=PALETTE['skin'])
        # Eye
        draw.point((cx-3, cy-4), fill=PALETTE['black'])
        # Body
        draw.rectangle([cx-5, cy+1, cx+4, cy+10], fill=PALETTE['blue'])
        draw.rectangle([cx-4, cy+2, cx+3, cy+9], fill=PALETTE['blue_light'])
        # Arm (visible)
        draw.rectangle([cx-7, cy+3, cx-6, cy+8], fill=PALETTE['skin'])
        # Legs
        draw.rectangle([cx-4, cy+10, cx-2, cy+15], fill=PALETTE['brown'])
        draw.rectangle([cx+1, cy+10, cx+3, cy+15], fill=PALETTE['brown'])
        
    elif direction == 'right':
        # Head (side view)
        draw.ellipse([cx-4, cy-8, cx+5, cy+1], fill=PALETTE['skin'])
        # Eye
        draw.point((cx+2, cy-4), fill=PALETTE['black'])
        # Body
        draw.rectangle([cx-5, cy+1, cx+4, cy+10], fill=PALETTE['blue'])
        draw.rectangle([cx-4, cy+2, cx+3, cy+9], fill=PALETTE['blue_light'])
        # Arm (visible)
        draw.rectangle([cx+5, cy+3, cx+6, cy+8], fill=PALETTE['skin'])
        # Legs
        draw.rectangle([cx-4, cy+10, cx-2, cy+15], fill=PALETTE['brown'])
        draw.rectangle([cx+1, cy+10, cx+3, cy+15], fill=PALETTE['brown'])

def draw_player_walk(img, col, row, size, direction, frame):
    """Draw walking animation frame"""
    # Start with idle pose
    draw_player_idle(img, col, row, size, direction)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    cy = y + size // 2
    
    # Animate legs based on frame
    leg_offset = [0, 1, 0, -1][frame]
    
    if direction in ['down', 'up']:
        # Clear old legs
        draw.rectangle([cx-5, cy+10, cx+4, cy+16], fill=(0, 0, 0, 0))
        # Redraw with offset
        leg_color = PALETTE['brown'] if direction == 'down' else PALETTE['brown_dark']
        draw.rectangle([cx-4, cy+10+leg_offset, cx-2, cy+15+leg_offset], fill=leg_color)
        draw.rectangle([cx+1, cy+10-leg_offset, cx+3, cy+15-leg_offset], fill=leg_color)
        
    elif direction in ['left', 'right']:
        # Clear old legs
        draw.rectangle([cx-5, cy+10, cx+4, cy+16], fill=(0, 0, 0, 0))
        # Redraw with offset
        draw.rectangle([cx-4, cy+10+leg_offset, cx-2, cy+15+leg_offset], fill=PALETTE['brown'])
        draw.rectangle([cx+1, cy+10-leg_offset, cx+3, cy+15-leg_offset], fill=PALETTE['brown'])
        
        # Bob the body slightly
        if frame in [1, 3]:
            # Shift entire sprite up by 1 pixel for bob effect
            pass  # Keep simple for now

if __name__ == '__main__':
    os.makedirs('player', exist_ok=True)
    
    print("Generating player sprites...")
    player_sheet = create_player_spritesheet()
    player_sheet.save('player/player_spritesheet.png')
    print("✓ Player spritesheet saved to player/player_spritesheet.png")
    print("  Layout: 5 cols x 4 rows")
    print("  Row 0: Down (idle + 4 walk frames)")
    print("  Row 1: Up (idle + 4 walk frames)")
    print("  Row 2: Left (idle + 4 walk frames)")
    print("  Row 3: Right (idle + 4 walk frames)")
