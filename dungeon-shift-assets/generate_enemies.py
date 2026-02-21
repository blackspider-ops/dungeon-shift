#!/usr/bin/env python3
"""
Generate enemy sprites for Dungeon Shift
32x32 patroller enemy with idle and movement animations
"""

from PIL import Image, ImageDraw
import os

PALETTE = {
    'black': (20, 20, 25),
    'dark_gray': (45, 45, 50),
    'gray': (80, 80, 85),
    'light_gray': (140, 140, 145),
    'red': (220, 60, 60),
    'red_dark': (150, 40, 40),
    'red_light': (255, 100, 100),
    'orange': (230, 120, 50),
    'yellow': (255, 220, 80),
    'purple': (160, 80, 180),
    'purple_light': (200, 120, 220),
    'blue': (60, 120, 200),
}

def create_enemy_spritesheet():
    """Create patroller enemy spritesheet"""
    sprite_size = 32
    # Layout: Patroller (7) + Chaser (7) + Guard (7) = 21 frames
    cols = 21
    rows = 1
    
    img = Image.new('RGBA', (sprite_size * cols, sprite_size * rows), (0, 0, 0, 0))
    
    # Patroller enemy (frames 0-6)
    draw_patroller_idle(img, 0, 0, sprite_size, 0)
    draw_patroller_idle(img, 1, 0, sprite_size, 1)
    draw_patroller_move(img, 2, 0, sprite_size, 'down')
    draw_patroller_move(img, 3, 0, sprite_size, 'up')
    draw_patroller_move(img, 4, 0, sprite_size, 'left')
    draw_patroller_move(img, 5, 0, sprite_size, 'right')
    draw_patroller_alert(img, 6, 0, sprite_size)
    
    # Chaser enemy (frames 7-13)
    draw_chaser_idle(img, 7, 0, sprite_size, 0)
    draw_chaser_idle(img, 8, 0, sprite_size, 1)
    draw_chaser_move(img, 9, 0, sprite_size, 'down')
    draw_chaser_move(img, 10, 0, sprite_size, 'up')
    draw_chaser_move(img, 11, 0, sprite_size, 'left')
    draw_chaser_move(img, 12, 0, sprite_size, 'right')
    draw_chaser_alert(img, 13, 0, sprite_size)
    
    # Guard enemy (frames 14-20)
    draw_guard_idle(img, 14, 0, sprite_size, 0)
    draw_guard_idle(img, 15, 0, sprite_size, 1)
    draw_guard_attack(img, 16, 0, sprite_size, 'down')
    draw_guard_attack(img, 17, 0, sprite_size, 'up')
    draw_guard_attack(img, 18, 0, sprite_size, 'left')
    draw_guard_attack(img, 19, 0, sprite_size, 'right')
    draw_guard_alert(img, 20, 0, sprite_size)
    
    return img

def draw_patroller_idle(img, col, row, size, frame):
    """Draw idle patroller enemy (blob-like creature)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    cy = y + size // 2
    
    # Blob body (slightly animated)
    bob = 1 if frame == 1 else 0
    
    # Shadow
    draw.ellipse([cx-8, cy+8, cx+7, cy+10], fill=(0, 0, 0, 80))
    
    # Main body (red blob)
    draw.ellipse([cx-8, cy-6+bob, cx+7, cy+7+bob], fill=PALETTE['red_dark'])
    draw.ellipse([cx-7, cy-5+bob, cx+6, cy+6+bob], fill=PALETTE['red'])
    draw.ellipse([cx-6, cy-4+bob, cx+5, cy+5+bob], fill=PALETTE['red_light'])
    
    # Eyes (menacing)
    eye_y = cy - 2 + bob
    draw.rectangle([cx-5, eye_y, cx-3, eye_y+2], fill=PALETTE['yellow'])
    draw.rectangle([cx+2, eye_y, cx+4, eye_y+2], fill=PALETTE['yellow'])
    draw.point((cx-4, eye_y+1), fill=PALETTE['black'])
    draw.point((cx+3, eye_y+1), fill=PALETTE['black'])
    
    # Shine (blob texture)
    draw.point((cx-3, cy-3+bob), fill=PALETTE['red_light'])
    draw.point((cx-2, cy-4+bob), fill=PALETTE['red_light'])

def draw_patroller_move(img, col, row, size, direction):
    """Draw moving patroller"""
    # Start with idle frame 0
    draw_patroller_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    cy = y + size // 2
    
    # Add directional indicator (slight stretch)
    if direction == 'down':
        # Stretch downward slightly
        draw.ellipse([cx-7, cy-4, cx+6, cy+8], fill=PALETTE['red'])
    elif direction == 'up':
        # Stretch upward slightly
        draw.ellipse([cx-7, cy-7, cx+6, cy+5], fill=PALETTE['red'])
    elif direction == 'left':
        # Stretch left
        draw.ellipse([cx-9, cy-5, cx+5, cy+6], fill=PALETTE['red'])
    elif direction == 'right':
        # Stretch right
        draw.ellipse([cx-6, cy-5, cx+8, cy+6], fill=PALETTE['red'])

def draw_patroller_alert(img, col, row, size):
    """Draw alert state (exclamation mark above)"""
    draw_patroller_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    
    # Exclamation mark
    draw.rectangle([cx-1, y+4, cx, y+8], fill=PALETTE['orange'])
    draw.point((cx-1, y+9), fill=PALETTE['orange'])

# Chaser enemy functions
def draw_chaser_idle(img, col, row, size, frame):
    """Draw idle chaser enemy (purple fast blob)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    cy = y + size // 2
    
    # Blob body (slightly animated)
    bob = 1 if frame == 1 else 0
    
    # Shadow
    draw.ellipse([cx-8, cy+8, cx+7, cy+10], fill=(0, 0, 0, 80))
    
    # Main body (purple blob - faster looking)
    draw.ellipse([cx-7, cy-5+bob, cx+6, cy+6+bob], fill=PALETTE['purple'])
    draw.ellipse([cx-6, cy-4+bob, cx+5, cy+5+bob], fill=PALETTE['purple_light'])
    
    # Eyes (aggressive)
    eye_y = cy - 2 + bob
    draw.rectangle([cx-5, eye_y, cx-3, eye_y+2], fill=PALETTE['red'])
    draw.rectangle([cx+2, eye_y, cx+4, eye_y+2], fill=PALETTE['red'])
    draw.point((cx-4, eye_y+1), fill=PALETTE['black'])
    draw.point((cx+3, eye_y+1), fill=PALETTE['black'])
    
    # Speed lines
    draw.line([cx-9, cy-2+bob, cx-7, cy-2+bob], fill=PALETTE['purple_light'])
    draw.line([cx-9, cy+2+bob, cx-7, cy+2+bob], fill=PALETTE['purple_light'])

def draw_chaser_move(img, col, row, size, direction):
    """Draw moving chaser"""
    draw_chaser_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    cy = y + size // 2
    
    # Add directional stretch (more pronounced than patroller)
    if direction == 'down':
        draw.ellipse([cx-6, cy-3, cx+5, cy+8], fill=PALETTE['purple'])
    elif direction == 'up':
        draw.ellipse([cx-6, cy-7, cx+5, cy+4], fill=PALETTE['purple'])
    elif direction == 'left':
        draw.ellipse([cx-9, cy-4, cx+4, cy+5], fill=PALETTE['purple'])
    elif direction == 'right':
        draw.ellipse([cx-5, cy-4, cx+8, cy+5], fill=PALETTE['purple'])

def draw_chaser_alert(img, col, row, size):
    """Draw alert chaser"""
    draw_chaser_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    
    # Double exclamation marks (more urgent)
    draw.rectangle([cx-3, y+3, cx-2, y+7], fill=PALETTE['red'])
    draw.point((cx-3, y+8), fill=PALETTE['red'])
    draw.rectangle([cx+1, y+3, cx+2, y+7], fill=PALETTE['red'])
    draw.point((cx+1, y+8), fill=PALETTE['red'])

# Guard enemy functions
def draw_guard_idle(img, col, row, size, frame):
    """Draw idle guard enemy (armored stationary)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    cy = y + size // 2
    
    # Slight breathing animation
    bob = 1 if frame == 1 else 0
    
    # Shadow
    draw.ellipse([cx-8, cy+8, cx+7, cy+10], fill=(0, 0, 0, 80))
    
    # Body (armored look - gray/metal)
    draw.rectangle([cx-6, cy-4+bob, cx+5, cy+7+bob], fill=PALETTE['gray'])
    draw.rectangle([cx-5, cy-3+bob, cx+4, cy+6+bob], fill=PALETTE['light_gray'])
    
    # Helmet/head
    draw.ellipse([cx-5, cy-7+bob, cx+4, cy-2+bob], fill=PALETTE['dark_gray'])
    draw.ellipse([cx-4, cy-6+bob, cx+3, cy-3+bob], fill=PALETTE['gray'])
    
    # Visor (eyes)
    draw.rectangle([cx-4, cy-5+bob, cx-2, cy-4+bob], fill=PALETTE['red'])
    draw.rectangle([cx+1, cy-5+bob, cx+3, cy-4+bob], fill=PALETTE['red'])
    
    # Shield emblem
    draw.rectangle([cx-2, cy+1+bob, cx+1, cy+4+bob], fill=PALETTE['blue'])

def draw_guard_attack(img, col, row, size, direction):
    """Draw attacking guard"""
    draw_guard_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    cy = y + size // 2
    
    # Attack indicator (weapon/spike in direction)
    if direction == 'down':
        draw.line([cx, cy+8, cx, cy+12], fill=PALETTE['red'], width=2)
        draw.point((cx-1, cy+11), fill=PALETTE['red'])
        draw.point((cx+1, cy+11), fill=PALETTE['red'])
    elif direction == 'up':
        draw.line([cx, cy-8, cx, cy-12], fill=PALETTE['red'], width=2)
        draw.point((cx-1, cy-11), fill=PALETTE['red'])
        draw.point((cx+1, cy-11), fill=PALETTE['red'])
    elif direction == 'left':
        draw.line([cx-8, cy, cx-12, cy], fill=PALETTE['red'], width=2)
        draw.point((cx-11, cy-1), fill=PALETTE['red'])
        draw.point((cx-11, cy+1), fill=PALETTE['red'])
    elif direction == 'right':
        draw.line([cx+8, cy, cx+12, cy], fill=PALETTE['red'], width=2)
        draw.point((cx+11, cy-1), fill=PALETTE['red'])
        draw.point((cx+11, cy+1), fill=PALETTE['red'])

def draw_guard_alert(img, col, row, size):
    """Draw alert guard (telegraph attack)"""
    draw_guard_idle(img, col, row, size, 0)
    
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    cx = x + size // 2
    
    # Warning symbol
    draw.rectangle([cx-1, y+2, cx, y+6], fill=PALETTE['orange'])
    draw.point((cx-1, y+7), fill=PALETTE['orange'])

if __name__ == '__main__':
    os.makedirs('enemies', exist_ok=True)
    
    print("Generating enemy sprites...")
    enemy_sheet = create_enemy_spritesheet()
    enemy_sheet.save('enemies/patroller_spritesheet.png')
    print("✓ Enemy spritesheet saved to enemies/patroller_spritesheet.png")
    print("  Layout: 21 frames (7 per enemy type)")
    print("  Patroller (frames 0-6):")
    print("    Frame 0-1: Idle animation")
    print("    Frame 2: Move down")
