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

describe('GameScene - Row/Column Slide Animation', () => {
  let scene;
  let GameScene;
  let mockTweens;
  let mockTileRenderer;

  beforeEach(async () => {
    // Dynamically import GameScene after mocking Phaser
    const module = await import('./GameScene.js');
    GameScene = module.default;

    // Create a minimal GameScene instance
    scene = new GameScene();
    
    // Mock tweens
    mockTweens = {
      add: vi.fn((config) => {
        // Immediately call onComplete for testing
        if (config.onComplete) {
          config.onComplete();
        }
        return { isPlaying: () => false };
      })
    };
    scene.tweens = mockTweens;
    
    // Mock tile renderer
    mockTileRenderer = {
      render: vi.fn()
    };
    scene.tileRenderer = mockTileRenderer;
  });

  describe('animateShift', () => {
    it('should call animateRowColumnSlide for ROW_COLUMN_SLIDE operations', async () => {
      // Mock game state with slide pattern
      scene.gameState = {
        shiftSystem: {
          pattern: {
            type: ShiftType.ROW_COLUMN_SLIDE,
            currentIndex: 1,
            sequence: [
              {
                type: ShiftType.ROW_COLUMN_SLIDE,
                params: { axis: 'row', index: 0, direction: 'right' }
              },
              {
                type: ShiftType.ROW_COLUMN_SLIDE,
                params: { axis: 'column', index: 0, direction: 'down' }
              }
            ]
          }
        }
      };
      
      // Spy on animateRowColumnSlide
      const animateSlideSpy = vi.spyOn(scene, 'animateRowColumnSlide');
      
      await scene.animateShift();
      
      expect(animateSlideSpy).toHaveBeenCalled();
      expect(scene.tileRenderer.render).toHaveBeenCalled();
    });
  });

  describe('animateRowColumnSlide', () => {
    it('should animate player sprite to new position', async () => {
      const mockSprite = {
        x: 0,
        y: 0
      };
      
      scene.player = {
        gridX: 5,
        gridY: 3,
        sprite: mockSprite
      };
      
      scene.gameState = { enemies: [] };
      
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'row', index: 3, direction: 'right' }
      };
      
      await scene.animateRowColumnSlide(operation);
      
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig.targets).toBe(mockSprite);
      expect(tweenConfig.x).toBe(5 * 16); // gridX * TILE_SIZE
      expect(tweenConfig.y).toBe(3 * 16); // gridY * TILE_SIZE
      expect(tweenConfig.duration).toBe(350);
      expect(tweenConfig.ease).toBe('Sine.easeInOut');
    });

    it('should animate enemy sprites to new positions', async () => {
      const mockEnemySprite = {
        x: 0,
        y: 0
      };
      
      const enemy = {
        gridX: 2,
        gridY: 4,
        sprite: mockEnemySprite
      };
      
      scene.player = null;
      scene.gameState = { enemies: [enemy] };
      
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'column', index: 2, direction: 'down' }
      };
      
      await scene.animateRowColumnSlide(operation);
      
      expect(scene.tweens.add).toHaveBeenCalled();
      const tweenConfig = scene.tweens.add.mock.calls[0][0];
      expect(tweenConfig.targets).toBe(mockEnemySprite);
      expect(tweenConfig.x).toBe(2 * 16);
      expect(tweenConfig.y).toBe(4 * 16);
      expect(tweenConfig.duration).toBe(350);
    });

    it('should animate both player and enemies', async () => {
      const mockPlayerSprite = { x: 0, y: 0 };
      const mockEnemySprite = { x: 0, y: 0 };
      
      scene.player = {
        gridX: 1,
        gridY: 1,
        sprite: mockPlayerSprite
      };
      
      scene.gameState = {
        enemies: [{
          gridX: 2,
          gridY: 2,
          sprite: mockEnemySprite
        }]
      };
      
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'row', index: 1, direction: 'left' }
      };
      
      await scene.animateRowColumnSlide(operation);
      
      // Should create 2 tweens (player + enemy)
      expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    });

    it('should handle missing player sprite gracefully', async () => {
      scene.player = null;
      scene.gameState = { enemies: [] };
      
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'row', index: 0, direction: 'right' }
      };
      
      await expect(scene.animateRowColumnSlide(operation)).resolves.toBeUndefined();
    });

    it('should handle enemies without sprites', async () => {
      scene.player = null;
      scene.gameState = {
        enemies: [
          { gridX: 1, gridY: 1, sprite: null },
          { gridX: 2, gridY: 2 } // No sprite property
        ]
      };
      
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'column', index: 1, direction: 'up' }
      };
      
      await expect(scene.animateRowColumnSlide(operation)).resolves.toBeUndefined();
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });
  });
});
