import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager', () => {
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
    
    // Create mock game state
    gameState = {
      keysRequired: 1,
      exitUnlocked: false
    };
  });

  describe('initialization', () => {
    it('should initialize with correct values', () => {
      expect(turnManager.getTurnNumber()).toBe(0);
      expect(turnManager.getCollapseMeter()).toBe(20);
    });
  });

  describe('validateMove', () => {
    it('should allow moves to walkable tiles', () => {
      const result = turnManager.validateMove(player, 3, 2, grid);
      expect(result).toBe(true);
    });

    it('should reject moves to walls', () => {
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      const result = turnManager.validateMove(player, 3, 2, grid);
      expect(result).toBe(false);
    });

    it('should reject moves out of bounds', () => {
      const result = turnManager.validateMove(player, -1, 2, grid);
      expect(result).toBe(false);
    });
  });

  describe('processTurn', () => {
    it('should process a valid turn and increment turn counter', async () => {
      const direction = { dx: 1, dy: 0 };
      const result = await turnManager.processTurn(player, direction, grid, gameState);
      
      expect(result.success).toBe(true);
      expect(turnManager.getTurnNumber()).toBe(1);
      expect(player.gridX).toBe(3);
      expect(player.gridY).toBe(2);
    });

    it('should decrement collapse meter after each turn', async () => {
      const direction = { dx: 1, dy: 0 };
      await turnManager.processTurn(player, direction, grid, gameState);
      
      expect(turnManager.getCollapseMeter()).toBe(19);
    });

    it('should reject invalid moves', async () => {
      grid.setTile(3, 2, { type: TileType.WALL, x: 3, y: 2 });
      const direction = { dx: 1, dy: 0 };
      const result = await turnManager.processTurn(player, direction, grid, gameState);
      
      expect(result.success).toBe(false);
      expect(turnManager.getTurnNumber()).toBe(0);
      expect(player.gridX).toBe(2);
    });

    it('should execute turn sequence in correct order', async () => {
      const direction = { dx: 1, dy: 0 };
      const result = await turnManager.processTurn(player, direction, grid, gameState);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('hazardResults');
      expect(result).toHaveProperty('shiftExecuted');
      expect(result).toHaveProperty('gameOver');
      expect(result).toHaveProperty('victory');
    });
  });

  describe('checkWinCondition', () => {
    it('should return false when player is not on exit', () => {
      player.keysCollected = 1;
      const result = turnManager.checkWinCondition(player, grid, gameState);
      expect(result).toBe(false);
    });

    it('should return false when player is on exit but has no keys', () => {
      grid.setTile(2, 2, { type: TileType.EXIT_UNLOCKED, x: 2, y: 2 });
      player.keysCollected = 0;
      const result = turnManager.checkWinCondition(player, grid, gameState);
      expect(result).toBe(false);
    });

    it('should return true when player is on exit with all keys', () => {
      grid.setTile(2, 2, { type: TileType.EXIT_UNLOCKED, x: 2, y: 2 });
      player.keysCollected = 1;
      const result = turnManager.checkWinCondition(player, grid, gameState);
      expect(result).toBe(true);
    });
  });

  describe('checkLossCondition', () => {
    it('should return false when player has HP and moves remaining', () => {
      const result = turnManager.checkLossCondition(player);
      expect(result).toBe(false);
    });

    it('should return true when player HP reaches 0', () => {
      player.hp = 0;
      const result = turnManager.checkLossCondition(player);
      expect(result).toBe(true);
    });

    it('should return true when collapse meter reaches 0', () => {
      turnManager.collapseMeter = 0;
      const result = turnManager.checkLossCondition(player);
      expect(result).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset turn counter and collapse meter', () => {
      turnManager.turnNumber = 5;
      turnManager.collapseMeter = 10;
      
      turnManager.reset();
      
      expect(turnManager.getTurnNumber()).toBe(0);
      expect(turnManager.getCollapseMeter()).toBe(20);
    });
  });

  describe('applyDamage', () => {
    it('should apply damage to player', () => {
      const result = turnManager.applyDamage(player, 1, 'spike trap');
      expect(player.hp).toBe(2);
      expect(result).toBe(true);
    });

    it('should return false when player dies from damage', () => {
      const result = turnManager.applyDamage(player, 3, 'enemy');
      expect(player.hp).toBe(0);
      expect(result).toBe(false);
    });
  });
});
