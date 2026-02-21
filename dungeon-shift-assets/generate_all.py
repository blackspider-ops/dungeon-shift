#!/usr/bin/env python3
"""
Master script to generate all Dungeon Shift assets
Run this to create all game art assets at once
"""

import subprocess
import sys
import os

def run_script(script_name):
    """Run a generation script"""
    print(f"\n{'='*60}")
    print(f"Running {script_name}...")
    print('='*60)
    
    result = subprocess.run([sys.executable, script_name], 
                          capture_output=False, 
                          text=True)
    
    if result.returncode != 0:
        print(f"✗ Error running {script_name}")
        return False
    return True

def main():
    print("Dungeon Shift Asset Generator")
    print("="*60)
    print("Generating all pixel art assets...")
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    scripts = [
        'generate_assets.py',
        'generate_player.py',
        'generate_enemies.py',
        'generate_ui.py'
    ]
    
    success = True
    for script in scripts:
        if not run_script(script):
            success = False
            break
    
    print("\n" + "="*60)
    if success:
        print("✓ All assets generated successfully!")
        print("\nGenerated files:")
        print("  - tileset/environment_tileset.png")
        print("  - player/player_spritesheet.png")
        print("  - enemies/patroller_spritesheet.png")
        print("  - ui/ui_icons_16x16.png")
        print("  - ui/ui_icons_32x32.png")
    else:
        print("✗ Asset generation failed")
        return 1
    
    print("="*60)
    return 0

if __name__ == '__main__':
    sys.exit(main())
