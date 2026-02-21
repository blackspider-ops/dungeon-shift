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

describe('Chaser Enemy', () => {
  let mockScene;
  let grid;
  let mockPlayer;
  let Chaser;

  beforeEach(async () => {
    // Dynamically import Chaser after mocking Phaser
    const module = await import('./Chaser.js');
    Chaser = module.default;

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

    // Create mock player
    mockPlayer = {
      gridX: 6,
      gridY: 6,
      getGridPosition: () => ({ x: mockPlayer.gridX, y: mockPlayer.gridY })
    };
  });

  describe('Creation', () => {
    it('should create a chaser at the specified position', () => {
      const chaser = new Chaser(mockScene, 5, 5);

      expect(chaser.gridX).toBe(5);
      expect(chaser.gridY).toBe(5);
      expect(chaser.type).toBe('CHASER');
      expect(mockScene.add.sprite).toHaveBeenCalled();
    });

    it('should initialize with move timer at 0', () => {
      const chaser = new Chaser(mockScene, 5, 5);

      expect(chaser.moveTimer).toBe(0);
      expect(chaser.moveInterval).toBe(2);
    });
  });

  describe('Movement', () => {
    it('should move to a new position', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      chaser.moveTo(6, 5);

      expect(chaser.gridX).toBe(6);
      expect(chaser.gridY).toBe(5);
    });

    it('should update facing direction when moving', () => {
      const chaser = new Chaser(mockScene, 5, 5);

      chaser.moveTo(6, 5); // Move right
      expect(chaser.facing).toBe('right');

      chaser.moveTo(6, 6); // Move down
      expect(chaser.facing).toBe('down');

      chaser.moveTo(5, 6); // Move left
      expect(chaser.facing).toBe('left');

      chaser.moveTo(5, 5); // Move up
      expect(chaser.facing).toBe('up');
    });
  });

  describe('Manhattan Distance', () => {
    it('should calculate Manhattan distance correctly', () => {
      const chaser = new Chaser(mockScene, 5, 5);

      expect(chaser.calculateManhattanDistance(5, 5)).toBe(0);
      expect(chaser.calculateManhattanDistance(8, 5)).toBe(3);
      expect(chaser.calculateManhattanDistance(5, 8)).toBe(3);
      expect(chaser.calculateManhattanDistance(8, 8)).toBe(6);
      expect(chaser.calculateManhattanDistance(2, 2)).toBe(6);
    });
  });

  describe('Greedy Pathfinding', () => {
    it('should prioritize horizontal movement over vertical', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 8;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      // Should move right (horizontal) first, not down (vertical)
      expect(nextMove).toEqual({ x: 6, y: 5 });
    });

    it('should move horizontally when only horizontal distance exists', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 5;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toEqual({ x: 6, y: 5 });
    });

    it('should move vertically when only vertical distance exists', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 8;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toEqual({ x: 5, y: 6 });
    });

    it('should move left when player is to the left', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 2;
      mockPlayer.gridY = 5;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toEqual({ x: 4, y: 5 });
    });

    it('should move up when player is above', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 2;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toEqual({ x: 5, y: 4 });
    });

    it('should return null when already at player position', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 5;

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toBeNull();
    });

    it('should try vertical move if horizontal is blocked', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 8;

      // Block horizontal move
      grid.setTile(6, 5, { type: TileType.WALL, x: 6, y: 5 });

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      // Should move down (vertical) since horizontal is blocked
      expect(nextMove).toEqual({ x: 5, y: 6 });
    });

    it('should return null if all moves are blocked', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 8;

      // Block both horizontal and vertical moves
      grid.setTile(6, 5, { type: TileType.WALL, x: 6, y: 5 });
      grid.setTile(5, 6, { type: TileType.WALL, x: 5, y: 6 });

      const nextMove = chaser.getNextMove(mockPlayer, grid);

      expect(nextMove).toBeNull();
    });
  });

  describe('Move Timer', () => {
    it('should not move on first turn (timer = 0)', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 5;

      const result = chaser.update(grid, mockPlayer, 1);

      expect(result).toBeNull();
      expect(chaser.gridX).toBe(5);
      expect(chaser.gridY).toBe(5);
      expect(chaser.moveTimer).toBe(1);
    });

    it('should move on second turn (timer = 1)', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 5;

      // First turn - no move
      chaser.update(grid, mockPlayer, 1);
      expect(chaser.moveTimer).toBe(1);

      // Second turn - should move
      const result = chaser.update(grid, mockPlayer, 2);

      expect(result).toEqual({ x: 6, y: 5 });
      expect(chaser.gridX).toBe(6);
      expect(chaser.gridY).toBe(5);
      expect(chaser.moveTimer).toBe(0); // Timer reset
    });

    it('should move every 2 turns consistently', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 10;
      mockPlayer.gridY = 5;

      // Turn 1: no move
      let result = chaser.update(grid, mockPlayer, 1);
      expect(result).toBeNull();
      expect(chaser.gridX).toBe(5);

      // Turn 2: move
      result = chaser.update(grid, mockPlayer, 2);
      expect(result).not.toBeNull();
      expect(chaser.gridX).toBe(6);

      // Turn 3: no move
      result = chaser.update(grid, mockPlayer, 3);
      expect(result).toBeNull();
      expect(chaser.gridX).toBe(6);

      // Turn 4: move
      result = chaser.update(grid, mockPlayer, 4);
      expect(result).not.toBeNull();
      expect(chaser.gridX).toBe(7);
    });
  });

  describe('Chase Behavior', () => {
    it('should chase player across the grid', () => {
      const chaser = new Chaser(mockScene, 2, 2);
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 6;

      // Move multiple times toward player
      chaser.moveTimer = 1; // Set to 1 so next update will move
      chaser.update(grid, mockPlayer, 1);
      expect(chaser.gridX).toBe(3); // Moved right (horizontal priority)
      expect(chaser.gridY).toBe(2);

      chaser.moveTimer = 1;
      chaser.update(grid, mockPlayer, 2);
      expect(chaser.gridX).toBe(4); // Moved right again
      expect(chaser.gridY).toBe(2);

      chaser.moveTimer = 1;
      chaser.update(grid, mockPlayer, 3);
      expect(chaser.gridX).toBe(5); // Moved right again
      expect(chaser.gridY).toBe(2);

      chaser.moveTimer = 1;
      chaser.update(grid, mockPlayer, 4);
      expect(chaser.gridX).toBe(6); // Reached player's X
      expect(chaser.gridY).toBe(2);

      // Now should move vertically
      chaser.moveTimer = 1;
      chaser.update(grid, mockPlayer, 5);
      expect(chaser.gridX).toBe(6);
      expect(chaser.gridY).toBe(3); // Moved down
    });

    it('should navigate around obstacles', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      mockPlayer.gridX = 7;
      mockPlayer.gridY = 7; // Changed to create vertical distance

      // Create wall blocking direct path
      grid.setTile(6, 5, { type: TileType.WALL, x: 6, y: 5 });

      chaser.moveTimer = 1;
      const result = chaser.update(grid, mockPlayer, 1);

      // Should move vertically since horizontal is blocked
      expect(result).toEqual({ x: 5, y: 6 });
    });
  });

  describe('Position Queries', () => {
    it('should return current grid position', () => {
      const chaser = new Chaser(mockScene, 5, 5);
      const pos = chaser.getGridPosition();

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

      const chaser = new Chaser(mockScene, 5, 5);
      const pos = chaser.getPixelPosition();

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

      const chaser = new Chaser(mockScene, 5, 5);
      chaser.destroy();

      expect(mockSprite.destroy).toHaveBeenCalled();
      expect(chaser.sprite).toBeNull();
    });
  });
});
