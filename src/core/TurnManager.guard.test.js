import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

// Mock Phaser
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

describe('TurnManager - Guard Enemy Integration', () => {
  let turnManager;
  let grid;
  let mockPlayer;
  let mockGuard;
  let mockScene;
  let Guard;

  beforeEach(async () => {
    // Import Guard after mocking Phaser
    const guardModule = await import('../entities/Guard.js');
    Guard = guardModule.default;

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
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }

    // Create mock player
    mockPlayer = {
      gridX: 6,
      gridY: 6,
      hp: 3,
      maxHp: 3,
      keysCollected: 0,
      activeShield: false,
      getGridPosition: () => ({ x: mockPlayer.gridX, y: mockPlayer.gridY }),
      takeDamage: vi.fn((amount) => {
        mockPlayer.hp = Math.max(0, mockPlayer.hp - amount);
        return mockPlayer.hp > 0;
      }),
      isAlive: () => mockPlayer.hp > 0
    };

    // Create guard enemy
    mockGuard = new Guard(mockScene, 5, 5);

    // Create turn manager
    turnManager = new TurnManager(20);
  });

  describe('Guard Update Integration', () => {
    it('should update guard with grid, player, and turn number', () => {
      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      const updateSpy = vi.spyOn(mockGuard, 'update');

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(updateSpy).toHaveBeenCalledWith(grid, mockPlayer, turnManager.turnNumber);
    });

    it('should not move guard position', () => {
      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      const initialX = mockGuard.gridX;
      const initialY = mockGuard.gridY;

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockGuard.gridX).toBe(initialX);
      expect(mockGuard.gridY).toBe(initialY);
    });
  });

  describe('Guard Attack Damage', () => {
    it('should deal damage when player is adjacent on even turn', () => {
      // Position player adjacent to guard
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 6; // Below guard at (5, 5)

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      // Set turn to even number (attack turn)
      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2); // Manually trigger attack state

      const results = turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
      expect(results.some(r => r.type === 'enemy' && r.description === 'GUARD enemy attacked!')).toBe(true);
    });

    it('should not deal damage when player is adjacent on odd turn', () => {
      // Position player adjacent to guard
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 6;

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      // Set turn to odd number (telegraph turn)
      turnManager.turnNumber = 1;
      mockGuard.update(grid, mockPlayer, 1);

      const results = turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).not.toHaveBeenCalled();
      expect(results.some(r => r.type === 'enemy' && r.description === 'GUARD enemy attacked!')).toBe(false);
    });

    it('should not deal damage when player is not adjacent on even turn', () => {
      // Position player away from guard
      mockPlayer.gridX = 8;
      mockPlayer.gridY = 8;

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      // Set turn to even number (attack turn)
      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);

      const results = turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).not.toHaveBeenCalled();
      expect(results.some(r => r.type === 'enemy' && r.description === 'GUARD enemy attacked!')).toBe(false);
    });

    it('should deal damage to player above guard', () => {
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 4; // Above guard

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
    });

    it('should deal damage to player to the left of guard', () => {
      mockPlayer.gridX = 4;
      mockPlayer.gridY = 5; // Left of guard

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
    });

    it('should deal damage to player to the right of guard', () => {
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 5; // Right of guard

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).toHaveBeenCalledWith(1);
    });

    it('should not deal damage to player diagonally adjacent', () => {
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 6; // Diagonal from guard

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);

      turnManager.resolveHazards(mockPlayer, grid, gameState);

      expect(mockPlayer.takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('Guard Attack Timing', () => {
    it('should attack on turn 2, 4, 6, etc.', () => {
      mockPlayer.gridX = 5;
      mockPlayer.gridY = 6;

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      // Turn 2 - should attack
      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);
      turnManager.resolveHazards(mockPlayer, grid, gameState);
      expect(mockPlayer.takeDamage).toHaveBeenCalledTimes(1);

      // Turn 3 - should not attack
      mockPlayer.takeDamage.mockClear();
      turnManager.turnNumber = 3;
      mockGuard.update(grid, mockPlayer, 3);
      turnManager.resolveHazards(mockPlayer, grid, gameState);
      expect(mockPlayer.takeDamage).not.toHaveBeenCalled();

      // Turn 4 - should attack
      turnManager.turnNumber = 4;
      mockGuard.update(grid, mockPlayer, 4);
      turnManager.resolveHazards(mockPlayer, grid, gameState);
      expect(mockPlayer.takeDamage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Guards', () => {
    it('should handle multiple guards attacking', () => {
      const guard2 = new Guard(mockScene, 7, 6);
      
      // Position player adjacent to guard2 only (not guard at 5,5)
      mockPlayer.gridX = 6;
      mockPlayer.gridY = 6;

      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard, guard2],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);
      guard2.update(grid, mockPlayer, 2);

      const results = turnManager.resolveHazards(mockPlayer, grid, gameState);

      // Only guard2 should attack (player is only adjacent to guard2)
      expect(mockPlayer.takeDamage).toHaveBeenCalledTimes(1);
      expect(results.filter(r => r.type === 'enemy' && r.description === 'GUARD enemy attacked!')).toHaveLength(1);
    });
  });

  describe('Guard State Management', () => {
    it('should set isAttacking flag correctly', () => {
      const gameState = {
        grid,
        player: mockPlayer,
        enemies: [mockGuard],
        items: [],
        keysRequired: 1,
        exitUnlocked: false
      };

      // Odd turn - telegraph
      turnManager.turnNumber = 1;
      mockGuard.update(grid, mockPlayer, 1);
      expect(mockGuard.isAttacking).toBe(false);

      // Even turn - attack
      turnManager.turnNumber = 2;
      mockGuard.update(grid, mockPlayer, 2);
      expect(mockGuard.isAttacking).toBe(true);

      // Odd turn - telegraph again
      turnManager.turnNumber = 3;
      mockGuard.update(grid, mockPlayer, 3);
      expect(mockGuard.isAttacking).toBe(false);
    });
  });
});
