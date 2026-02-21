import { describe, it, expect } from 'vitest';
import { Grid, TileType } from './Grid.js';

describe('Grid', () => {
  describe('constructor', () => {
    it('should create a grid with specified dimensions', () => {
      const grid = new Grid(8, 8);
      expect(grid.width).toBe(8);
      expect(grid.height).toBe(8);
      expect(grid.tiles).toHaveLength(8);
      expect(grid.tiles[0]).toHaveLength(8);
    });

    it('should create a grid with different width and height', () => {
      const grid = new Grid(12, 8);
      expect(grid.width).toBe(12);
      expect(grid.height).toBe(8);
      expect(grid.tiles).toHaveLength(8);
      expect(grid.tiles[0]).toHaveLength(12);
    });

    it('should initialize all tiles as FLOOR type', () => {
      const grid = new Grid(4, 4);
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          expect(grid.tiles[y][x].type).toBe(TileType.FLOOR);
        }
      }
    });

    it('should initialize tiles with correct coordinates', () => {
      const grid = new Grid(3, 3);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          expect(grid.tiles[y][x].x).toBe(x);
          expect(grid.tiles[y][x].y).toBe(y);
        }
      }
    });

    it('should throw error for zero width', () => {
      expect(() => new Grid(0, 8)).toThrow('Grid dimensions must be positive');
    });

    it('should throw error for zero height', () => {
      expect(() => new Grid(8, 0)).toThrow('Grid dimensions must be positive');
    });

    it('should throw error for negative dimensions', () => {
      expect(() => new Grid(-5, 8)).toThrow('Grid dimensions must be positive');
      expect(() => new Grid(8, -5)).toThrow('Grid dimensions must be positive');
    });
  });

  describe('getTile', () => {
    it('should return tile at valid coordinates', () => {
      const grid = new Grid(8, 8);
      const tile = grid.getTile(3, 4);
      expect(tile).not.toBeNull();
      expect(tile.x).toBe(3);
      expect(tile.y).toBe(4);
      expect(tile.type).toBe(TileType.FLOOR);
    });

    it('should return tile at (0, 0)', () => {
      const grid = new Grid(8, 8);
      const tile = grid.getTile(0, 0);
      expect(tile).not.toBeNull();
      expect(tile.x).toBe(0);
      expect(tile.y).toBe(0);
    });

    it('should return tile at maximum coordinates', () => {
      const grid = new Grid(8, 8);
      const tile = grid.getTile(7, 7);
      expect(tile).not.toBeNull();
      expect(tile.x).toBe(7);
      expect(tile.y).toBe(7);
    });

    it('should return null for negative x coordinate', () => {
      const grid = new Grid(8, 8);
      expect(grid.getTile(-1, 4)).toBeNull();
    });

    it('should return null for negative y coordinate', () => {
      const grid = new Grid(8, 8);
      expect(grid.getTile(4, -1)).toBeNull();
    });

    it('should return null for x coordinate beyond width', () => {
      const grid = new Grid(8, 8);
      expect(grid.getTile(8, 4)).toBeNull();
    });

    it('should return null for y coordinate beyond height', () => {
      const grid = new Grid(8, 8);
      expect(grid.getTile(4, 8)).toBeNull();
    });
  });

  describe('setTile', () => {
    it('should set tile at valid coordinates', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 0, y: 0 };
      grid.setTile(3, 4, newTile);
      
      const tile = grid.getTile(3, 4);
      expect(tile.type).toBe(TileType.WALL);
      expect(tile.x).toBe(3);
      expect(tile.y).toBe(4);
    });

    it('should update tile coordinates to match position', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 99, y: 99 };
      grid.setTile(2, 3, newTile);
      
      const tile = grid.getTile(2, 3);
      expect(tile.x).toBe(2);
      expect(tile.y).toBe(3);
    });

    it('should set tile with state properties', () => {
      const grid = new Grid(8, 8);
      const crackedTile = {
        type: TileType.CRACKED_FLOOR,
        x: 0,
        y: 0,
        state: { crackLevel: 1 }
      };
      grid.setTile(5, 5, crackedTile);
      
      const tile = grid.getTile(5, 5);
      expect(tile.type).toBe(TileType.CRACKED_FLOOR);
      expect(tile.state.crackLevel).toBe(1);
    });

    it('should throw error for negative x coordinate', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 0, y: 0 };
      expect(() => grid.setTile(-1, 4, newTile)).toThrow('out of bounds');
    });

    it('should throw error for negative y coordinate', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 0, y: 0 };
      expect(() => grid.setTile(4, -1, newTile)).toThrow('out of bounds');
    });

    it('should throw error for x coordinate beyond width', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 0, y: 0 };
      expect(() => grid.setTile(8, 4, newTile)).toThrow('out of bounds');
    });

    it('should throw error for y coordinate beyond height', () => {
      const grid = new Grid(8, 8);
      const newTile = { type: TileType.WALL, x: 0, y: 0 };
      expect(() => grid.setTile(4, 8, newTile)).toThrow('out of bounds');
    });
  });

  describe('isInBounds', () => {
    it('should return true for valid coordinates', () => {
      const grid = new Grid(8, 8);
      expect(grid.isInBounds(3, 4)).toBe(true);
      expect(grid.isInBounds(0, 0)).toBe(true);
      expect(grid.isInBounds(7, 7)).toBe(true);
    });

    it('should return false for negative coordinates', () => {
      const grid = new Grid(8, 8);
      expect(grid.isInBounds(-1, 4)).toBe(false);
      expect(grid.isInBounds(4, -1)).toBe(false);
      expect(grid.isInBounds(-1, -1)).toBe(false);
    });

    it('should return false for coordinates beyond bounds', () => {
      const grid = new Grid(8, 8);
      expect(grid.isInBounds(8, 4)).toBe(false);
      expect(grid.isInBounds(4, 8)).toBe(false);
      expect(grid.isInBounds(10, 10)).toBe(false);
    });
  });

  describe('isWalkable', () => {
    it('should return true for floor tiles', () => {
      const grid = new Grid(8, 8);
      expect(grid.isWalkable(3, 4)).toBe(true);
    });

    it('should return false for wall tiles', () => {
      const grid = new Grid(8, 8);
      grid.setTile(3, 4, { type: TileType.WALL, x: 3, y: 4 });
      expect(grid.isWalkable(3, 4)).toBe(false);
    });

    it('should return false for pit tiles', () => {
      const grid = new Grid(8, 8);
      grid.setTile(3, 4, { type: TileType.PIT, x: 3, y: 4 });
      expect(grid.isWalkable(3, 4)).toBe(false);
    });

    it('should return true for trap tiles (they are walkable)', () => {
      const grid = new Grid(8, 8);
      grid.setTile(3, 4, { type: TileType.SPIKE_TRAP, x: 3, y: 4 });
      expect(grid.isWalkable(3, 4)).toBe(true);
    });

    it('should return true for exit tiles', () => {
      const grid = new Grid(8, 8);
      grid.setTile(3, 4, { type: TileType.EXIT, x: 3, y: 4 });
      expect(grid.isWalkable(3, 4)).toBe(true);
    });

    it('should return true for slime tiles', () => {
      const grid = new Grid(8, 8);
      grid.setTile(3, 4, { type: TileType.SLIME, x: 3, y: 4 });
      expect(grid.isWalkable(3, 4)).toBe(true);
    });

    it('should return false for out of bounds coordinates', () => {
      const grid = new Grid(8, 8);
      expect(grid.isWalkable(-1, 4)).toBe(false);
      expect(grid.isWalkable(8, 4)).toBe(false);
      expect(grid.isWalkable(4, -1)).toBe(false);
      expect(grid.isWalkable(4, 8)).toBe(false);
    });
  });

  describe('getChunks', () => {
    it('should return an array', () => {
      const grid = new Grid(8, 8);
      const chunks = grid.getChunks();
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should return empty array (not yet implemented)', () => {
      const grid = new Grid(12, 12);
      const chunks = grid.getChunks();
      expect(chunks).toHaveLength(0);
    });
  });

  describe('dimension-driven behavior', () => {
    it('should handle small grids (4x4)', () => {
      const grid = new Grid(4, 4);
      expect(grid.width).toBe(4);
      expect(grid.height).toBe(4);
      expect(grid.tiles).toHaveLength(4);
      expect(grid.tiles[0]).toHaveLength(4);
    });

    it('should handle medium grids (12x12)', () => {
      const grid = new Grid(12, 12);
      expect(grid.width).toBe(12);
      expect(grid.height).toBe(12);
      expect(grid.tiles).toHaveLength(12);
      expect(grid.tiles[0]).toHaveLength(12);
    });

    it('should handle large grids (20x20)', () => {
      const grid = new Grid(20, 20);
      expect(grid.width).toBe(20);
      expect(grid.height).toBe(20);
      expect(grid.tiles).toHaveLength(20);
      expect(grid.tiles[0]).toHaveLength(20);
    });

    it('should handle rectangular grids', () => {
      const grid = new Grid(16, 10);
      expect(grid.width).toBe(16);
      expect(grid.height).toBe(10);
      expect(grid.tiles).toHaveLength(10);
      expect(grid.tiles[0]).toHaveLength(16);
    });
  });
});
