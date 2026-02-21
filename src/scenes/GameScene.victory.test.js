import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Phaser before any imports that use it
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      constructor() {}
    },
    Scale: {
      FIT: 1,
      CENTER_BOTH: 1
    },
    AUTO: 'AUTO'
  }
}));

import GameScene from './GameScene.js';
import { Grid, TileType } from '../core/Grid.js';

describe('GameScene - Exit Portal & Victory', () => {
  let scene;
  let mockGame;

  beforeEach(() => {
    // Create mock Phaser game
    mockGame = {
      config: {},
      renderer: { width: 800, height: 600 }
    };

    // Create scene instance
    scene = new GameScene();
    
    // Mock Phaser scene methods
    scene.add = {
      text: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis()
      }),
      sprite: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      graphics: vi.fn().mockReturnValue({
        fillStyle: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        generateTexture: vi.fn(),
        destroy: vi.fn()
      }),
      rectangle: vi.fn().mockReturnValue({
        setOrigin: vi.fn().mockReturnThis(),
        destroy: vi.fn()
      }),
      particles: vi.fn().mockReturnValue({
        stop: vi.fn()
      }),
      container: vi.fn().mockReturnValue({
        add: vi.fn(),
        removeAll: vi.fn()
      })
    };

    scene.tweens = {
      add: vi.fn()
    };

    scene.cameras = {
      main: { 
        width: 800, 
        height: 600,
        shake: vi.fn()
      }
    };

    scene.time = {
      delayedCall: vi.fn()
    };

    scene.input = {
      keyboard: {
        once: vi.fn()
      }
    };

    // Mock level data
    scene.currentLevelData = {
      exitPosition: { x: 6, y: 6 },
      name: 'Test Level',
      gridWidth: 8,
      gridHeight: 8
    };

    scene.gameState = {
      exitUnlocked: false,
      keysRequired: 1
    };

    // Mock player for final victory sequence
    scene.player = {
      hp: 3,
      sprite: {
        x: 100,
        y: 100
      },
      destroy: vi.fn()
    };

    // Mock turn manager for final victory sequence
    scene.turnManager = {
      maxCollapseMeter: 60,
      collapseMeter: 20
    };
  });

  describe('Exit Portal Glow Animation', () => {
    it('should create glow animation when exit is unlocked', () => {
      const exitX = 6;
      const exitY = 6;

      scene.createExitGlow(exitX, exitY);

      // Verify graphics were created for glow effect
      expect(scene.add.graphics).toHaveBeenCalled();
      
      // Verify sprite was created
      expect(scene.add.sprite).toHaveBeenCalled();
      
      // Verify tween animation was added
      expect(scene.tweens.add).toHaveBeenCalled();
      
      // Verify tween has pulsing properties
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig).toHaveProperty('alpha');
      expect(tweenConfig).toHaveProperty('scale');
      expect(tweenConfig.yoyo).toBe(true);
      expect(tweenConfig.repeat).toBe(-1); // Infinite repeat
    });

    it('should remove existing glow before creating new one', () => {
      // Create first glow
      scene.createExitGlow(5, 5);
      const firstGlow = scene.exitGlowSprite;

      // Create second glow
      scene.createExitGlow(6, 6);

      // Verify first glow was destroyed
      expect(firstGlow.destroy).toHaveBeenCalled();
    });

    it('should position glow at correct pixel coordinates', () => {
      const TILE_SIZE = 16;
      const exitX = 6;
      const exitY = 6;
      const expectedPixelX = exitX * TILE_SIZE + TILE_SIZE / 2;
      const expectedPixelY = exitY * TILE_SIZE + TILE_SIZE / 2;

      scene.createExitGlow(exitX, exitY);

      // Verify sprite was created at correct position
      const spriteCall = scene.add.sprite.mock.calls[0];
      expect(spriteCall[0]).toBe(expectedPixelX);
      expect(spriteCall[1]).toBe(expectedPixelY);
    });
  });

  describe('Victory Screen', () => {
    it('should display victory message', () => {
      scene.handleVictory();

      // Verify victory text was created
      const textCalls = scene.add.text.mock.calls;
      const victoryCall = textCalls.find(call => 
        call[2] === 'VICTORY!'
      );
      expect(victoryCall).toBeDefined();
    });

    it('should show next level option when next level exists', () => {
      scene.levelId = 1;
      scene.levelLoader = {
        levelExists: vi.fn().mockReturnValue(true)
      };

      scene.handleVictory();

      // Verify next level text was created
      const textCalls = scene.add.text.mock.calls;
      const nextLevelCall = textCalls.find(call => 
        typeof call[2] === 'string' && call[2].includes('next level')
      );
      expect(nextLevelCall).toBeDefined();

      // Verify space key listener was added
      expect(scene.input.keyboard.once).toHaveBeenCalledWith(
        'keydown-SPACE',
        expect.any(Function)
      );
    });

    it('should show completion message when no next level exists', () => {
      scene.levelId = 10;
      scene.levelLoader = {
        levelExists: vi.fn().mockReturnValue(false)
      };

      scene.handleVictory();

      // Verify completion text was created
      const textCalls = scene.add.text.mock.calls;
      const completeCall = textCalls.find(call => 
        typeof call[2] === 'string' && call[2].includes('complete')
      );
      expect(completeCall).toBeDefined();
    });

    it('should always show menu option', () => {
      scene.levelLoader = {
        levelExists: vi.fn().mockReturnValue(true)
      };

      scene.handleVictory();

      // Verify menu text was created
      const textCalls = scene.add.text.mock.calls;
      const menuCall = textCalls.find(call => 
        typeof call[2] === 'string' && call[2].includes('menu')
      );
      expect(menuCall).toBeDefined();
    });
  });

  describe('Victory Trigger', () => {
    it('should trigger victory when player reaches exit with all keys', () => {
      // Setup
      scene.player = {
        gridX: 6,
        gridY: 6,
        keysCollected: 1,
        hp: 3
      };

      scene.grid = new Grid(8, 8);
      scene.grid.setTile(6, 6, { 
        type: TileType.EXIT_UNLOCKED, 
        x: 6, 
        y: 6 
      });

      scene.gameState = {
        keysRequired: 1,
        exitUnlocked: true
      };

      scene.turnManager = {
        checkWinCondition: vi.fn().mockReturnValue(true),
        checkLossCondition: vi.fn().mockReturnValue(false)
      };

      scene.inputManager = {
        disable: vi.fn()
      };

      scene.levelLoader = {
        levelExists: vi.fn().mockReturnValue(false)
      };

      // Execute
      scene.handleGameOver(true);

      // Verify victory was handled
      expect(scene.inputManager.disable).toHaveBeenCalled();
      
      // Verify victory text was displayed
      const textCalls = scene.add.text.mock.calls;
      const victoryCall = textCalls.find(call => call[2] === 'VICTORY!');
      expect(victoryCall).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should destroy exit glow sprite on shutdown', () => {
      // Create glow
      scene.createExitGlow(6, 6);
      const glowSprite = scene.exitGlowSprite;

      // Shutdown scene
      scene.shutdown();

      // Verify glow was destroyed
      expect(glowSprite.destroy).toHaveBeenCalled();
      expect(scene.exitGlowSprite).toBeNull();
    });
  });
});
