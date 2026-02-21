import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Spike Traps', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(8, 8);
    
    // Create mock player with getGridPosition method
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
      },
      isAlive: function() {
        return this.hp > 0;
      }
    };
    
    // Create mock game state
    gameState = {
      keysRequired: 0,
      exitUnlocked: false
    };
  });

  describe('spike trap activation', () => {
    it('should activate spike trap when player steps on it', () => {
      // Place spike trap at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that spike trap was activated
      expect(hazardResults).toHaveLength(1);
      expect(hazardResults[0].type).toBe('trap');
      expect(hazardResults[0].description).toContain('Spike');
      
      // Check that tile state was updated
      const updatedTile = grid.getTile(2, 2);
      expect(updatedTile.state?.active).toBe(true);
    });

    it('should deal 1 damage to player when spike activates', () => {
      // Place spike trap at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      const initialHp = player.hp;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player took 1 damage
      expect(player.hp).toBe(initialHp - 1);
    });

    it('should not activate spike trap if player is not on it', () => {
      // Place spike trap away from player
      const tile = grid.getTile(5, 5);
      tile.type = TileType.SPIKE_TRAP;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that no hazards were triggered
      expect(hazardResults).toHaveLength(0);
      
      // Check that spike trap was not activated
      const spikeTile = grid.getTile(5, 5);
      expect(spikeTile.state?.active).toBeUndefined();
    });

    it('should keep spike trap active after activation', () => {
      // Place spike trap at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      // First activation
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that spike is active
      const activeTile = grid.getTile(2, 2);
      expect(activeTile.state?.active).toBe(true);
      
      // Move player away and back
      player.moveTo(3, 2);
      player.moveTo(2, 2);
      
      // Spike should still be active
      const stillActiveTile = grid.getTile(2, 2);
      expect(stillActiveTile.state?.active).toBe(true);
    });

    it('should trigger loss condition when spike reduces HP to 0', () => {
      // Set player HP to 1
      player.hp = 1;
      
      // Place spike trap at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player is dead
      expect(player.hp).toBe(0);
      expect(player.isAlive()).toBe(false);
    });

    it('should block damage with shield if active', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;
      
      // Place spike trap at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);
    });
  });

  describe('spike trap integration with turn processing', () => {
    it('should activate spike trap during turn processing', async () => {
      // Place spike trap next to player
      const tile = grid.getTile(3, 2);
      tile.type = TileType.SPIKE_TRAP;
      
      const initialHp = player.hp;
      
      // Process turn to move player onto spike
      const turnResult = await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );
      
      // Check that hazard was resolved
      expect(turnResult.hazardResults).toHaveLength(1);
      expect(turnResult.hazardResults[0].type).toBe('trap');
      expect(player.hp).toBe(initialHp - 1);
    });
  });
});
