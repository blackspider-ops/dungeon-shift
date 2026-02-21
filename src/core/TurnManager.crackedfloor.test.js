import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Cracked Floors', () => {
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

  describe('cracked floor progression', () => {
    it('should progress intact cracked floor to stage 1 on first step without damage', () => {
      // Place intact cracked floor at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 0 };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that floor cracked but no damage dealt
      expect(hazardResults).toHaveLength(1);
      expect(hazardResults[0].type).toBe('trap');
      expect(hazardResults[0].damage).toBe(0);
      expect(hazardResults[0].description).toContain('cracked');
      
      // Check that player took no damage
      expect(player.hp).toBe(initialHp);
      
      // Check that crack level progressed
      const updatedTile = grid.getTile(2, 2);
      expect(updatedTile.state.crackLevel).toBe(1);
      expect(updatedTile.type).toBe(TileType.CRACKED_FLOOR);
    });

    it('should initialize crack level to 0 if not set', () => {
      // Place cracked floor without state
      const tile = grid.getTile(2, 2);
      tile.type = TileType.CRACKED_FLOOR;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that crack level was initialized and progressed
      const updatedTile = grid.getTile(2, 2);
      expect(updatedTile.state.crackLevel).toBe(1);
    });

    it('should break stage 1 cracked floor on second step and deal damage', () => {
      // Place stage 1 cracked floor at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 1 };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that floor collapsed and damage was dealt
      expect(hazardResults).toHaveLength(1);
      expect(hazardResults[0].type).toBe('trap');
      expect(hazardResults[0].damage).toBe(1);
      expect(hazardResults[0].description).toContain('collapsed');
      
      // Check that player took 1 damage
      expect(player.hp).toBe(initialHp - 1);
      
      // Check that tile converted to pit
      const updatedTile = grid.getTile(2, 2);
      expect(updatedTile.type).toBe(TileType.PIT);
      expect(updatedTile.state.crackLevel).toBe(2);
    });

    it('should not affect cracked floor if player is not on it', () => {
      // Place cracked floor away from player
      const tile = grid.getTile(5, 5);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 0 };
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that no hazards were triggered
      expect(hazardResults).toHaveLength(0);
      
      // Check that cracked floor state unchanged
      const crackedTile = grid.getTile(5, 5);
      expect(crackedTile.state.crackLevel).toBe(0);
      expect(crackedTile.type).toBe(TileType.CRACKED_FLOOR);
    });
  });

  describe('pit impassability', () => {
    it('should make pits impassable', () => {
      // Create a pit
      const tile = grid.getTile(3, 2);
      tile.type = TileType.PIT;
      
      // Check that pit is not walkable
      expect(grid.isWalkable(3, 2)).toBe(false);
    });

    it('should prevent player from moving onto pit', () => {
      // Place pit next to player
      const tile = grid.getTile(3, 2);
      tile.type = TileType.PIT;
      
      // Try to move onto pit
      const isValid = turnManager.validateMove(player, 3, 2, grid);
      
      // Move should be invalid
      expect(isValid).toBe(false);
    });
  });

  describe('cracked floor state preservation', () => {
    it('should preserve crack level when not stepped on', () => {
      // Place stage 1 cracked floor
      const tile = grid.getTile(5, 5);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 1 };
      
      // Player is elsewhere, resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Crack level should remain unchanged
      const crackedTile = grid.getTile(5, 5);
      expect(crackedTile.state.crackLevel).toBe(1);
      expect(crackedTile.type).toBe(TileType.CRACKED_FLOOR);
    });
  });

  describe('cracked floor integration with turn processing', () => {
    it('should crack floor during turn processing', async () => {
      // Place intact cracked floor next to player
      const tile = grid.getTile(3, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 0 };
      
      const initialHp = player.hp;
      
      // Process turn to move player onto cracked floor
      const turnResult = await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );
      
      // Check that hazard was resolved
      expect(turnResult.hazardResults).toHaveLength(1);
      expect(turnResult.hazardResults[0].damage).toBe(0);
      expect(player.hp).toBe(initialHp);
      
      // Check that floor cracked
      const crackedTile = grid.getTile(3, 2);
      expect(crackedTile.state.crackLevel).toBe(1);
    });

    it('should break floor and deal damage on second step', async () => {
      // Place stage 1 cracked floor next to player
      const tile = grid.getTile(3, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 1 };
      
      const initialHp = player.hp;
      
      // Process turn to move player onto cracked floor
      const turnResult = await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );
      
      // Check that hazard was resolved with damage
      expect(turnResult.hazardResults).toHaveLength(1);
      expect(turnResult.hazardResults[0].damage).toBe(1);
      expect(player.hp).toBe(initialHp - 1);
      
      // Check that floor became pit
      const pitTile = grid.getTile(3, 2);
      expect(pitTile.type).toBe(TileType.PIT);
    });
  });

  describe('cracked floor with shield', () => {
    it('should block damage from breaking floor with shield', () => {
      // Activate shield
      player.activeShield = true;
      const initialHp = player.hp;
      
      // Place stage 1 cracked floor at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 1 };
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player took no damage but shield was consumed
      expect(player.hp).toBe(initialHp);
      expect(player.activeShield).toBe(false);
      
      // Floor should still break
      const pitTile = grid.getTile(2, 2);
      expect(pitTile.type).toBe(TileType.PIT);
    });
  });

  describe('cracked floor loss condition', () => {
    it('should trigger loss condition when breaking floor reduces HP to 0', () => {
      // Set player HP to 1
      player.hp = 1;
      
      // Place stage 1 cracked floor at player position
      const tile = grid.getTile(2, 2);
      tile.type = TileType.CRACKED_FLOOR;
      tile.state = { crackLevel: 1 };
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player is dead
      expect(player.hp).toBe(0);
      expect(player.isAlive()).toBe(false);
    });
  });
});
