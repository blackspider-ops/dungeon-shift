/**
 * Tests for door unlocking functionality in TurnManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Door System', () => {
  let turnManager;
  let grid;
  let player;
  let gameState;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(10, 10);
    
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
      keysRequired: 1,
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

  it('should unlock doors when player collects a key', () => {
    // Place a locked door at (5, 5)
    grid.setTile(5, 5, { type: TileType.DOOR_LOCKED, x: 5, y: 5 });
    
    // Place a key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Verify door is locked and not walkable
    expect(grid.getTile(5, 5).type).toBe(TileType.DOOR_LOCKED);
    expect(grid.isWalkable(5, 5)).toBe(false);
    
    // Move player to key tile
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    // Door should now be unlocked
    const doorTile = grid.getTile(5, 5);
    expect(doorTile.type).toBe(TileType.DOOR_UNLOCKED);
    expect(grid.isWalkable(5, 5)).toBe(true);
  });

  it('should unlock multiple doors when player collects a key', () => {
    // Place multiple locked doors
    grid.setTile(5, 5, { type: TileType.DOOR_LOCKED, x: 5, y: 5 });
    grid.setTile(6, 6, { type: TileType.DOOR_LOCKED, x: 6, y: 6 });
    grid.setTile(7, 7, { type: TileType.DOOR_LOCKED, x: 7, y: 7 });
    
    // Place a key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Move player to key tile
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    // All doors should be unlocked
    expect(grid.getTile(5, 5).type).toBe(TileType.DOOR_UNLOCKED);
    expect(grid.getTile(6, 6).type).toBe(TileType.DOOR_UNLOCKED);
    expect(grid.getTile(7, 7).type).toBe(TileType.DOOR_UNLOCKED);
  });

  it('should allow player to walk through unlocked doors', async () => {
    // Place a locked door at (4, 2)
    grid.setTile(4, 2, { type: TileType.DOOR_LOCKED, x: 4, y: 2 });
    
    // Place a key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Move player to key tile (unlocks door)
    await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    expect(player.gridX).toBe(3);
    expect(player.gridY).toBe(2);
    
    // Now move player through the unlocked door
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    // Move should succeed
    expect(result.success).toBe(true);
    expect(player.gridX).toBe(4);
    expect(player.gridY).toBe(2);
  });

  it('should not unlock doors if player does not collect a key', () => {
    // Place a locked door at (5, 5)
    grid.setTile(5, 5, { type: TileType.DOOR_LOCKED, x: 5, y: 5 });
    
    // Move player without collecting a key
    turnManager.processTurn(player, { dx: 0, dy: 1 }, grid, gameState);
    
    // Door should still be locked
    expect(grid.getTile(5, 5).type).toBe(TileType.DOOR_LOCKED);
    expect(grid.isWalkable(5, 5)).toBe(false);
  });

  it('should block player movement into locked doors', async () => {
    // Place a locked door at (3, 2)
    grid.setTile(3, 2, { type: TileType.DOOR_LOCKED, x: 3, y: 2 });
    
    // Try to move player into locked door
    const result = await turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    // Move should fail
    expect(result.success).toBe(false);
    expect(player.gridX).toBe(2);
    expect(player.gridY).toBe(2);
  });

  it('should unlock doors before unlocking exit', () => {
    // Place a locked door and exit
    grid.setTile(5, 5, { type: TileType.DOOR_LOCKED, x: 5, y: 5 });
    grid.setTile(8, 8, { type: TileType.EXIT, x: 8, y: 8, state: { unlocked: false } });
    
    // Place a key at (3, 2)
    grid.setTile(3, 2, { type: TileType.KEY, x: 3, y: 2 });
    
    // Move player to key tile
    turnManager.processTurn(player, { dx: 1, dy: 0 }, grid, gameState);
    
    // Both door and exit should be unlocked
    expect(grid.getTile(5, 5).type).toBe(TileType.DOOR_UNLOCKED);
    expect(grid.getTile(8, 8).type).toBe(TileType.EXIT_UNLOCKED);
    expect(gameState.exitUnlocked).toBe(true);
  });
});
