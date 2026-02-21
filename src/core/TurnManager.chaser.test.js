import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {},
    Scale: { FIT: 1, CENTER_BOTH: 1 },
    AUTO: 'AUTO'
  }
}));

describe('TurnManager - Chaser Enemy Integration', () => {
  let turnManager;
  let grid;
  let player;
  let chaser;
  let gameState;

  beforeEach(async () => {
    // Import Chaser after mocking Phaser
    const ChaserModule = await import('../entities/Chaser.js');
    const Chaser = ChaserModule.default;

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

    // Initialize turn manager
    turnManager = new TurnManager(20);

    // Create grid
    grid = new Grid(12, 12);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }

    // Create mock player
    player = {
      gridX: 6,
      gridY: 6,
      hp: 3,
      keysCollected: 0,
      moveTo: vi.fn((x, y) => {
        player.gridX = x;
        player.gridY = y;
      }),
      getGridPosition: () => ({ x: player.gridX, y: player.gridY }),
      takeDamage: vi.fn((amount) => {
        player.hp -= amount;
        return player.hp > 0;
      })
    };

    // Create chaser enemy
    chaser = new Chaser(mockScene, 2, 2);

    // Create game state
    gameState = {
      enemies: [chaser],
      keysRequired: 0,
      exitUnlocked: false
    };
  });

  describe('Chaser Movement Timing', () => {
    it('should not move chaser on first turn', async () => {
      const initialX = chaser.gridX;
      const initialY = chaser.gridY;

      await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );

      expect(chaser.gridX).toBe(initialX);
      expect(chaser.gridY).toBe(initialY);
      expect(chaser.moveTimer).toBe(1);
    });

    it('should move chaser on second turn', async () => {
      // First turn - chaser doesn't move
      await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );

      const initialX = chaser.gridX;

      // Second turn - chaser should move
      await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );

      expect(chaser.gridX).toBeGreaterThan(initialX);
      expect(chaser.moveTimer).toBe(0);
    });

    it('should move chaser every 2 turns', async () => {
      const positions = [];

      // Track chaser position over 6 turns
      for (let i = 0; i < 6; i++) {
        positions.push({ x: chaser.gridX, y: chaser.gridY }); // Capture position BEFORE turn
        await turnManager.processTurn(
          player,
          { dx: 1, dy: 0 },
          grid,
          gameState
        );
      }

      // Chaser should move on turns 2, 4, 6 (after turns 1, 3, 5 complete)
      expect(positions[0]).toEqual(positions[1]); // No move after turn 1
      expect(positions[1]).not.toEqual(positions[2]); // Move after turn 2
      expect(positions[2]).toEqual(positions[3]); // No move after turn 3
      expect(positions[3]).not.toEqual(positions[4]); // Move after turn 4
      expect(positions[4]).toEqual(positions[5]); // No move after turn 5
    });
  });

  describe('Chaser Pathfinding', () => {
    it('should chase player using greedy pathfinding', async () => {
      // Position player far to the right
      player.gridX = 10;
      player.gridY = 2;

      // Move chaser twice (needs 2 turns per move)
      for (let i = 0; i < 4; i++) {
        await turnManager.processTurn(
          player,
          { dx: 0, dy: 0 }, // Player doesn't move
          grid,
          gameState
        );
      }

      // Chaser should have moved closer to player (horizontally first)
      expect(chaser.gridX).toBeGreaterThan(2);
    });

    it('should prioritize horizontal movement over vertical', async () => {
      // Position player diagonally from chaser
      player.gridX = 6;
      player.gridY = 6;
      chaser.gridX = 2;
      chaser.gridY = 2;

      // Move chaser once
      chaser.moveTimer = 1; // Set timer so next turn will move
      await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      // Should move horizontally (right) not vertically (down)
      expect(chaser.gridX).toBe(3);
      expect(chaser.gridY).toBe(2);
    });
  });

  describe('Chaser Damage', () => {
    it('should deal damage when chaser contacts player', async () => {
      // Position chaser next to player
      chaser.gridX = 5;
      chaser.gridY = 6;
      chaser.moveTimer = 1; // Ready to move next turn

      const initialHp = player.hp;

      // Move player away, chaser will move into player's old position
      // Then move player back into chaser
      await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 }, // Player moves right
        grid,
        gameState
      );

      // Chaser should move to (6, 6) where player was
      expect(chaser.gridX).toBe(6);
      expect(chaser.gridY).toBe(6);

      // Move player back into chaser
      await turnManager.processTurn(
        player,
        { dx: -1, dy: 0 }, // Player moves left into chaser
        grid,
        gameState
      );

      // Player should take damage
      expect(player.takeDamage).toHaveBeenCalledWith(1);
      expect(player.hp).toBe(initialHp - 1);
    });

    it('should include chaser damage in hazard results', async () => {
      // Position chaser at player location
      chaser.gridX = 6;
      chaser.gridY = 6;

      const result = await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      const chaserHazard = result.hazardResults.find(h => h.type === 'enemy');
      expect(chaserHazard).toBeDefined();
      expect(chaserHazard.damage).toBe(1);
      expect(chaserHazard.description).toContain('CHASER');
    });
  });

  describe('Multiple Chasers', () => {
    it('should handle multiple chasers independently', async () => {
      // Import Chaser again for second instance
      const ChaserModule = await import('../entities/Chaser.js');
      const Chaser = ChaserModule.default;

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

      const chaser2 = new Chaser(mockScene, 10, 10);
      gameState.enemies.push(chaser2);

      // Both chasers start at timer 0
      expect(chaser.moveTimer).toBe(0);
      expect(chaser2.moveTimer).toBe(0);

      // First turn - neither moves
      await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      expect(chaser.moveTimer).toBe(1);
      expect(chaser2.moveTimer).toBe(1);

      // Second turn - both move
      const chaser1InitialX = chaser.gridX;
      const chaser2InitialX = chaser2.gridX;

      await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      // Both should have moved
      expect(chaser.gridX).not.toBe(chaser1InitialX);
      expect(chaser2.gridX).not.toBe(chaser2InitialX);
    });
  });

  describe('Chaser with Obstacles', () => {
    it('should navigate around walls', async () => {
      // Create wall blocking direct path
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });

      player.gridX = 6;
      player.gridY = 6; // Changed to create vertical distance

      chaser.moveTimer = 1; // Ready to move

      await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      // Chaser should move vertically since horizontal is blocked
      expect(chaser.gridY).not.toBe(2);
    });

    it('should not move if completely blocked', async () => {
      // Surround chaser with walls
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      grid.setTile(1, 2, { type: TileType.WALL, x: 1, y: 2 });
      grid.setTile(2, 3, { type: TileType.WALL, x: 2, y: 3 });
      grid.setTile(2, 1, { type: TileType.WALL, x: 2, y: 1 });

      chaser.moveTimer = 1; // Ready to move

      const initialX = chaser.gridX;
      const initialY = chaser.gridY;

      await turnManager.processTurn(
        player,
        { dx: 0, dy: 0 },
        grid,
        gameState
      );

      // Chaser should not move
      expect(chaser.gridX).toBe(initialX);
      expect(chaser.gridY).toBe(initialY);
    });
  });
});
