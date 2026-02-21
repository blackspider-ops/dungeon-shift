#!/usr/bin/env python3
"""
Generate UI icons for Dungeon Shift
16x16 and 32x32 icons for game interface
"""

from PIL import Image, ImageDraw
import os

PALETTE = {
    'black': (20, 20, 25),
    'dark_gray': (45, 45, 50),
    'gray': (80, 80, 85),
    'white': (240, 240, 245),
    'red': (220, 60, 60),
    'red_dark': (150, 40, 40),
    'gold': (255, 200, 50),
    'gold_dark': (180, 140, 30),
    'blue': (60, 120, 200),
    'blue_light': (100, 160, 240),
}

def create_ui_icons_16():
    """Create 16x16 UI icons"""
    icon_size = 16
    cols = 6
    
    img = Image.new('RGBA', (icon_size * cols, icon_size), (0, 0, 0, 0))
    
    draw_heart_full_16(img, 0, 0, icon_size)
    draw_heart_empty_16(img, 1, 0, icon_size)
    draw_key_icon_16(img, 2, 0, icon_size)
    draw_move_counter_16(img, 3, 0, icon_size)
    draw_shift_icon_16(img, 4, 0, icon_size)
    
    return img

def create_ui_icons_32():
    """Create 32x32 UI icons (larger versions)"""
    icon_size = 32
    cols = 6
    
    img = Image.new('RGBA', (icon_size * cols, icon_size), (0, 0, 0, 0))
    
    draw_heart_full_32(img, 0, 0, icon_size)
    draw_heart_empty_32(img, 1, 0, icon_size)
    draw_key_icon_32(img, 2, 0, icon_size)
    draw_move_counter_32(img, 3, 0, icon_size)
    draw_shift_icon_32(img, 4, 0, icon_size)
    
    return img

# 16x16 icon drawing functions
def draw_heart_full_16(img, col, row, size):
    """Full heart icon"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Heart shape
    cx = x + size // 2
    cy = y + size // 2
    
    # Top circles
    draw.ellipse([x+3, y+4, x+7, y+8], fill=PALETTE['red'])
    draw.ellipse([x+8, y+4, x+12, y+8], fill=PALETTE['red'])
    # Bottom triangle
    draw.polygon([(x+3, y+6), (x+12, y+6), (cx, y+13)], fill=PALETTE['red'])
    # Shine
    draw.point((x+5, y+6), fill=PALETTE['white'])

def draw_heart_empty_16(img, col, row, size):
    """Empty heart icon (outline)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    cy = y + size // 2
    
    # Outline only
    draw.ellipse([x+3, y+4, x+7, y+8], outline=PALETTE['red_dark'])
    draw.ellipse([x+8, y+4, x+12, y+8], outline=PALETTE['red_dark'])
    draw.line([x+3, y+6, cx, y+13], fill=PALETTE['red_dark'])
    draw.line([x+12, y+6, cx, y+13], fill=PALETTE['red_dark'])

def draw_key_icon_16(img, col, row, size):
    """Key icon"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Key head
    draw.ellipse([x+3, y+4, x+7, y+8], fill=PALETTE['gold'])
    draw.ellipse([x+4, y+5, x+6, y+7], fill=PALETTE['black'])
    # Key shaft
    draw.rectangle([x+7, y+6, x+11, y+7], fill=PALETTE['gold'])
    # Key teeth
    draw.point((x+11, y+5), fill=PALETTE['gold'])
    draw.point((x+11, y+8), fill=PALETTE['gold'])
    draw.point((x+9, y+8), fill=PALETTE['gold'])

def draw_move_counter_16(img, col, row, size):
    """Move counter icon (footprint)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Footprint
    draw.ellipse([x+5, y+5, x+8, y+8], fill=PALETTE['gray'])
    draw.point((x+5, y+9), fill=PALETTE['gray'])
    draw.point((x+6, y+10), fill=PALETTE['gray'])
    draw.point((x+7, y+10), fill=PALETTE['gray'])
    draw.point((x+8, y+9), fill=PALETTE['gray'])
    draw.point((x+9, y+9), fill=PALETTE['gray'])

def draw_shift_icon_16(img, col, row, size):
    """Shift/swap icon (arrows)"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Two arrows pointing at each other
    # Left arrow
    draw.line([x+3, y+6, x+6, y+6], fill=PALETTE['blue'])
    draw.point((x+3, y+5), fill=PALETTE['blue'])
    draw.point((x+3, y+7), fill=PALETTE['blue'])
    
    # Right arrow
    draw.line([x+9, y+10, x+12, y+10], fill=PALETTE['blue'])
    draw.point((x+12, y+9), fill=PALETTE['blue'])
    draw.point((x+12, y+11), fill=PALETTE['blue'])
    
    # Curved connection
    draw.point((x+7, y+7), fill=PALETTE['blue_light'])
    draw.point((x+8, y+9), fill=PALETTE['blue_light'])

# 32x32 icon drawing functions (scaled up versions)
def draw_heart_full_32(img, col, row, size):
    """Full heart icon 32x32"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    cy = y + size // 2
    
    # Larger heart
    draw.ellipse([x+6, y+8, x+14, y+16], fill=PALETTE['red_dark'])
    draw.ellipse([x+17, y+8, x+25, y+16], fill=PALETTE['red_dark'])
    draw.polygon([(x+6, y+12), (x+25, y+12), (cx, y+26)], fill=PALETTE['red_dark'])
    
    # Inner lighter heart
    draw.ellipse([x+7, y+9, x+13, y+15], fill=PALETTE['red'])
    draw.ellipse([x+18, y+9, x+24, y+15], fill=PALETTE['red'])
    draw.polygon([(x+7, y+12), (x+24, y+12), (cx, y+25)], fill=PALETTE['red'])
    
    # Shine
    draw.ellipse([x+9, y+11, x+11, y+13], fill=PALETTE['white'])

def draw_heart_empty_32(img, col, row, size):
    """Empty heart icon 32x32"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    cx = x + size // 2
    
    # Outline
    draw.ellipse([x+6, y+8, x+14, y+16], outline=PALETTE['red_dark'], width=2)
    draw.ellipse([x+17, y+8, x+25, y+16], outline=PALETTE['red_dark'], width=2)
    draw.line([x+6, y+12, cx, y+26], fill=PALETTE['red_dark'], width=2)
    draw.line([x+25, y+12, cx, y+26], fill=PALETTE['red_dark'], width=2)

def draw_key_icon_32(img, col, row, size):
    """Key icon 32x32"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Key head
    draw.ellipse([x+6, y+8, x+14, y+16], fill=PALETTE['gold'])
    draw.ellipse([x+8, y+10, x+12, y+14], fill=PALETTE['gold_dark'])
    draw.ellipse([x+9, y+11, x+11, y+13], fill=PALETTE['black'])
    
    # Key shaft
    draw.rectangle([x+14, y+11, x+23, y+13], fill=PALETTE['gold'])
    
    # Key teeth
    draw.rectangle([x+23, y+9, x+25, y+11], fill=PALETTE['gold'])
    draw.rectangle([x+23, y+13, x+25, y+15], fill=PALETTE['gold'])
    draw.rectangle([x+19, y+13, x+21, y+15], fill=PALETTE['gold'])
    
    # Shine
    draw.point((x+9, y+10), fill=PALETTE['white'])

def draw_move_counter_32(img, col, row, size):
    """Move counter icon 32x32"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Larger footprint
    draw.ellipse([x+10, y+10, x+16, y+16], fill=PALETTE['dark_gray'])
    draw.ellipse([x+11, y+11, x+15, y+15], fill=PALETTE['gray'])
    
    # Toes
    for i in range(5):
        tx = x + 9 + i * 2
        ty = y + 18 + (i % 2)
        draw.ellipse([tx, ty, tx+2, ty+2], fill=PALETTE['gray'])

def draw_shift_icon_32(img, col, row, size):
    """Shift/swap icon 32x32"""
    x = col * size
    y = row * size
    draw = ImageDraw.Draw(img)
    
    # Curved arrows
    # Top-left to bottom-right arrow
    draw.line([x+6, y+10, x+12, y+10], fill=PALETTE['blue'], width=2)
    draw.polygon([(x+6, y+8), (x+6, y+12), (x+4, y+10)], fill=PALETTE['blue'])
    
    # Bottom-right to top-left arrow
    draw.line([x+19, y+22, x+25, y+22], fill=PALETTE['blue'], width=2)
    draw.polygon([(x+25, y+20), (x+25, y+24), (x+27, y+22)], fill=PALETTE['blue'])
    
    # Curved connection lines
    draw.arc([x+10, y+8, x+22, y+20], 180, 270, fill=PALETTE['blue_light'], width=2)
    draw.arc([x+9, y+12, x+21, y+24], 0, 90, fill=PALETTE['blue_light'], width=2)

if __name__ == '__main__':
    os.makedirs('ui', exist_ok=True)
    
    print("Generating UI icons...")
    
    icons_16 = create_ui_icons_16()
    icons_16.save('ui/ui_icons_16x16.png')
    print("✓ 16x16 UI icons saved to ui/ui_icons_16x16.png")
    
    icons_32 = create_ui_icons_32()
    icons_32.save('ui/ui_icons_32x32.png')
    print("✓ 32x32 UI icons saved to ui/ui_icons_32x32.png")
    
    print("\n  Icon order (left to right):")
    print("  0: Heart (full)")
    print("  1: Heart (empty)")
    print("  2: Key")
    print("  3: Move counter")
    print("  4: Shift/swap arrows")
