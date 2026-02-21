/**
 * Tests for slime tile sliding mechanics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Slime Tiles', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    // Create a 10x10 grid
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
      keysRequired: 0,
      exitUnlocked: false,
      shiftSystem: null
    };
    
    // Create turn manager
    turnManager = new TurnManager(20);
  });

  it('should slide player one extra tile when stepping on slime', async () => {
    // Place slime tile at (6, 5)
    grid.setTile(6, 5, {
      type: TileType.SLIME,
      x: 6,
      y: 5
    });
    
    // Move player right onto slime
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should slide from (6,5) to (7,5)
    expect(player.gridX).toBe(7);
    expect(player.gridY).toBe(5);
  });

  it('should stop slide at walls', async () => {
    // Place slime tile at (6, 5)
    grid.setTile(6, 5, {
      type: TileType.SLIME,
      x: 6,
      y: 5
    });
    
    // Place wall at (7, 5)
    grid.setTile(7, 5, {
      type: TileType.WALL,
      x: 7,
      y: 5
    });
    
    // Move player right onto slime
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should stop on slime tile, not slide into wall
    expect(player.gridX).toBe(6);
    expect(player.gridY).toBe(5);
  });

  it('should stop slide at grid edges', async () => {
    // Move player to edge
    player.gridX = 8;
    player.gridY = 5;
    
    // Place slime tile at (9, 5) - last column
    grid.setTile(9, 5, {
      type: TileType.SLIME,
      x: 9,
      y: 5
    });
    
    // Move player right onto slime at edge
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should stop at edge, not slide out of bounds
    expect(player.gridX).toBe(9);
    expect(player.gridY).toBe(5);
  });

  it('should chain slide when landing on another slime tile', async () => {
    // Place slime tiles at (6, 5) and (7, 5)
    grid.setTile(6, 5, {
      type: TileType.SLIME,
      x: 6,
      y: 5
    });
    grid.setTile(7, 5, {
      type: TileType.SLIME,
      x: 7,
      y: 5
    });
    
    // Move player right onto first slime
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should slide through both slimes to (8,5)
    expect(player.gridX).toBe(8);
    expect(player.gridY).toBe(5);
  });

  it('should activate traps when sliding onto them', async () => {
    // Place slime tile at (6, 5)
    grid.setTile(6, 5, {
      type: TileType.SLIME,
      x: 6,
      y: 5
    });
    
    // Place spike trap at (7, 5)
    grid.setTile(7, 5, {
      type: TileType.SPIKE_TRAP,
      x: 7,
      y: 5
    });
    
    // Move player right onto slime
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should slide onto spike trap
    expect(player.gridX).toBe(7);
    expect(player.gridY).toBe(5);
    // Player should take damage from spike trap
    expect(player.hp).toBe(2);
  });

  it('should collect items when sliding over them', async () => {
    // Place slime tile at (6, 5)
    grid.setTile(6, 5, {
      type: TileType.SLIME,
      x: 6,
      y: 5
    });
    
    // Place key at (7, 5)
    grid.setTile(7, 5, {
      type: TileType.KEY,
      x: 7,
      y: 5
    });
    
    gameState.keysRequired = 1;
    
    // Move player right onto slime
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should slide onto key and collect it
    expect(player.gridX).toBe(7);
    expect(player.gridY).toBe(5);
    expect(player.keysCollected).toBe(1);
  });

  it('should work with vertical movement', async () => {
    // Place slime tile at (5, 6)
    grid.setTile(5, 6, {
      type: TileType.SLIME,
      x: 5,
      y: 6
    });
    
    // Move player down onto slime
    const result = await turnManager.processTurn(player, { dx: 0, dy: 1 }, grid, gameState);
    
    expect(result.success).toBe(true);
    // Player should slide from (5,6) to (5,7)
    expect(player.gridX).toBe(5);
    expect(player.gridY).toBe(7);
  });
});
