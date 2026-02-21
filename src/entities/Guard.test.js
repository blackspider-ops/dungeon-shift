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

describe('Guard Enemy', () => {
  let mockScene;
  let grid;
  let mockPlayer;
  let Guard;

  beforeEach(async () => {
    // Dynamically import Guard after mocking Phaser
    const module = await import('./Guard.js');
    Guard = module.default;

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
    it('should create a guard at the specified position', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.gridX).toBe(5);
      expect(guard.gridY).toBe(5);
      expect(guard.type).toBe('GUARD');
      expect(mockScene.add.sprite).toHaveBeenCalled();
    });

    it('should initialize with attack timer at 0', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.attackTimer).toBe(0);
      expect(guard.isAttacking).toBe(false);
    });
  });

  describe('Stationary Behavior', () => {
    it('should not move when updated', () => {
      const guard = new Guard(mockScene, 5, 5);
      
      const result = guard.update(grid, mockPlayer, 1);

      expect(result).toBeNull();
      expect(guard.gridX).toBe(5);
      expect(guard.gridY).toBe(5);
    });

    it('should remain stationary across multiple turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      for (let turn = 1; turn <= 10; turn++) {
        const result = guard.update(grid, mockPlayer, turn);
        expect(result).toBeNull();
        expect(guard.gridX).toBe(5);
        expect(guard.gridY).toBe(5);
      }
    });
  });

  describe('Attack Timing', () => {
    it('should attack on even turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.shouldAttack(2)).toBe(true);
      expect(guard.shouldAttack(4)).toBe(true);
      expect(guard.shouldAttack(6)).toBe(true);
      expect(guard.shouldAttack(100)).toBe(true);
    });

    it('should not attack on odd turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.shouldAttack(1)).toBe(false);
      expect(guard.shouldAttack(3)).toBe(false);
      expect(guard.shouldAttack(5)).toBe(false);
      expect(guard.shouldAttack(99)).toBe(false);
    });

    it('should telegraph on odd turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.shouldTelegraph(1)).toBe(true);
      expect(guard.shouldTelegraph(3)).toBe(true);
      expect(guard.shouldTelegraph(5)).toBe(true);
      expect(guard.shouldTelegraph(99)).toBe(true);
    });

    it('should not telegraph on even turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      expect(guard.shouldTelegraph(2)).toBe(false);
      expect(guard.shouldTelegraph(4)).toBe(false);
      expect(guard.shouldTelegraph(6)).toBe(false);
      expect(guard.shouldTelegraph(100)).toBe(false);
    });
  });

  describe('Adjacent Detection', () => {
    it('should detect player directly above', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 4;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(true);
    });

    it('should detect player directly below', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 6;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(true);
    });

    it('should detect player directly left', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 4;
      mockPlayer.gridY = 5;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(true);
    });

    it('should detect player directly right', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 5;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(true);
    });

    it('should not detect player diagonally', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 6;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(false);
    });

    it('should not detect player at distance', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 8;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(false);
    });

    it('should not detect player at same position', () => {
      const guard = new Guard(mockScene, 5, 5);
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 5;

      expect(guard.isPlayerAdjacent(mockPlayer)).toBe(false);
    });
  });

  describe('Adjacent Positions', () => {
    it('should return all four adjacent positions', () => {
      const guard = new Guard(mockScene, 5, 5);
      const adjacent = guard.getAdjacentPositions();

      expect(adjacent).toHaveLength(4);
      expect(adjacent).toContainEqual({ x: 5, y: 4 }); // Up
      expect(adjacent).toContainEqual({ x: 5, y: 6 }); // Down
      expect(adjacent).toContainEqual({ x: 4, y: 5 }); // Left
      expect(adjacent).toContainEqual({ x: 6, y: 5 }); // Right
    });
  });

  describe('Attack State', () => {
    it('should set isAttacking to true on even turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      guard.update(grid, mockPlayer, 2);
      expect(guard.isAttacking).toBe(true);

      guard.update(grid, mockPlayer, 4);
      expect(guard.isAttacking).toBe(true);
    });

    it('should set isAttacking to false on odd turns', () => {
      const guard = new Guard(mockScene, 5, 5);

      guard.update(grid, mockPlayer, 1);
      expect(guard.isAttacking).toBe(false);

      guard.update(grid, mockPlayer, 3);
      expect(guard.isAttacking).toBe(false);
    });

    it('should alternate attack state correctly', () => {
      const guard = new Guard(mockScene, 5, 5);

      guard.update(grid, mockPlayer, 1);
      expect(guard.isAttacking).toBe(false);

      guard.update(grid, mockPlayer, 2);
      expect(guard.isAttacking).toBe(true);

      guard.update(grid, mockPlayer, 3);
      expect(guard.isAttacking).toBe(false);

      guard.update(grid, mockPlayer, 4);
      expect(guard.isAttacking).toBe(true);
    });
  });

  describe('Position Queries', () => {
    it('should return current grid position', () => {
      const guard = new Guard(mockScene, 5, 5);
      const pos = guard.getGridPosition();

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

      const guard = new Guard(mockScene, 5, 5);
      const pos = guard.getPixelPosition();

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

      const guard = new Guard(mockScene, 5, 5);
      guard.destroy();

      expect(mockSprite.destroy).toHaveBeenCalled();
      expect(guard.sprite).toBeNull();
    });
  });
});
