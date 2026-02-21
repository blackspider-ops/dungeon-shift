import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Undo Mechanic', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    // Create a simple 5x5 grid
    grid = new Grid(5, 5);
    
    // Fill with floor tiles
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }

    // Create mock player
    player = {
      gridX: 2,
      gridY: 2,
      hp: 3,
      maxHp: 3,
      keysCollected: 0,
      inventory: [{ type: 'UNDO', quantity: 1 }],
      activeShield: false,
      facing: 'down',
      sprite: null,
      moveTo: function(x, y) {
        this.gridX = x;
        this.gridY = y;
      },
      takeDamage: function(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp > 0;
      },
      getGridPosition: function() {
        return { x: this.gridX, y: this.gridY };
      }
    };

    // Create game state
    gameState = {
      keysRequired: 1,
      exitUnlocked: false,
      enemies: [],
      items: [],
      shiftSystem: null
    };

    // Create turn manager
    turnManager = new TurnManager(10);
  });

  describe('State Saving', () => {
    it('should save game state before processing turn', async () => {
      const initialX = player.gridX;
      const initialY = player.gridY;
      const initialHP = player.hp;
      const initialCollapseMeter = turnManager.collapseMeter;

      // Process a turn (move right)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);

      // Verify state was saved
      expect(turnManager.savedState).toBeDefined();
      expect(turnManager.savedState.player.gridX).toBe(initialX);
      expect(turnManager.savedState.player.gridY).toBe(initialY);
      expect(turnManager.savedState.player.hp).toBe(initialHP);
      expect(turnManager.savedState.collapseMeter).toBe(initialCollapseMeter);
    });

    it('should save grid state including tile types', async () => {
      // Add a spike trap
      grid.setTile(3, 2, { type: TileType.SPIKE_TRAP, x: 3, y: 2, state: { active: false } });

      // Process a turn
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);

      // Verify grid state was saved
      expect(turnManager.savedState.grid.tiles).toBeDefined();
      expect(turnManager.savedState.grid.tiles[2][3].type).toBe(TileType.SPIKE_TRAP);
    });

    it('should save inventory state', async () => {
      player.inventory = [
        { type: 'UNDO', quantity: 1 },
        { type: 'SHIELD', quantity: 1 }
      ];

      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);

      expect(turnManager.savedState.player.inventory).toHaveLength(2);
      expect(turnManager.savedState.player.inventory[0].type).toBe('UNDO');
      expect(turnManager.savedState.player.inventory[1].type).toBe('SHIELD');
    });
  });

  describe('State Restoration', () => {
    it('should restore player position', async () => {
      const initialX = player.gridX;
      const initialY = player.gridY;

      // Move player
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(player.gridX).toBe(initialX + 1);

      // Restore state
      const restored = turnManager.restoreState(player, grid, gameState);
      expect(restored).toBe(true);
      expect(player.gridX).toBe(initialX);
      expect(player.gridY).toBe(initialY);
    });

    it('should restore player HP', async () => {
      // Add spike trap at player's next position
      grid.setTile(3, 2, { type: TileType.SPIKE_TRAP, x: 3, y: 2, state: { active: false } });

      const initialHP = player.hp;

      // Move onto spike trap (takes damage)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(player.hp).toBe(initialHP - 1);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(player.hp).toBe(initialHP);
    });

    it('should restore collapse meter', async () => {
      const initialMeter = turnManager.collapseMeter;

      // Process turn (decrements meter)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(turnManager.collapseMeter).toBe(initialMeter - 1);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(turnManager.collapseMeter).toBe(initialMeter);
    });

    it('should restore turn number', async () => {
      const initialTurn = turnManager.turnNumber;

      // Process turn (increments turn number)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(turnManager.turnNumber).toBe(initialTurn + 1);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(turnManager.turnNumber).toBe(initialTurn);
    });

    it('should restore grid tiles', async () => {
      // Place a key at player's next position
      grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });

      // Move onto key (collects it)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(grid.getTile(3, 2).type).toBe(TileType.FLOOR);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(grid.getTile(3, 2).type).toBe(TileType.KEY);
    });

    it('should restore keys collected', async () => {
      // Place a key
      grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });

      const initialKeys = player.keysCollected;

      // Collect key
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(player.keysCollected).toBe(initialKeys + 1);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(player.keysCollected).toBe(initialKeys);
    });

    it('should return false when no saved state exists', () => {
      turnManager.savedState = null;
      const restored = turnManager.restoreState(player, grid, gameState);
      expect(restored).toBe(false);
    });

    it('should clear saved state after restoration', async () => {
      // Process turn to create saved state
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      expect(turnManager.savedState).toBeDefined();

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(turnManager.savedState).toBeNull();
    });
  });

  describe('Undo Limitation', () => {
    it('should only allow one undo per saved state', async () => {
      // Process first turn
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      
      // Restore once
      const firstRestore = turnManager.restoreState(player, grid, gameState);
      expect(firstRestore).toBe(true);

      // Try to restore again (should fail)
      const secondRestore = turnManager.restoreState(player, grid, gameState);
      expect(secondRestore).toBe(false);
    });
  });

  describe('Complex State Restoration', () => {
    it('should restore cracked floor state', async () => {
      // Place cracked floor
      grid.setTile(3, 2, { 
        type: TileType.CRACKED_FLOOR, 
        x: 3, 
        y: 2, 
        state: { crackLevel: 0 } 
      });

      // Step on it (cracks to level 1)
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
      const tile = grid.getTile(3, 2);
      expect(tile.state.crackLevel).toBe(1);

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      const restoredTile = grid.getTile(3, 2);
      expect(restoredTile.state.crackLevel).toBe(0);
    });

    it('should restore inventory', async () => {
      player.inventory = [
        { type: 'UNDO', quantity: 1 },
        { type: 'SHIELD', quantity: 1 }
      ];

      // Process turn
      await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);

      // Modify inventory
      player.inventory.push({ type: 'ANCHOR', quantity: 1 });

      // Restore state
      turnManager.restoreState(player, grid, gameState);
      expect(player.inventory).toHaveLength(2);
      expect(player.inventory[0].type).toBe('UNDO');
      expect(player.inventory[1].type).toBe('SHIELD');
    });
  });
});
