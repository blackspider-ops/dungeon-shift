import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Grid, TileType } from '../core/Grid.js';

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

describe('Patroller Enemy', () => {
  let mockScene;
  let grid;
  let Patroller;

  beforeEach(async () => {
    // Dynamically import Patroller after mocking Phaser
    const module = await import('./Patroller.js');
    Patroller = module.default;

    // Create mock Phaser scene
    mockScene = {
      add: {
        sprite: vi.fn(() => ({
          setOrigin: vi.fn(),
          play: vi.fn(),
          setPosition: vi.fn(),
          destroy: vi.fn(),
          active: true
        }))
      },
      time: {
        delayedCall: vi.fn((delay, callback) => callback())
      }
    };

    // Create test grid
    grid = new Grid(12, 12);
    // Fill with floors
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }
  });

  describe('Creation', () => {
    it('should create a patroller at the specified position', () => {
      const patroller = new Patroller(mockScene, 5, 5, []);

      expect(patroller.gridX).toBe(5);
      expect(patroller.gridY).toBe(5);
      expect(patroller.type).toBe('PATROLLER');
      expect(mockScene.add.sprite).toHaveBeenCalled();
    });

    it('should initialize with a patrol path', () => {
      const patrolPath = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ];
      const patroller = new Patroller(mockScene, 5, 5, patrolPath);

      expect(patroller.patrolPath).toEqual(patrolPath);
      expect(patroller.patrolIndex).toBe(0);
      expect(patroller.patrolDirection).toBe(1);
    });

    it('should default to single-point path if no path provided', () => {
      const patroller = new Patroller(mockScene, 5, 5, []);

      expect(patroller.patrolPath).toEqual([{ x: 5, y: 5 }]);
    });
  });

  describe('Movement', () => {
    it('should move to a new position', () => {
      const patroller = new Patroller(mockScene, 5, 5, []);
      patroller.moveTo(6, 5);

      expect(patroller.gridX).toBe(6);
      expect(patroller.gridY).toBe(5);
    });

    it('should update facing direction when moving', () => {
      const patroller = new Patroller(mockScene, 5, 5, []);

      patroller.moveTo(6, 5); // Move right
      expect(patroller.facing).toBe('right');

      patroller.moveTo(6, 6); // Move down
      expect(patroller.facing).toBe('down');

      patroller.moveTo(5, 6); // Move left
      expect(patroller.facing).toBe('left');

      patroller.moveTo(5, 5); // Move up
      expect(patroller.facing).toBe('up');
    });
  });

  describe('Patrol AI', () => {
    it('should not move if patrol path has only one point', () => {
      const patroller = new Patroller(mockScene, 5, 5, [{ x: 5, y: 5 }]);
      const result = patroller.update(grid);

      expect(result).toBeNull();
      expect(patroller.gridX).toBe(5);
      expect(patroller.gridY).toBe(5);
    });

    it('should move forward along patrol path', () => {
      const patrolPath = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ];
      const patroller = new Patroller(mockScene, 5, 5, patrolPath);

      // First update: move to index 1
      patroller.update(grid);
      expect(patroller.gridX).toBe(6);
      expect(patroller.gridY).toBe(5);
      expect(patroller.patrolIndex).toBe(1);

      // Second update: move to index 2
      patroller.update(grid);
      expect(patroller.gridX).toBe(7);
      expect(patroller.gridY).toBe(5);
      expect(patroller.patrolIndex).toBe(2);
    });

    it('should reverse direction at end of patrol path', () => {
      const patrolPath = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ];
      const patroller = new Patroller(mockScene, 5, 5, patrolPath);

      // Move to end of path
      patroller.update(grid); // index 1
      patroller.update(grid); // index 2
      patroller.update(grid); // reverse, index 1

      expect(patroller.patrolDirection).toBe(-1);
      expect(patroller.patrolIndex).toBe(1);
      expect(patroller.gridX).toBe(6);
      expect(patroller.gridY).toBe(5);
    });

    it('should reverse direction at start of patrol path', () => {
      const patrolPath = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ];
      const patroller = new Patroller(mockScene, 5, 5, patrolPath);

      // Move to end and back to start
      patroller.update(grid); // index 1
      patroller.update(grid); // index 2
      patroller.update(grid); // reverse, index 1
      patroller.update(grid); // index 0
      patroller.update(grid); // reverse, index 1

      expect(patroller.patrolDirection).toBe(1);
      expect(patroller.patrolIndex).toBe(1);
      expect(patroller.gridX).toBe(6);
      expect(patroller.gridY).toBe(5);
    });

    it('should reverse direction if path is blocked', () => {
      const patrolPath = [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 7, y: 5 }
      ];
      const patroller = new Patroller(mockScene, 5, 5, patrolPath);

      // Block the next position
      grid.setTile(6, 5, { type: TileType.WALL, x: 6, y: 5 });

      const result = patroller.update(grid);

      expect(result).toBeNull();
      expect(patroller.patrolDirection).toBe(-1);
      expect(patroller.gridX).toBe(5);
      expect(patroller.gridY).toBe(5);
    });
  });

  describe('Position Queries', () => {
    it('should return current grid position', () => {
      const patroller = new Patroller(mockScene, 5, 5, []);
      const pos = patroller.getGridPosition();

      expect(pos).toEqual({ x: 5, y: 5 });
    });

    it('should return current pixel position', () => {
      const mockSprite = {
        x: 100,
        y: 100,
        setOrigin: vi.fn(),
        play: vi.fn(),
        setPosition: vi.fn(),
        destroy: vi.fn(),
        active: true
      };
      mockScene.add.sprite = vi.fn(() => mockSprite);

      const patroller = new Patroller(mockScene, 5, 5, []);
      const pos = patroller.getPixelPosition();

      expect(pos).toEqual({ x: 100, y: 100 });
    });
  });

  describe('Cleanup', () => {
    it('should destroy sprite when destroyed', () => {
      const mockSprite = {
        setOrigin: vi.fn(),
        play: vi.fn(),
        setPosition: vi.fn(),
        destroy: vi.fn(),
        active: true
      };
      mockScene.add.sprite = vi.fn(() => mockSprite);

      const patroller = new Patroller(mockScene, 5, 5, []);
      patroller.destroy();

      expect(mockSprite.destroy).toHaveBeenCalled();
      expect(patroller.sprite).toBeNull();
    });
  });
});
