/**
 * Tests for key collection functionality in TurnManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Key Collection', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(8, 8);
    
    // Create player
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
      }
    };
    
    // Create game state
    gameState = {
      keysRequired: 2,
      exitUnlocked: false,
      enemies: [],
      items: []
    };
    
    // Add walls around perimeter
    for (let x = 0; x < grid.width; x++) {
      grid.setTile(x, 0, { type: TileType.WALL, x, y: 0 });
      grid.setTile(x, grid.height - 1, { type: TileType.WALL, x, y: grid.height - 1 });
    }
    for (let y = 0; y < grid.height; y++) {
      grid.setTile(0, y, { type: TileType.WALL, x: 0, y });
      grid.setTile(grid.width - 1, y, { type: TileType.WALL, x: grid.width - 1, y });
    }
  });

  it('should collect key when player moves onto key tile', () => {
    // Place a key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Move player to key tile
    const direction = { dx: 1, dy: 0 };
    turnManager.processTurn(player, direction, grid, gameState);
    
    // Player should have collected the key
    expect(player.keysCollected).toBe(1);
    
    // Key tile should be converted to floor
    const tile = grid.getTile(3, 2);
    expect(tile.type).toBe(TileType.FLOOR);
  });

  it('should collect multiple keys', () => {
    // Place first key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Move player to first key
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    expect(player.keysCollected).toBe(1);
    
    // Place second key at (4, 2)
    grid.setTile(4, 2, { type: TileType.KEY, x: 4, y: 2 });
    
    // Move player to second key
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    expect(player.keysCollected).toBe(2);
  });

  it('should unlock exit when all keys are collected', () => {
    // Place exit at (6, 6)
    grid.setTile(6, 6, { type: TileType.EXIT, x: 6, y: 6, state: { unlocked: false } });
    
    // Place keys
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    grid.setTile(4, 2, { type: TileType.KEY, x: 4, y: 2 });
    
    // Collect first key
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    expect(gameState.exitUnlocked).toBe(false);
    
    // Collect second key
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    expect(gameState.exitUnlocked).toBe(true);
    
    // Exit tile should be unlocked
    const exitTile = grid.getTile(6, 6);
    expect(exitTile.type).toBe(TileType.EXIT_UNLOCKED);
  });

  it('should not collect key if player does not move onto key tile', () => {
    // Place a key at (4, 2)
    grid.setTile(4, 2, { type: TileType.KEY, x: 4, y: 2 });
    
    // Move player away from key
    turnManager.processTurn(player, { dx: 0, dy: 1 }, grid, gameState);
    
    // Player should not have collected the key
    expect(player.keysCollected).toBe(0);
    
    // Key should still be on the grid
    const tile = grid.getTile(4, 2);
    expect(tile.type).toBe(TileType.KEY);
  });
});
