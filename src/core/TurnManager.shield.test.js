import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Shield Power-up', () => {
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

  describe('shield collection', () => {
    it('should collect shield power-up when player moves onto it', () => {
      // Place shield at (3, 2)
      grid.setTile(3, 2, { type: 'SHIELD', x: 3, y: 3 });

      // Collect shield
      player.gridX = 3;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Check that shield was added to inventory
      expect(player.inventory).toHaveLength(1);
      expect(player.inventory[0].type).toBe('SHIELD');
      expect(player.inventory[0].quantity).toBe(1);

      // Check that tile was converted to floor
      const tile = grid.getTile(3, 2);
      expect(tile.type).toBe('FLOOR');
    });

    it('should allow collecting multiple shields', () => {
      // Place first shield
      grid.setTile(3, 2, { type: 'SHIELD', x: 3, y: 2 });
      player.gridX = 3;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Place second shield
      grid.setTile(4, 2, { type: 'SHIELD', x: 4, y: 2 });
      player.gridX = 4;
      player.gridY = 2;
      turnManager.collectItems(player, grid, gameState);

      // Check that both shields were collected
      expect(player.inventory).toHaveLength(2);
      expect(player.inventory[0].type).toBe('SHIELD');
      expect(player.inventory[1].type).toBe('SHIELD');
    });
  });

  describe('shield damage absorption', () => {
    it('should block damage from spike trap when shield is active', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;

      // Place spike trap at player position
      grid.setTile(2, 2, { type: TileType.SPIKE_TRAP, x: 2, y: 2, state: { active: false } });

      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);

      // Spike should still be activated
      const tile = grid.getTile(2, 2);
      expect(tile.state.active).toBe(true);
    });

    it('should block damage from cracked floor when shield is active', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;

      // Place cracked floor at stage 1 (will break on next step)
      grid.setTile(2, 2, { 
        type: TileType.CRACKED_FLOOR, 
        x: 2, 
        y: 2, 
        state: { crackLevel: 1 } 
      });

      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);

      // Floor should still break
      const tile = grid.getTile(2, 2);
      expect(tile.type).toBe(TileType.PIT);
    });

    it('should block damage from arrow trap when shield is active', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;

      // Place arrow trap that will fire at player
      grid.setTile(2, 0, { 
        type: TileType.ARROW_TRAP, 
        x: 2, 
        y: 0, 
        state: { arrowTimer: 0, arrowDirection: 'DOWN' } 
      });

      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);
    });

    it('should block damage from enemy contact when shield is active', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;

      // Create mock enemy at player position
      const enemy = {
        type: 'PATROLLER',
        gridX: 2,
        gridY: 2,
        getGridPosition: function() {
          return { x: this.gridX, y: this.gridY };
        },
        update: function() {}
      };

      gameState.enemies = [enemy];

      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);
    });

    it('should take damage normally when shield is not active', () => {
      // Shield is not active
      player.activeShield = false;
      const initialHp = player.hp;

      // Place spike trap at player position
      grid.setTile(2, 2, { type: TileType.SPIKE_TRAP, x: 2, y: 2, state: { active: false } });

      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took damage
      expect(player.hp).toBe(initialHp - 1);
      expect(player.activeShield).toBe(false);
    });

    it('should only block one damage instance per shield', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;

      // Place spike trap at player position
      grid.setTile(2, 2, { type: TileType.SPIKE_TRAP, x: 2, y: 2, state: { active: false } });

      // Resolve hazards (first damage)
      turnManager.resolveHazards(player, grid, gameState);

      // Check that shield blocked first damage
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);

      // Move to another spike trap
      player.gridX = 3;
      player.gridY = 2;
      grid.setTile(3, 2, { type: TileType.SPIKE_TRAP, x: 3, y: 2, state: { active: false } });

      // Resolve hazards (second damage, no shield)
      turnManager.resolveHazards(player, grid, gameState);

      // Check that player took damage this time
      expect(player.hp).toBe(initialHp - 1);
    });
  });

  describe('shield state persistence', () => {
    it('should save and restore shield state with undo', () => {
      // Add shield to inventory
      player.inventory = [
        { type: 'UNDO', quantity: 1 },
        { type: 'SHIELD', quantity: 1 }
      ];
      player.activeShield = false;

      // Save state
      turnManager.saveState(player, grid, gameState);

      // Activate shield
      player.activeShield = true;
      player.inventory.splice(1, 1); // Remove shield from inventory

      // Restore state
      turnManager.restoreState(player, grid, gameState);

      // Check that shield state was restored
      expect(player.activeShield).toBe(false);
      expect(player.inventory).toHaveLength(2);
      expect(player.inventory[1].type).toBe('SHIELD');
    });

    it('should restore active shield state after undo', () => {
      // Activate shield
      player.activeShield = true;
      player.inventory = [];

      // Save state
      turnManager.saveState(player, grid, gameState);

      // Shield gets consumed by damage
      player.activeShield = false;

      // Restore state
      turnManager.restoreState(player, grid, gameState);

      // Check that active shield was restored
      expect(player.activeShield).toBe(true);
    });
  });
});
