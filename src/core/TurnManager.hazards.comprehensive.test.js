import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

/**
 * Comprehensive tests for all hazard types to verify they deal damage properly:
 * - Spike Traps (1 damage on step)
 * - Arrow Traps (1 damage when fired)
 * - Cracked Floors (1 damage on break)
 * - Slime Tiles (no direct damage, but can slide into hazards)
 * 
 * Tests verify requirement 35.2: All hazards deal damage properly
 */
describe('TurnManager - Comprehensive Hazard Damage Tests', () => {
  
  describe('35.2 Verify all hazards deal damage properly', () => {
    let turnManager;
    let grid;
    let player;
    let gameState;

    beforeEach(() => {
      turnManager = new TurnManager(20);
      grid = new Grid(10, 10);
      
      // Create mock player
      player = {
        gridX: 5,
        gridY: 5,
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

    describe('Spike Trap Damage', () => {
      it('should deal exactly 1 damage when player steps on spike trap', () => {
        // Place spike trap at player position
        const tile = grid.getTile(5, 5);
        tile.type = TileType.SPIKE_TRAP;
        
        const initialHp = player.hp;
        
        // Resolve hazards
        const hazardResults = turnManager.resolveHazards(player, grid, gameState);
        
        // Verify exactly 1 damage dealt
        expect(player.hp).toBe(initialHp - 1);
        expect(hazardResults).toHaveLength(1);
        expect(hazardResults[0].type).toBe('trap');
        expect(hazardResults[0].description).toContain('Spike');
      });

      it('should activate spike trap and mark it as active', () => {
        const tile = grid.getTile(5, 5);
        tile.type = TileType.SPIKE_TRAP;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        const updatedTile = grid.getTile(5, 5);
        expect(updatedTile.state?.active).toBe(true);
      });

      it('should reduce HP from 3 to 2 after spike damage', () => {
        const tile = grid.getTile(5, 5);
        tile.type = TileType.SPIKE_TRAP;
        
        expect(player.hp).toBe(3);
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
      });
    });

    describe('Arrow Trap Damage', () => {
      it('should deal exactly 1 damage when arrow hits player', () => {
        // Place arrow trap below player, pointing UP
        const tile = grid.getTile(5, 7);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
        
        const initialHp = player.hp;
        
        // Resolve hazards
        const hazardResults = turnManager.resolveHazards(player, grid, gameState);
        
        // Verify exactly 1 damage dealt
        expect(player.hp).toBe(initialHp - 1);
        expect(hazardResults).toHaveLength(1);
        expect(hazardResults[0].type).toBe('trap');
        expect(hazardResults[0].description).toContain('Arrow');
      });

      it('should fire arrow in correct direction and hit player', () => {
        // Arrow trap to the left, pointing RIGHT
        const tile = grid.getTile(3, 5);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'RIGHT' };
        
        const initialHp = player.hp;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        // Player at (5, 5) should be hit by arrow from (3, 5) going RIGHT
        expect(player.hp).toBe(initialHp - 1);
      });

      it('should not deal damage when arrow misses player', () => {
        // Arrow trap pointing away from player
        const tile = grid.getTile(3, 5);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'LEFT' };
        
        const initialHp = player.hp;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        // No damage should be dealt
        expect(player.hp).toBe(initialHp);
      });

      it('should reduce HP from 3 to 2 after arrow damage', () => {
        const tile = grid.getTile(5, 7);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
        
        expect(player.hp).toBe(3);
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
      });
    });

    describe('Cracked Floor Damage', () => {
      it('should deal 0 damage on first step (crack stage 0 → 1)', () => {
        // Place intact cracked floor at player position
        const tile = grid.getTile(5, 5);
        tile.type = TileType.CRACKED_FLOOR;
        tile.state = { crackLevel: 0 };
        
        const initialHp = player.hp;
        
        // Resolve hazards
        const hazardResults = turnManager.resolveHazards(player, grid, gameState);
        
        // No damage on first step
        expect(player.hp).toBe(initialHp);
        expect(hazardResults).toHaveLength(1);
        expect(hazardResults[0].damage).toBe(0);
        
        // Floor should crack
        const updatedTile = grid.getTile(5, 5);
        expect(updatedTile.state.crackLevel).toBe(1);
      });

      it('should deal exactly 1 damage on second step (crack stage 1 → break)', () => {
        // Place stage 1 cracked floor at player position
        const tile = grid.getTile(5, 5);
        tile.type = TileType.CRACKED_FLOOR;
        tile.state = { crackLevel: 1 };
        
        const initialHp = player.hp;
        
        // Resolve hazards
        const hazardResults = turnManager.resolveHazards(player, grid, gameState);
        
        // Verify exactly 1 damage dealt
        expect(player.hp).toBe(initialHp - 1);
        expect(hazardResults).toHaveLength(1);
        expect(hazardResults[0].damage).toBe(1);
        expect(hazardResults[0].description).toContain('collapsed');
        
        // Floor should become pit
        const updatedTile = grid.getTile(5, 5);
        expect(updatedTile.type).toBe(TileType.PIT);
      });

      it('should reduce HP from 3 to 2 after floor collapse', () => {
        const tile = grid.getTile(5, 5);
        tile.type = TileType.CRACKED_FLOOR;
        tile.state = { crackLevel: 1 };
        
        expect(player.hp).toBe(3);
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
      });
    });

    describe('Slime Tile Behavior', () => {
      it('should not deal direct damage (slime is not a damaging hazard)', async () => {
        // Place slime tile next to player
        const tile = grid.getTile(6, 5);
        tile.type = TileType.SLIME;
        
        const initialHp = player.hp;
        
        // Move onto slime
        await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        // No direct damage from slime
        expect(player.hp).toBe(initialHp);
      });

      it('should cause player to slide into spike trap and take damage', async () => {
        // Place slime at (6, 5) and spike at (7, 5)
        grid.setTile(6, 5, { type: TileType.SLIME, x: 6, y: 5 });
        grid.setTile(7, 5, { type: TileType.SPIKE_TRAP, x: 7, y: 5 });
        
        const initialHp = player.hp;
        
        // Move onto slime, should slide into spike
        await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        // Should take damage from spike trap
        expect(player.hp).toBe(initialHp - 1);
        expect(player.gridX).toBe(7);
      });
    });

    describe('Multiple Hazards Damage Accumulation', () => {
      it('should accumulate damage from multiple hazards in one turn', () => {
        // Place spike trap at player position
        const spikeTile = grid.getTile(5, 5);
        spikeTile.type = TileType.SPIKE_TRAP;
        
        // Place arrow trap that will hit player
        const arrowTile = grid.getTile(5, 7);
        arrowTile.type = TileType.ARROW_TRAP;
        arrowTile.state = { arrowTimer: 0, arrowDirection: 'UP' };
        
        const initialHp = player.hp;
        
        // Resolve hazards
        const hazardResults = turnManager.resolveHazards(player, grid, gameState);
        
        // Should take 2 damage total (1 from spike + 1 from arrow)
        expect(player.hp).toBe(initialHp - 2);
        expect(hazardResults).toHaveLength(2);
      });

      it('should handle three hazards dealing damage simultaneously', () => {
        // Spike at player position
        grid.getTile(5, 5).type = TileType.SPIKE_TRAP;
        
        // Two arrow traps hitting player
        grid.setTile(5, 7, { 
          type: TileType.ARROW_TRAP, 
          x: 5, y: 7,
          state: { arrowTimer: 0, arrowDirection: 'UP' }
        });
        grid.setTile(3, 5, { 
          type: TileType.ARROW_TRAP, 
          x: 3, y: 5,
          state: { arrowTimer: 0, arrowDirection: 'RIGHT' }
        });
        
        const initialHp = player.hp;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        // Should take 3 damage total
        expect(player.hp).toBe(initialHp - 3);
      });
    });

    describe('Damage and Death', () => {
      it('should trigger death when spike reduces HP to 0', () => {
        player.hp = 1;
        
        const tile = grid.getTile(5, 5);
        tile.type = TileType.SPIKE_TRAP;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(0);
        expect(player.isAlive()).toBe(false);
      });

      it('should trigger death when arrow reduces HP to 0', () => {
        player.hp = 1;
        
        const tile = grid.getTile(5, 7);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(0);
        expect(player.isAlive()).toBe(false);
      });

      it('should trigger death when cracked floor reduces HP to 0', () => {
        player.hp = 1;
        
        const tile = grid.getTile(5, 5);
        tile.type = TileType.CRACKED_FLOOR;
        tile.state = { crackLevel: 1 };
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(0);
        expect(player.isAlive()).toBe(false);
      });
    });

    describe('Shield Interaction with Hazards', () => {
      it('should block spike damage with shield', () => {
        player.activeShield = true;
        const initialHp = player.hp;
        
        const tile = grid.getTile(5, 5);
        tile.type = TileType.SPIKE_TRAP;
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(initialHp);
        expect(player.activeShield).toBe(false);
      });

      it('should block arrow damage with shield', () => {
        player.activeShield = true;
        const initialHp = player.hp;
        
        const tile = grid.getTile(5, 7);
        tile.type = TileType.ARROW_TRAP;
        tile.state = { arrowTimer: 0, arrowDirection: 'UP' };
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(initialHp);
        expect(player.activeShield).toBe(false);
      });

      it('should block cracked floor damage with shield', () => {
        player.activeShield = true;
        const initialHp = player.hp;
        
        const tile = grid.getTile(5, 5);
        tile.type = TileType.CRACKED_FLOOR;
        tile.state = { crackLevel: 1 };
        
        turnManager.resolveHazards(player, grid, gameState);
        
        expect(player.hp).toBe(initialHp);
        expect(player.activeShield).toBe(false);
      });
    });

    describe('All Hazards Summary', () => {
      it('should verify all 4 hazard types exist and function', () => {
        // This test verifies that all hazard types are implemented
        const hazardTypes = [
          TileType.SPIKE_TRAP,
          TileType.ARROW_TRAP,
          TileType.CRACKED_FLOOR,
          TileType.SLIME
        ];
        
        // All hazard types should be defined
        hazardTypes.forEach(type => {
          expect(type).toBeDefined();
        });
        
        // Verify each hazard can be placed and recognized
        grid.setTile(0, 0, { type: TileType.SPIKE_TRAP, x: 0, y: 0 });
        grid.setTile(1, 0, { type: TileType.ARROW_TRAP, x: 1, y: 0, state: { arrowDirection: 'UP' } });
        grid.setTile(2, 0, { type: TileType.CRACKED_FLOOR, x: 2, y: 0, state: { crackLevel: 0 } });
        grid.setTile(3, 0, { type: TileType.SLIME, x: 3, y: 0 });
        
        expect(grid.getTile(0, 0).type).toBe(TileType.SPIKE_TRAP);
        expect(grid.getTile(1, 0).type).toBe(TileType.ARROW_TRAP);
        expect(grid.getTile(2, 0).type).toBe(TileType.CRACKED_FLOOR);
        expect(grid.getTile(3, 0).type).toBe(TileType.SLIME);
      });

      it('should verify damage amounts are correct for all hazards', () => {
        // Spike: 1 damage
        player.hp = 3;
        grid.getTile(5, 5).type = TileType.SPIKE_TRAP;
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
        
        // Arrow: 1 damage
        player.hp = 3;
        player.gridX = 5;
        player.gridY = 5;
        grid.setTile(5, 7, { 
          type: TileType.ARROW_TRAP, 
          x: 5, y: 7,
          state: { arrowTimer: 0, arrowDirection: 'UP' }
        });
        grid.getTile(5, 5).type = TileType.FLOOR; // Clear spike
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
        
        // Cracked floor (stage 1): 1 damage
        player.hp = 3;
        grid.setTile(5, 5, { 
          type: TileType.CRACKED_FLOOR, 
          x: 5, y: 5,
          state: { crackLevel: 1 }
        });
        grid.setTile(5, 7, { type: TileType.FLOOR, x: 5, y: 7 }); // Clear arrow
        turnManager.resolveHazards(player, grid, gameState);
        expect(player.hp).toBe(2);
      });
    });
  });
});
