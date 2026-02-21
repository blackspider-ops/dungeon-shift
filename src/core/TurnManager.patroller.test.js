import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

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

describe('TurnManager - Patroller Enemy Integration', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;
  let Patroller;

  beforeEach(async () => {
    // Dynamically import Patroller after mocking Phaser
    const module = await import('../entities/Patroller.js');
    Patroller = module.default;

    // Create grid
    grid = new Grid(12, 12);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }

    // Create mock scene
    const mockScene = {
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

    // Create mock player
    player = {
      gridX: 2,
      gridY: 2,
      hp: 3,
      maxHp: 3,
      keysCollected: 0,
      takeDamage: vi.fn((amount) => {
        player.hp -= amount;
        return player.hp > 0;
      }),
      getGridPosition: () => ({ x: player.gridX, y: player.gridY }),
      moveTo: (x, y) => {
        player.gridX = x;
        player.gridY = y;
      }
    };

    // Create patroller enemy
    const patroller = new Patroller(mockScene, 5, 5, [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 7, y: 5 }
    ]);

    // Create game state
    gameState = {
      keysRequired: 0,
      exitUnlocked: false,
      enemies: [patroller],
      items: []
    };

    // Create turn manager
    turnManager = new TurnManager(20);
  });

  describe('Enemy Movement', () => {
    it('should move patroller along patrol path each turn', async () => {
      const direction = { dx: 1, dy: 0 }; // Move player right

      // Initial patroller position
      expect(gameState.enemies[0].gridX).toBe(5);
      expect(gameState.enemies[0].gridY).toBe(5);

      // Process turn - patroller should move
      await turnManager.processTurn(player, direction, grid, gameState);

      // Patroller should have moved to next position in path
      expect(gameState.enemies[0].gridX).toBe(6);
      expect(gameState.enemies[0].gridY).toBe(5);

      // Process another turn
      await turnManager.processTurn(player, direction, grid, gameState);

      // Patroller should have moved to next position
      expect(gameState.enemies[0].gridX).toBe(7);
      expect(gameState.enemies[0].gridY).toBe(5);
    });

    it('should reverse patroller direction at end of path', async () => {
      const direction = { dx: 1, dy: 0 };

      // Move patroller to end of path
      await turnManager.processTurn(player, direction, grid, gameState);
      await turnManager.processTurn(player, direction, grid, gameState);
      await turnManager.processTurn(player, direction, grid, gameState);

      // Patroller should have reversed and moved back
      expect(gameState.enemies[0].gridX).toBe(6);
      expect(gameState.enemies[0].gridY).toBe(5);
      expect(gameState.enemies[0].patrolDirection).toBe(-1);
    });
  });

  describe('Enemy Contact Damage', () => {
    it('should deal damage when patroller moves onto player position', async () => {
      // Reset patroller to start of path
      gameState.enemies[0].gridX = 5;
      gameState.enemies[0].gridY = 5;
      gameState.enemies[0].patrolIndex = 0;
      gameState.enemies[0].patrolDirection = 1;

      // Position player at (6, 6)
      player.gridX = 6;
      player.gridY = 6;
      player.hp = 3;

      // Player moves to (6, 5), patroller also moves to (6, 5)
      const result = await turnManager.processTurn(player, { dx: 0, dy: -1 }, grid, gameState);

      // Player should have taken damage
      expect(player.takeDamage).toHaveBeenCalled();
      expect(player.hp).toBe(2);

      // Result should include enemy hazard
      expect(result.hazardResults.length).toBeGreaterThan(0);
      const enemyHazard = result.hazardResults.find(h => h.type === 'enemy');
      expect(enemyHazard).toBeDefined();
      expect(enemyHazard.damage).toBe(1);
    });

    it('should trigger loss condition when patroller reduces HP to 0', async () => {
      // Set player HP to 1
      player.hp = 1;

      // Reset patroller
      gameState.enemies[0].gridX = 5;
      gameState.enemies[0].gridY = 5;
      gameState.enemies[0].patrolIndex = 0;
      gameState.enemies[0].patrolDirection = 1;

      // Position player at (6, 6)
      player.gridX = 6;
      player.gridY = 6;

      // Player moves to (6, 5), patroller also moves to (6, 5)
      const result = await turnManager.processTurn(player, { dx: 0, dy: -1 }, grid, gameState);

      // Player should be dead
      expect(player.hp).toBe(0);
      expect(result.gameOver).toBe(true);
      expect(result.victory).toBe(false);
    });
  });

  describe('Multiple Enemies', () => {
    it('should update all patrollers each turn', async () => {
      const mockScene = {
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

      // Add second patroller
      const patroller2 = new Patroller(mockScene, 8, 8, [
        { x: 8, y: 8 },
        { x: 9, y: 8 }
      ]);
      gameState.enemies.push(patroller2);

      const direction = { dx: 1, dy: 0 };

      // Process turn
      await turnManager.processTurn(player, direction, grid, gameState);

      // Both patrollers should have moved
      expect(gameState.enemies[0].gridX).toBe(6);
      expect(gameState.enemies[1].gridX).toBe(9);
    });
  });
});
