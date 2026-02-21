#!/usr/bin/env python3
"""
Generate pixel art assets for Dungeon Shift game
Creates original top-down pixel art with a fantasy dungeon theme
"""

from PIL import Image, ImageDraw
import os

# Color palette (16-24 colors, high contrast)
PALETTE = {
    # Grays and blacks
    'black': (20, 20, 25),
    'dark_gray': (45, 45, 50),
    'gray': (80, 80, 85),
    'light_gray': (140, 140, 145),
    'white': (240, 240, 245),
    
    # Stone/Wall colors
    'stone_dark': (60, 55, 65),
    'stone': (95, 90, 100),
    'stone_light': (130, 125, 135),
    
    # Floor colors
    'floor_dark': (70, 65, 60),
    'floor': (100, 95, 85),
    'floor_light': (130, 120, 105),
    
    # Accent colors
    'gold': (255, 200, 50),
    'gold_dark': (180, 140, 30),
    'blue': (60, 120, 200),
    'blue_light': (100, 160, 240),
    'green': (80, 180, 80),
    'green_dark': (50, 120, 50),
    'red': (220, 60, 60),
    'red_dark': (150, 40, 40),
    'purple': (160, 80, 180),
    'purple_light': (200, 120, 220),
    'orange': (230, 120, 50),
    'yellow': (255, 220, 80),
    'slime_green': (120, 200, 100),
}

def create_tileset():
    """Create 16x16 environment tileset"""
    tile_size = 16
    tiles_per_row = 8
    rows = 5  # Increased to 5 rows
    
    img = Image.new('RGBA', (tile_size * tiles_per_row, tile_size * rows), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    def draw_tile(x, y, draw_func):
        """Helper to draw a tile at grid position"""
        px = x * tile_size
        py = y * tile_size
        draw_func(draw, px, py, tile_size)
    
    # Row 0: Floors and Walls
    draw_tile(0, 0, draw_floor_1)
    draw_tile(1, 0, draw_floor_2)
    draw_tile(2, 0, draw_wall_1)
    draw_tile(3, 0, draw_wall_2)
    
    # Row 1: Doors and Portals
    draw_tile(0, 1, draw_door_locked)
    draw_tile(1, 1, draw_door_unlocked)
    draw_tile(2, 1, draw_portal_locked)
    draw_tile(3, 1, draw_portal_unlocked)
    draw_tile(4, 1, draw_key_tile)
    
    # Row 2: Hazards
    draw_tile(0, 2, draw_spikes_retracted)
    draw_tile(1, 2, draw_spikes_extended)
    draw_tile(2, 2, draw_cracked_floor_1)
    draw_tile(3, 2, draw_cracked_floor_2)
    draw_tile(4, 2, draw_hole)
    
    # Row 3: Special tiles
    draw_tile(0, 3, draw_slime_tile)
    draw_tile(1, 3, draw_arrow_trap_up)
    draw_tile(2, 3, draw_arrow_trap_right)
    draw_tile(3, 3, draw_arrow_trap_down)
    draw_tile(4, 3, draw_arrow_trap_left)
    draw_tile(5, 3, draw_switch_off)
    draw_tile(6, 3, draw_switch_on)
    draw_tile(7, 3, draw_anchor_tile)
    
    # Row 4: Power-ups and indicators
    draw_tile(0, 4, draw_phase_step_token)
    draw_tile(1, 4, draw_undo_token)
    draw_tile(2, 4, draw_shield_token)
    draw_tile(3, 4, draw_telegraph_warning)
    
    return img

# Tile drawing functions
def draw_floor_1(draw, x, y, size):
    """Basic stone floor"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Add some texture
    for i in range(3):
        for j in range(3):
            px = x + 2 + i * 5
            py = y + 2 + j * 5
            draw.point((px, py), fill=PALETTE['floor_dark'])
    draw.rectangle([x, y, x+size-1, y], fill=PALETTE['floor_light'])
    draw.rectangle([x, y, x, y+size-1], fill=PALETTE['floor_light'])

def draw_floor_2(draw, x, y, size):
    """Alternate floor with different pattern"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Diagonal pattern
    for i in range(0, size, 4):
        draw.line([x+i, y, x, y+i], fill=PALETTE['floor_dark'])
        draw.line([x+size-1, y+i, x+i, y+size-1], fill=PALETTE['floor_dark'])

def draw_wall_1(draw, x, y, size):
    """Stone wall block"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['stone'])
    draw.rectangle([x+1, y+1, x+size-2, y+size-2], fill=PALETTE['stone_light'])
    draw.rectangle([x+2, y+2, x+size-3, y+size-3], fill=PALETTE['stone'])
    # Brick lines
    draw.line([x, y+size//2, x+size-1, y+size//2], fill=PALETTE['stone_dark'])
    draw.line([x+size//2, y, x+size//2, y+size-1], fill=PALETTE['stone_dark'])

def draw_wall_2(draw, x, y, size):
    """Alternate wall with different brick pattern"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['stone'])
    # Horizontal bricks
    for i in range(0, size, 5):
        draw.line([x, y+i, x+size-1, y+i], fill=PALETTE['stone_dark'])
    draw.line([x+size//2, y, x+size//2, y+size//2], fill=PALETTE['stone_dark'])
    draw.line([x+size//2, y+size//2+5, x+size//2, y+size-1], fill=PALETTE['stone_dark'])

def draw_door_locked(draw, x, y, size):
    """Locked door"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+3, y+2, x+size-4, y+size-3], fill=PALETTE['gray'])
    draw.rectangle([x+4, y+3, x+size-5, y+size-4], fill=PALETTE['dark_gray'])
    # Lock symbol
    draw.rectangle([x+6, y+8, x+9, y+11], fill=PALETTE['gold_dark'])
    draw.point((x+7, y+7), fill=PALETTE['gold_dark'])
    draw.point((x+8, y+7), fill=PALETTE['gold_dark'])

def draw_door_unlocked(draw, x, y, size):
    """Unlocked door (open)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+2, y+2, x+4, y+size-3], fill=PALETTE['gray'])
    draw.rectangle([x+size-5, y+2, x+size-3, y+size-3], fill=PALETTE['gray'])

def draw_portal_locked(draw, x, y, size):
    """Locked exit portal"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    # Portal frame
    draw.ellipse([x+3, y+3, x+size-4, y+size-4], fill=PALETTE['purple'])
    draw.ellipse([x+5, y+5, x+size-6, y+size-6], fill=PALETTE['black'])
    # X mark (locked)
    draw.line([x+6, y+6, x+9, y+9], fill=PALETTE['red'])
    draw.line([x+9, y+6, x+6, y+9], fill=PALETTE['red'])

def draw_portal_unlocked(draw, x, y, size):
    """Unlocked portal (glowing)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    # Glowing portal
    draw.ellipse([x+2, y+2, x+size-3, y+size-3], fill=PALETTE['purple_light'])
    draw.ellipse([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['purple'])
    draw.ellipse([x+6, y+6, x+size-7, y+size-7], fill=PALETTE['blue_light'])
    # Glow points
    draw.point((x+3, y+8), fill=PALETTE['white'])
    draw.point((x+12, y+8), fill=PALETTE['white'])

def draw_key_tile(draw, x, y, size):
    """Key indicator tile"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Key shape
    draw.rectangle([x+4, y+6, x+7, y+9], fill=PALETTE['gold'])
    draw.rectangle([x+7, y+7, x+11, y+8], fill=PALETTE['gold'])
    draw.point((x+11, y+6), fill=PALETTE['gold'])
    draw.point((x+11, y+9), fill=PALETTE['gold'])
    # Shine
    draw.point((x+5, y+7), fill=PALETTE['white'])

def draw_spikes_retracted(draw, x, y, size):
    """Retracted spikes (safe)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    # Small spike holes
    for i in range(4):
        px = x + 3 + i * 3
        draw.point((px, y+size-3), fill=PALETTE['black'])

def draw_spikes_extended(draw, x, y, size):
    """Extended spikes (dangerous)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    # Sharp spikes
    for i in range(4):
        px = x + 3 + i * 3
        draw.line([px, y+size-2, px, y+size-6], fill=PALETTE['gray'])
        draw.point((px, y+size-7), fill=PALETTE['light_gray'])

def draw_cracked_floor_1(draw, x, y, size):
    """Slightly cracked floor"""
    draw_floor_1(draw, x, y, size)
    # Small cracks
    draw.line([x+4, y+6, x+7, y+6], fill=PALETTE['black'])
    draw.line([x+7, y+6, x+9, y+8], fill=PALETTE['black'])
    draw.point((x+10, y+10), fill=PALETTE['black'])

def draw_cracked_floor_2(draw, x, y, size):
    """Very cracked floor"""
    draw_floor_1(draw, x, y, size)
    # More cracks
    draw.line([x+3, y+5, x+8, y+5], fill=PALETTE['black'])
    draw.line([x+8, y+5, x+11, y+8], fill=PALETTE['black'])
    draw.line([x+5, y+9, x+9, y+11], fill=PALETTE['black'])
    draw.line([x+4, y+11, x+7, y+13], fill=PALETTE['black'])

def draw_hole(draw, x, y, size):
    """Void/hole tile"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['black'])
    draw.ellipse([x+2, y+2, x+size-3, y+size-3], fill=PALETTE['dark_gray'])
    draw.ellipse([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['black'])

def draw_slime_tile(draw, x, y, size):
    """Slime puddle tile"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    # Slime puddle
    draw.ellipse([x+2, y+4, x+size-3, y+size-5], fill=PALETTE['slime_green'])
    draw.ellipse([x+4, y+5, x+size-5, y+size-6], fill=PALETTE['green'])
    # Shine
    draw.point((x+5, y+6), fill=PALETTE['white'])
    draw.point((x+10, y+8), fill=PALETTE['white'])

def draw_arrow_trap_up(draw, x, y, size):
    """Arrow trap pointing up"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['stone'])
    # Arrow pointing up
    draw.line([x+8, y+6, x+8, y+10], fill=PALETTE['orange'])
    draw.point((x+7, y+7), fill=PALETTE['orange'])
    draw.point((x+9, y+7), fill=PALETTE['orange'])

def draw_arrow_trap_right(draw, x, y, size):
    """Arrow trap pointing right"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['stone'])
    # Arrow pointing right
    draw.line([x+6, y+8, x+10, y+8], fill=PALETTE['orange'])
    draw.point((x+9, y+7), fill=PALETTE['orange'])
    draw.point((x+9, y+9), fill=PALETTE['orange'])

def draw_arrow_trap_down(draw, x, y, size):
    """Arrow trap pointing down"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['stone'])
    # Arrow pointing down
    draw.line([x+8, y+6, x+8, y+10], fill=PALETTE['orange'])
    draw.point((x+7, y+9), fill=PALETTE['orange'])
    draw.point((x+9, y+9), fill=PALETTE['orange'])

def draw_arrow_trap_left(draw, x, y, size):
    """Arrow trap pointing left"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+4, y+4, x+size-5, y+size-5], fill=PALETTE['stone'])
    # Arrow pointing left
    draw.line([x+6, y+8, x+10, y+8], fill=PALETTE['orange'])
    draw.point((x+7, y+7), fill=PALETTE['orange'])
    draw.point((x+7, y+9), fill=PALETTE['orange'])

def draw_switch_off(draw, x, y, size):
    """Switch tile (off state)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+5, y+5, x+size-6, y+size-6], fill=PALETTE['stone'])
    draw.rectangle([x+6, y+6, x+size-7, y+size-7], fill=PALETTE['gray'])

def draw_switch_on(draw, x, y, size):
    """Switch tile (on state)"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor_dark'])
    draw.rectangle([x+5, y+5, x+size-6, y+size-6], fill=PALETTE['stone'])
    draw.rectangle([x+6, y+6, x+size-7, y+size-7], fill=PALETTE['green'])
    # Glow
    draw.point((x+7, y+7), fill=PALETTE['white'])

def draw_anchor_tile(draw, x, y, size):
    """Anchor point tile"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Anchor symbol
    draw.ellipse([x+6, y+5, x+9, y+8], fill=PALETTE['blue'])
    draw.rectangle([x+7, y+8, x+8, y+11], fill=PALETTE['blue'])
    draw.line([x+5, y+10, x+10, y+10], fill=PALETTE['blue'])
    draw.point((x+5, y+11), fill=PALETTE['blue'])
    draw.point((x+10, y+11), fill=PALETTE['blue'])

def draw_phase_step_token(draw, x, y, size):
    """Phase step power-up token"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Ghost/phase symbol (translucent square)
    for i in range(5, 11):
        draw.point((x+i, y+5), fill=PALETTE['purple_light'])
        draw.point((x+i, y+10), fill=PALETTE['purple_light'])
        draw.point((x+5, y+i), fill=PALETTE['purple_light'])
        draw.point((x+10, y+i), fill=PALETTE['purple_light'])
    # Sparkle
    draw.point((x+7, y+7), fill=PALETTE['white'])

def draw_undo_token(draw, x, y, size):
    """Undo power-up token"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Circular arrow (undo symbol) - simplified
    for i in range(6, 10):
        draw.point((x+i, y+5), fill=PALETTE['blue_light'])
        draw.point((x+5, y+i), fill=PALETTE['blue_light'])
        draw.point((x+10, y+i), fill=PALETTE['blue_light'])
    # Arrow head
    draw.point((x+8, y+5), fill=PALETTE['blue_light'])
    draw.point((x+9, y+6), fill=PALETTE['blue_light'])

def draw_shield_token(draw, x, y, size):
    """Shield power-up token"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Shield shape
    draw.polygon([(x+8, y+5), (x+11, y+7), (x+11, y+10), (x+8, y+12), (x+5, y+10), (x+5, y+7)], fill=PALETTE['blue'])
    draw.polygon([(x+8, y+6), (x+10, y+8), (x+10, y+10), (x+8, y+11), (x+6, y+10), (x+6, y+8)], fill=PALETTE['blue_light'])
    # Cross emblem
    draw.line([x+8, y+8, x+8, y+10], fill=PALETTE['white'])
    draw.line([x+7, y+9, x+9, y+9], fill=PALETTE['white'])

def draw_telegraph_warning(draw, x, y, size):
    """Telegraph warning indicator"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=(0, 0, 0, 0))
    # Exclamation mark
    draw.rectangle([x+7, y+4, x+8, y+10], fill=PALETTE['orange'])
    draw.point((x+7, y+12), fill=PALETTE['orange'])
    draw.point((x+8, y+12), fill=PALETTE['orange'])
    # Glow effect
    draw.point((x+6, y+6), fill=PALETTE['yellow'])
    draw.point((x+9, y+6), fill=PALETTE['yellow'])

if __name__ == '__main__':
    os.makedirs('tileset', exist_ok=True)
    
    print("Generating tileset...")
    tileset = create_tileset()
    tileset.save('tileset/environment_tileset.png')
    print("✓ Tileset saved to tileset/environment_tileset.png")

def draw_phase_step_token(draw, x, y, size):
    """Phase step power-up token"""
    draw.rectangle([x, y, x+size-1, y+size-1], fill=PALETTE['floor'])
    # Ghost/phase symbol (translucent square)
    for i in range(5, 11):
        draw.point((i, y+5), fill=PALETTE['purple_light'])
        draw.point((i, y+10), fill=PALETTE['purple_light'])
        draw.point((x+5, y+i), fill=PALETTE['purple_light'])
