import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

/**
 * Comprehensive tests for win and loss conditions:
 * - Win: Player reaches exit with all keys
 * - Loss: HP reaches 0
 * - Loss: Collapse meter reaches 0
 * 
 * Tests verify requirement 35.4: Win/loss conditions trigger correctly
 */
describe('TurnManager - Comprehensive Win/Loss Condition Tests', () => {
  
  describe('35.4 Verify win/loss conditions trigger correctly', () => {
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
        keysRequired: 1,
        exitUnlocked: false
      };
    });

    describe('Win Condition - Exit with Keys', () => {
      it('should trigger win when player reaches unlocked exit with all keys', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // Player has collected all required keys
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(true);
      });

      it('should not trigger win when player is not on exit', () => {
        // Place exit elsewhere
        grid.setTile(7, 7, { type: TileType.EXIT_UNLOCKED, x: 7, y: 7 });
        
        // Player has all keys but not on exit
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(false);
      });

      it('should not trigger win when player lacks required keys', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // Player has not collected all keys
        player.keysCollected = 0;
        gameState.keysRequired = 1;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(false);
      });

      it('should not trigger win when exit is locked', () => {
        // Place locked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_LOCKED, x: 5, y: 5 });
        
        // Player has all keys
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(false);
      });

      it('should trigger win with multiple keys collected', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // Player has collected all 3 required keys
        player.keysCollected = 3;
        gameState.keysRequired = 3;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(true);
      });

      it('should trigger win when no keys are required', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // No keys required
        player.keysCollected = 0;
        gameState.keysRequired = 0;
        
        const result = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(result).toBe(true);
      });
    });

    describe('Loss Condition - HP Reaches 0', () => {
      it('should trigger loss when player HP reaches 0', () => {
        player.hp = 0;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should not trigger loss when player has HP remaining', () => {
        player.hp = 1;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(false);
      });

      it('should trigger loss when HP is reduced to 0 by damage', () => {
        player.hp = 1;
        
        // Take damage
        player.takeDamage(1);
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should not trigger loss when player has 1 HP remaining', () => {
        player.hp = 1;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(false);
      });

      it('should trigger loss when HP is reduced to 0 by multiple damage sources', () => {
        player.hp = 2;
        
        // Take damage from two sources
        player.takeDamage(1);
        player.takeDamage(1);
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });
    });

    describe('Loss Condition - Collapse Meter Reaches 0', () => {
      it('should trigger loss when collapse meter reaches 0', () => {
        turnManager.collapseMeter = 0;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should not trigger loss when collapse meter is above 0', () => {
        turnManager.collapseMeter = 1;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(false);
      });

      it('should trigger loss when collapse meter decrements to 0', async () => {
        turnManager.collapseMeter = 1;
        
        // Process turn (decrements meter)
        await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(turnManager.collapseMeter).toBe(0);
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should not trigger loss when collapse meter is at 1', () => {
        turnManager.collapseMeter = 1;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(false);
      });

      it('should decrement collapse meter each turn', async () => {
        const initialMeter = turnManager.collapseMeter;
        
        // Process turn
        await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(turnManager.collapseMeter).toBe(initialMeter - 1);
      });
    });

    describe('Win/Loss Integration with Turn Processing', () => {
      it('should return victory=true when win condition is met', async () => {
        // Place unlocked exit next to player
        grid.setTile(6, 5, { type: TileType.EXIT_UNLOCKED, x: 6, y: 5 });
        
        // Player has all keys
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        // Move onto exit
        const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(result.victory).toBe(true);
        expect(result.gameOver).toBe(true);
      });

      it('should return gameOver=true when HP reaches 0', async () => {
        player.hp = 1;
        
        // Place spike trap next to player
        grid.setTile(6, 5, { type: TileType.SPIKE_TRAP, x: 6, y: 5 });
        
        // Move onto spike (will reduce HP to 0)
        const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(result.gameOver).toBe(true);
        expect(result.victory).toBe(false);
      });

      it('should return gameOver=true when collapse meter reaches 0', async () => {
        turnManager.collapseMeter = 1;
        
        // Process turn (will decrement meter to 0)
        const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(result.gameOver).toBe(true);
        expect(result.victory).toBe(false);
      });

      it('should not trigger game over when conditions are not met', async () => {
        // Normal game state
        player.hp = 3;
        turnManager.collapseMeter = 20;
        
        // Process normal turn
        const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
        
        expect(result.gameOver).toBe(false);
        expect(result.victory).toBe(false);
      });
    });

    describe('Multiple Loss Conditions', () => {
      it('should trigger loss when both HP and collapse meter are 0', () => {
        player.hp = 0;
        turnManager.collapseMeter = 0;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should trigger loss when HP is 0 even if collapse meter is high', () => {
        player.hp = 0;
        turnManager.collapseMeter = 20;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });

      it('should trigger loss when collapse meter is 0 even if HP is high', () => {
        player.hp = 3;
        turnManager.collapseMeter = 0;
        
        const result = turnManager.checkLossCondition(player);
        
        expect(result).toBe(true);
      });
    });

    describe('Win Condition Priority', () => {
      it('should trigger win even when collapse meter is low', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // Player has all keys
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        // Collapse meter is at 1
        turnManager.collapseMeter = 1;
        
        const winResult = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(winResult).toBe(true);
      });

      it('should trigger win even when HP is low', () => {
        // Place unlocked exit at player position
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        
        // Player has all keys
        player.keysCollected = 1;
        gameState.keysRequired = 1;
        
        // HP is at 1
        player.hp = 1;
        
        const winResult = turnManager.checkWinCondition(player, grid, gameState);
        
        expect(winResult).toBe(true);
      });
    });

    describe('Condition State Verification', () => {
      it('should verify all win condition requirements', () => {
        // Test each requirement individually
        
        // Requirement 1: Player on exit
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        player.keysCollected = 0;
        gameState.keysRequired = 1;
        expect(turnManager.checkWinCondition(player, grid, gameState)).toBe(false);
        
        // Requirement 2: All keys collected
        player.keysCollected = 1;
        expect(turnManager.checkWinCondition(player, grid, gameState)).toBe(true);
      });

      it('should verify all loss condition requirements', () => {
        // Test each loss condition individually
        
        // Loss condition 1: HP = 0
        player.hp = 0;
        turnManager.collapseMeter = 20;
        expect(turnManager.checkLossCondition(player)).toBe(true);
        
        // Loss condition 2: Collapse meter = 0
        player.hp = 3;
        turnManager.collapseMeter = 0;
        expect(turnManager.checkLossCondition(player)).toBe(true);
        
        // No loss conditions met
        player.hp = 3;
        turnManager.collapseMeter = 20;
        expect(turnManager.checkLossCondition(player)).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle win condition with 0 keys required', () => {
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        player.keysCollected = 0;
        gameState.keysRequired = 0;
        
        expect(turnManager.checkWinCondition(player, grid, gameState)).toBe(true);
      });

      it('should handle player with more keys than required', () => {
        grid.setTile(5, 5, { type: TileType.EXIT_UNLOCKED, x: 5, y: 5 });
        player.keysCollected = 5;
        gameState.keysRequired = 3;
        
        expect(turnManager.checkWinCondition(player, grid, gameState)).toBe(true);
      });

      it('should handle negative HP as loss', () => {
        player.hp = -1;
        
        expect(turnManager.checkLossCondition(player)).toBe(true);
      });

      it('should handle negative collapse meter as loss', () => {
        turnManager.collapseMeter = -1;
        
        expect(turnManager.checkLossCondition(player)).toBe(true);
      });
    });
  });
});
