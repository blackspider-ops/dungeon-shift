import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Phase Step Power-up', () => {
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
      inventory: [],
      activeShield: false,
      phaseStepActive: false,
      getGridPosition: function() {
        return { x: this.gridX, y: this.gridY };
      },
      moveTo: function(x, y) {
        this.gridX = x;
        this.gridY = y;
      },
      takeDamage: function(amount) {
        if (this.activeShield) {
          this.activeShield = false;
          return true;
        }
        this.hp = Math.max(0, this.hp - amount);
        return this.hp > 0;
      }
    };

    // Create game state
    gameState = {
      keysRequired: 0,
      exitUnlocked: false,
      enemies: [],
      items: []
    };

    // Create turn manager
    turnManager = new TurnManager(10);
  });

  describe('phase step collection', () => {
    it('should collect phase step power-up when player moves onto it', () => {
      // Place phase step at (3, 2)
      grid.setTile(3, 2, { type: 'PHASE_STEP', x: 3, y: 2 });

      // Collect phase step
      player.gridX = 3;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Check that phase step was added to inventory
      expect(player.inventory).toHaveLength(1);
      expect(player.inventory[0].type).toBe('PHASE_STEP');
      expect(player.inventory[0].quantity).toBe(1);

      // Check that tile was converted to floor
      const tile = grid.getTile(3, 2);
      expect(tile.type).toBe('FLOOR');
    });

    it('should allow collecting multiple phase steps', () => {
      // Place first phase step
      grid.setTile(3, 2, { type: 'PHASE_STEP', x: 3, y: 2 });
      player.gridX = 3;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Place second phase step
      grid.setTile(4, 2, { type: 'PHASE_STEP', x: 4, y: 2 });
      player.gridX = 4;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Check that both phase steps were collected
      expect(player.inventory).toHaveLength(2);
      expect(player.inventory[0].type).toBe('PHASE_STEP');
      expect(player.inventory[1].type).toBe('PHASE_STEP');
    });
  });

  describe('phase step wall passing', () => {
    it('should allow passing through a wall when phase step is active', () => {
      // Place wall at (3, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      expect(isValid).toBe(true);
    });

    it('should move player to tile beyond the wall', () => {
      // Place wall at (3, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Execute move (player at 2,2 moving right to 3,2 which is a wall)
      turnManager.executePlayerMove(player, 3, 2, grid);

      // Player should be at (4, 2) - the tile beyond the wall
      expect(player.gridX).toBe(4);
      expect(player.gridY).toBe(2);
    });

    it('should consume phase step after passing through wall', () => {
      // Place wall at (3, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Execute move
      turnManager.executePlayerMove(player, 3, 2, grid);

      // Phase step should be consumed
      expect(player.phaseStepActive).toBe(false);
    });

    it('should reject phase step if tile beyond wall is also a wall', () => {
      // Place walls at (3, 2) and (4, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      grid.setTile(4, 2, { type: TileType.WALL, x: 4, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      expect(isValid).toBe(false);
    });

    it('should reject phase step if tile beyond wall is out of bounds', () => {
      // Place player at edge
      player.gridX = 4;
      player.gridY = 2;

      // Place wall at edge (4, 2) - beyond would be out of bounds
      grid.setTile(4, 2, { type: TileType.WALL, x: 4, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall (would go to 5, 2 which is out of bounds)
      const isValid = turnManager.validateMove(player, 4, 2, grid);
      expect(isValid).toBe(false);
    });

    it('should reject phase step if tile beyond wall is a pit', () => {
      // Place wall at (3, 2) and pit at (4, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      grid.setTile(4, 2, { type: TileType.PIT, x: 4, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      expect(isValid).toBe(false);
    });

    it('should reject phase step if tile beyond wall is a locked door', () => {
      // Place wall at (3, 2) and locked door at (4, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      grid.setTile(4, 2, { type: TileType.DOOR_LOCKED, x: 4, y: 2 });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      expect(isValid).toBe(false);
    });

    it('should allow phase step to tile with trap beyond wall', () => {
      // Place wall at (3, 2) and spike trap at (4, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      grid.setTile(4, 2, { type: TileType.SPIKE_TRAP, x: 4, y: 2, state: { active: false } });

      // Activate phase step
      player.phaseStepActive = true;

      // Validate move through wall
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      expect(isValid).toBe(true);
    });

    it('should consume phase step on normal move if active', () => {
      // No wall, just normal floor
      player.phaseStepActive = true;

      // Execute normal move
      turnManager.executePlayerMove(player, 3, 2, grid);

      // Phase step should be consumed even on normal move
      expect(player.phaseStepActive).toBe(false);
      expect(player.gridX).toBe(3);
      expect(player.gridY).toBe(2);
    });
  });

  describe('phase step directional movement', () => {
    it('should work when moving right through wall', () => {
      // Player at (2, 2), wall at (3, 2), should end at (4, 2)
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      player.phaseStepActive = true;

      turnManager.executePlayerMove(player, 3, 2, grid);

      expect(player.gridX).toBe(4);
      expect(player.gridY).toBe(2);
    });

    it('should work when moving left through wall', () => {
      // Player at (2, 2), wall at (1, 2), should end at (0, 2)
      grid.setTile(1, 2, { type: TileType.WALL, x: 1, y: 2 });
      player.phaseStepActive = true;

      turnManager.executePlayerMove(player, 1, 2, grid);

      expect(player.gridX).toBe(0);
      expect(player.gridY).toBe(2);
    });

    it('should work when moving up through wall', () => {
      // Player at (2, 2), wall at (2, 1), should end at (2, 0)
      grid.setTile(2, 1, { type: TileType.WALL, x: 2, y: 1 });
      player.phaseStepActive = true;

      turnManager.executePlayerMove(player, 2, 1, grid);

      expect(player.gridX).toBe(2);
      expect(player.gridY).toBe(0);
    });

    it('should work when moving down through wall', () => {
      // Player at (2, 2), wall at (2, 3), should end at (2, 4)
      grid.setTile(2, 3, { type: TileType.WALL, x: 2, y: 3 });
      player.phaseStepActive = true;

      turnManager.executePlayerMove(player, 2, 3, grid);

      expect(player.gridX).toBe(2);
      expect(player.gridY).toBe(4);
    });
  });

  describe('phase step state persistence', () => {
    it('should save and restore phase step state with undo', () => {
      // Add phase step to inventory
      player.inventory = [
        { type: 'UNDO', quantity: 1 },
        { type: 'PHASE_STEP', quantity: 1 }
      ];
      player.phaseStepActive = false;

      // Save state
      turnManager.saveState(player, grid, gameState);

      // Activate phase step
      player.phaseStepActive = true;
      player.inventory.splice(1, 1); // Remove phase step from inventory

      // Restore state
      turnManager.restoreState(player, grid, gameState);

      // Check that phase step state was restored
      expect(player.phaseStepActive).toBe(false);
      expect(player.inventory).toHaveLength(2);
      expect(player.inventory[1].type).toBe('PHASE_STEP');
    });

    it('should restore active phase step state after undo', () => {
      // Activate phase step
      player.phaseStepActive = true;
      player.inventory = [];

      // Save state
      turnManager.saveState(player, grid, gameState);

      // Phase step gets consumed
      player.phaseStepActive = false;

      // Restore state
      turnManager.restoreState(player, grid, gameState);

      // Check that active phase step was restored
      expect(player.phaseStepActive).toBe(true);
    });
  });
});
