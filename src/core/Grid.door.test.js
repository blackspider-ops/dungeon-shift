/**
 * Tests for door functionality in Grid
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Grid, TileType } from './Grid.js';

describe('Grid - Door System', () => {
  let grid;

  beforeEach(() => {
    grid = new Grid(8, 8);
  });

  it('should block movement through locked doors', () => {
    // Place a locked door at (3, 3)
    grid.setTile(3, 3, { type: TileType.DOOR_LOCKED, x: 3, y: 3 });
    
    // Locked door should not be walkable
    expect(grid.isWalkable(3, 3)).toBe(false);
  });

  it('should allow movement through unlocked doors', () => {
    // Place an unlocked door at (3, 3)
    grid.setTile(3, 3, { type: TileType.DOOR_UNLOCKED, x: 3, y: 3 });
    
    // Unlocked door should be walkable
    expect(grid.isWalkable(3, 3)).toBe(true);
  });

  it('should allow movement through floor tiles', () => {
    // Floor tile should be walkable
    expect(grid.isWalkable(3, 3)).toBe(true);
  });

  it('should block movement through walls', () => {
    // Place a wall at (3, 3)
    grid.setTile(3, 3, { type: TileType.WALL, x: 3, y: 3 });
    
    // Wall should not be walkable
    expect(grid.isWalkable(3, 3)).toBe(false);
  });

  it('should block movement through pits', () => {
    // Place a pit at (3, 3)
    grid.setTile(3, 3, { type: TileType.PIT, x: 3, y: 3 });
    
    // Pit should not be walkable
    expect(grid.isWalkable(3, 3)).toBe(false);
  });
});
