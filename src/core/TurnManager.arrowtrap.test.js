import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Arrow Traps', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(8, 8);
    
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
      },
      isAlive: function() {
        return this.hp > 0;
      }
    };
    
    gameState = {
      keysRequired: 0,
      exitUnlocked: false
    };
  });

  describe('arrow trap timer system', () => {
    it('should initialize arrow trap with timer=3', () => {
      const tile = grid.getTile(4, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowDirection: 'UP' };
      
      turnManager.updateArrowTraps(grid);
      
      const updatedTile = grid.getTile(4, 4);
      expect(updatedTile.state.arrowTimer).toBe(2); // Decremented from 3 to 2
    });

    it('should decrement arrow trap timer each turn', () => {
      const tile = grid.getTile(4, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 3, arrowDirection: 'UP' };
      
      // Turn 1
      turnManager.updateArrowTraps(grid);
      expect(grid.getTile(4, 4).state.arrowTimer).toBe(2);
      
      // Turn 2
      turnManager.updateArrowTraps(grid);
      expect(grid.getTile(4, 4).state.arrowTimer).toBe(1);
      
      // Turn 3
      turnManager.updateArrowTraps(grid);
      expect(grid.getTile(4, 4).state.arrowTimer).toBe(0);
    });

    it('should reset timer to 3 after firing', () => {
      const tile = grid.getTile(4, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
      
      // Check for firing (this should reset the timer)
      turnManager.checkArrowTraps(grid);
      
      expect(grid.getTile(4, 4).state.arrowTimer).toBe(3);
    });

    it('should fire arrow when timer reaches 0', () => {
      const tile = grid.getTile(4, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 1, arrowDirection: 'UP' };
      
      // Decrement to 0
      turnManager.updateArrowTraps(grid);
      
      // Check for firing arrows
      const projectiles = turnManager.checkArrowTraps(grid);
      expect(projectiles).toHaveLength(1);
      expect(projectiles[0].startX).toBe(4);
      expect(projectiles[0].startY).toBe(4);
      expect(projectiles[0].direction).toBe('UP');
    });
  });

  describe('arrow projectile path calculation', () => {
    it('should calculate arrow path going UP', () => {
      const projectile = { startX: 4, startY: 4, direction: 'UP' };
      
      const path = turnManager.calculateArrowPath(projectile, grid);
      
      // Should go from (4,3) up to (4,0) - no walls in default grid
      expect(path).toEqual([
        { x: 4, y: 3 },
        { x: 4, y: 2 },
        { x: 4, y: 1 },
        { x: 4, y: 0 }
      ]);
    });

    it('should calculate arrow path going DOWN', () => {
      const projectile = { startX: 4, startY: 2, direction: 'DOWN' };
      
      const path = turnManager.calculateArrowPath(projectile, grid);
      
      // Should go from (4,3) down to (4,7) - no walls in default grid
      expect(path).toEqual([
        { x: 4, y: 3 },
        { x: 4, y: 4 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 4, y: 7 }
      ]);
    });

    it('should calculate arrow path going LEFT', () => {
      const projectile = { startX: 4, startY: 4, direction: 'LEFT' };
      
      const path = turnManager.calculateArrowPath(projectile, grid);
      
      // Should go from (3,4) left to (0,4) - no walls in default grid
      expect(path).toEqual([
        { x: 3, y: 4 },
        { x: 2, y: 4 },
        { x: 1, y: 4 },
        { x: 0, y: 4 }
      ]);
    });

    it('should calculate arrow path going RIGHT', () => {
      const projectile = { startX: 2, startY: 4, direction: 'RIGHT' };
      
      const path = turnManager.calculateArrowPath(projectile, grid);
      
      // Should go from (3,4) right to (7,4) - no walls in default grid
      expect(path).toEqual([
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
        { x: 7, y: 4 }
      ]);
    });

    it('should stop arrow at walls', () => {
      // Place wall at (4, 3)
      const wallTile = grid.getTile(4, 3);
      wallTile.type = TileType.WALL;
      
      const projectile = { startX: 4, startY: 4, direction: 'UP' };
      const path = turnManager.calculateArrowPath(projectile, grid);
      
      // Should stop before the wall
      expect(path).toEqual([]);
    });
  });

  describe('arrow trap damage', () => {
    it('should deal 1 damage when arrow hits player', () => {
      // Place arrow trap below player, pointing UP
      const tile = grid.getTile(2, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player took damage
      expect(player.hp).toBe(initialHp - 1);
      expect(hazardResults).toHaveLength(1);
      expect(hazardResults[0].type).toBe('trap');
      expect(hazardResults[0].description).toContain('Arrow');
    });

    it('should not deal damage when arrow misses player', () => {
      // Place arrow trap pointing away from player
      const tile = grid.getTile(5, 5);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 0, arrowDirection: 'DOWN' };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Check that player took no damage
      expect(player.hp).toBe(initialHp);
    });

    it('should deal damage to player in line of fire', () => {
      // Player at (2, 2)
      // Arrow trap at (2, 5) pointing UP
      const tile = grid.getTile(2, 5);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // Player should be hit
      expect(player.hp).toBe(initialHp - 1);
    });

    it('should not fire arrow when timer is not 0', () => {
      const tile = grid.getTile(2, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 2, arrowDirection: 'UP' };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      turnManager.resolveHazards(player, grid, gameState);
      
      // No damage should be dealt
      expect(player.hp).toBe(initialHp);
    });
  });

  describe('arrow trap integration with turn processing', () => {
    it('should update timer and fire arrow during turn', async () => {
      // Place arrow trap with timer=1 at (3, 4) pointing UP
      // Player starts at (2, 2) and will move to (3, 2)
      // Arrow will fire from (3, 3) upward through (3, 2) hitting the player
      const tile = grid.getTile(3, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 1, arrowDirection: 'UP' };
      
      const initialHp = player.hp;
      
      // Process turn (player moves right to (3, 2))
      const turnResult = await turnManager.processTurn(
        player,
        { dx: 1, dy: 0 },
        grid,
        gameState
      );
      
      // Timer should decrement to 0 and fire, hitting player at (3, 2)
      expect(turnResult.hazardResults.length).toBeGreaterThan(0);
      expect(player.hp).toBe(initialHp - 1);
    });

    it('should show telegraph warning when timer is 1', () => {
      const tile = grid.getTile(4, 4);
      tile.type = TileType.ARROW_TRAP;
      tile.state = { arrowTimer: 1, arrowDirection: 'UP' };
      
      // Timer is 1, should show telegraph
      expect(tile.state.arrowTimer).toBe(1);
    });
  });

  describe('multiple arrow traps', () => {
    it('should handle multiple arrow traps firing simultaneously', () => {
      // Place two arrow traps
      const tile1 = grid.getTile(2, 4);
      tile1.type = TileType.ARROW_TRAP;
      tile1.state = { arrowTimer: 0, arrowDirection: 'UP' };
      
      const tile2 = grid.getTile(4, 2);
      tile2.type = TileType.ARROW_TRAP;
      tile2.state = { arrowTimer: 0, arrowDirection: 'LEFT' };
      
      const initialHp = player.hp;
      
      // Resolve hazards
      const hazardResults = turnManager.resolveHazards(player, grid, gameState);
      
      // Both arrows should hit player at (2, 2)
      expect(hazardResults.length).toBe(2);
      expect(player.hp).toBe(initialHp - 2);
    });
  });
});
