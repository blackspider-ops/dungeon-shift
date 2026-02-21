import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShiftType } from '../core/ShiftSystem.js';

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

/**
 * Tests for GameScene rotation animation
 */
describe('GameScene Rotation Animation', () => {
  let scene;
  let GameScene;

  beforeEach(async () => {
    // Dynamically import GameScene after mocking Phaser
    const module = await import('./GameScene.js');
    GameScene = module.default;

    // Create a minimal GameScene instance
    scene = new GameScene();
    
    // Mock tweens
    scene.tweens = {
      add: vi.fn((config) => {
        // Immediately call onComplete for testing
        if (config.onComplete) {
          config.onComplete();
        }
        return { isPlaying: () => false };
      })
    };
    
    // Mock tile renderer
    scene.tileRenderer = {
      render: vi.fn()
    };
  });

  describe('animateShift', () => {
    it('should call animateRotation for ROOM_ROTATE operations', async () => {
      // Mock game state with rotation pattern
      scene.gameState = {
        shiftSystem: {
          pattern: {
            type: ShiftType.ROOM_ROTATE,
            currentIndex: 1, // Just advanced from index 0
            sequence: [
              { type: ShiftType.ROOM_ROTATE, params: { chunkId: 0 } },
              { type: ShiftType.ROOM_ROTATE, params: { chunkId: 1 } }
            ]
          }
        }
      };
      
      // Mock player
      scene.player = {
        gridX: 2,
        gridY: 2,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      // Spy on animateRotation
      const animateRotationSpy = vi.spyOn(scene, 'animateRotation');
      
      await scene.animateShift();
      
      expect(animateRotationSpy).toHaveBeenCalled();
      expect(scene.tileRenderer.render).toHaveBeenCalled();
    });

    it('should call animateSwap for ROOM_SWAP operations', async () => {
      // Mock game state with swap pattern
      scene.gameState = {
        shiftSystem: {
          pattern: {
            type: ShiftType.ROOM_SWAP,
            currentIndex: 1, // Just advanced from index 0
            sequence: [
              { type: ShiftType.ROOM_SWAP, params: { chunkA: 0, chunkB: 3 } },
              { type: ShiftType.ROOM_SWAP, params: { chunkA: 1, chunkB: 2 } }
            ]
          }
        }
      };
      
      // Mock player
      scene.player = {
        gridX: 2,
        gridY: 2,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      // Spy on animateSwap
      const animateSwapSpy = vi.spyOn(scene, 'animateSwap');
      
      await scene.animateShift();
      
      expect(animateSwapSpy).toHaveBeenCalled();
      expect(scene.tileRenderer.render).toHaveBeenCalled();
    });
  });

  describe('animateRotation', () => {
    it('should animate player with rotation', async () => {
      const operation = { type: ShiftType.ROOM_ROTATE, params: { chunkId: 0 } };
      
      scene.player = {
        gridX: 4,
        gridY: 2,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      scene.gameState = { enemies: [] };
      
      await scene.animateRotation(operation);
      
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig.targets).toBe(scene.player.sprite);
      expect(tweenConfig.angle).toBe(360); // Full rotation
      expect(tweenConfig.duration).toBe(500);
    });

    it('should animate enemies with rotation', async () => {
      const operation = { type: ShiftType.ROOM_ROTATE, params: { chunkId: 0 } };
      
      scene.player = null;
      
      const enemy1 = {
        gridX: 2,
        gridY: 3,
        sprite: {
          x: 32,
          y: 48,
          angle: 0
        }
      };
      
      const enemy2 = {
        gridX: 3,
        gridY: 2,
        sprite: {
          x: 48,
          y: 32,
          angle: 0
        }
      };
      
      scene.gameState = { enemies: [enemy1, enemy2] };
      
      await scene.animateRotation(operation);
      
      // Should create tweens for both enemies
      expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    });

    it('should reset sprite angles after rotation', async () => {
      const operation = { type: ShiftType.ROOM_ROTATE, params: { chunkId: 0 } };
      
      scene.player = {
        gridX: 4,
        gridY: 2,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      scene.gameState = { enemies: [] };
      
      await scene.animateRotation(operation);
      
      // Angle should be reset to 0 after animation
      expect(scene.player.sprite.angle).toBe(0);
    });
  });

  describe('animateSwap', () => {
    it('should animate player without rotation', async () => {
      scene.player = {
        gridX: 8,
        gridY: 8,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      scene.gameState = { enemies: [] };
      
      await scene.animateSwap();
      
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig.targets).toBe(scene.player.sprite);
      expect(tweenConfig.angle).toBeUndefined(); // No rotation for swap
      expect(tweenConfig.duration).toBe(400);
    });

    it('should animate enemies without rotation', async () => {
      scene.player = null;
      
      const enemy = {
        gridX: 8,
        gridY: 8,
        sprite: {
          x: 32,
          y: 32,
          angle: 0
        }
      };
      
      scene.gameState = { enemies: [enemy] };
      
      await scene.animateSwap();
      
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig.angle).toBeUndefined(); // No rotation for swap
    });
  });
});
