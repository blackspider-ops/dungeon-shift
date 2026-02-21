/**
 * Tests for LevelLoader
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LevelLoader } from './LevelLoader.js';
import { TileType } from './Grid.js';

describe('LevelLoader', () => {
  let levelLoader;

  beforeEach(() => {
    levelLoader = new LevelLoader();
  });

  describe('getLevelData', () => {
    it('should return level data for valid level ID', () => {
      const levelData = levelLoader.getLevelData(1);
      expect(levelData).toBeDefined();
      expect(levelData.id).toBe(1);
      expect(levelData.name).toBe('First Steps');
    });

    it('should return null for invalid level ID', () => {
      const levelData = levelLoader.getLevelData(999);
      expect(levelData).toBeNull();
    });
  });

  describe('loadLevel', () => {
    it('should load level 1 successfully', () => {
      const result = levelLoader.loadLevel(1);
      
      expect(result).toBeDefined();
      expect(result.grid).toBeDefined();
      expect(result.levelData).toBeDefined();
      expect(result.entities).toBeDefined();
      
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);
      expect(result.levelData.name).toBe('First Steps');
    });

    it('should throw error for invalid level ID', () => {
      expect(() => levelLoader.loadLevel(999)).toThrow();
    });

    it('should create grid with correct dimensions', () => {
      const result = levelLoader.loadLevel(1);
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);
    });

    it('should populate grid with walls at perimeter', () => {
      const result = levelLoader.loadLevel(1);
      const grid = result.grid;
      
      // Check top wall
      expect(grid.getTile(0, 0).type).toBe(TileType.WALL);
      expect(grid.getTile(7, 0).type).toBe(TileType.WALL);
      
      // Check bottom wall
      expect(grid.getTile(0, 7).type).toBe(TileType.WALL);
      expect(grid.getTile(7, 7).type).toBe(TileType.WALL);
      
      // Check left wall
      expect(grid.getTile(0, 3).type).toBe(TileType.WALL);
      
      // Check right wall
      expect(grid.getTile(7, 3).type).toBe(TileType.WALL);
    });

    it('should place exit at correct position', () => {
      const result = levelLoader.loadLevel(1);
      const grid = result.grid;
      const exitTile = grid.getTile(6, 6);
      
      expect(exitTile.type).toBe(TileType.EXIT);
      expect(exitTile.state.unlocked).toBe(false);
    });

    it('should place items at correct positions', () => {
      const result = levelLoader.loadLevel(1);
      const grid = result.grid;
      const keyTile = grid.getTile(4, 1);
      
      expect(keyTile.type).toBe(TileType.KEY);
    });

    it('should parse game state correctly', () => {
      const result = levelLoader.loadLevel(1);
      
      expect(result.levelData.keysRequired).toBe(1);
      expect(result.levelData.collapseMeter).toBe(30);
      expect(result.levelData.playerStart).toEqual({ x: 1, y: 1 });
    });
  });

  describe('validateLevelData', () => {
    it('should validate correct level data', () => {
      const levelData = levelLoader.getLevelData(1);
      expect(() => levelLoader.validateLevelData(levelData)).not.toThrow();
    });

    it('should throw error for missing grid dimensions', () => {
      const invalidData = { tiles: [] };
      expect(() => levelLoader.validateLevelData(invalidData)).toThrow('missing grid dimensions');
    });

    it('should throw error for missing tiles array', () => {
      const invalidData = { gridWidth: 8, gridHeight: 8 };
      expect(() => levelLoader.validateLevelData(invalidData)).toThrow('missing tiles array');
    });

    it('should throw error for height mismatch', () => {
      const invalidData = {
        gridWidth: 8,
        gridHeight: 8,
        tiles: [['FLOOR'], ['FLOOR']], // Only 2 rows instead of 8
        playerStart: { x: 0, y: 0 },
        exitPosition: { x: 0, y: 0 }
      };
      expect(() => levelLoader.validateLevelData(invalidData)).toThrow('height mismatch');
    });

    it('should throw error for missing playerStart', () => {
      const invalidData = {
        gridWidth: 2,
        gridHeight: 2,
        tiles: [['FLOOR', 'FLOOR'], ['FLOOR', 'FLOOR']],
        exitPosition: { x: 0, y: 0 }
      };
      expect(() => levelLoader.validateLevelData(invalidData)).toThrow('missing playerStart');
    });
  });

  describe('getTotalLevels', () => {
    it('should return correct number of levels', () => {
      const total = levelLoader.getTotalLevels();
      expect(total).toBeGreaterThan(0);
      expect(typeof total).toBe('number');
    });
  });

  describe('levelExists', () => {
    it('should return true for existing level', () => {
      expect(levelLoader.levelExists(1)).toBe(true);
    });

    it('should return false for non-existing level', () => {
      expect(levelLoader.levelExists(999)).toBe(false);
    });
  });

  describe('level 2 (Shifting Rooms)', () => {
    it('should load level 2 with correct dimensions', () => {
      const result = levelLoader.loadLevel(2);
      
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);
      expect(result.levelData.name).toBe('Shifting Rooms');
    });

    it('should have one key', () => {
      const result = levelLoader.loadLevel(2);
      expect(result.levelData.keysRequired).toBe(1);
      expect(result.levelData.items.length).toBe(1);
    });

    it('should have room swap shift pattern', () => {
      const result = levelLoader.loadLevel(2);
      expect(result.levelData.shiftPattern.type).toBe('ROOM_SWAP');
    });
  });

  describe('level 3 (Dangerous Ground)', () => {
    it('should load level 3 with correct dimensions', () => {
      const result = levelLoader.loadLevel(3);
      
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);
      expect(result.levelData.name).toBe('Dangerous Ground');
    });

    it('should have spike traps', () => {
      const result = levelLoader.loadLevel(3);
      expect(result.levelData.traps.length).toBe(2);
      expect(result.levelData.traps[0].type).toBe('SPIKE_TRAP');
    });

    it('should place traps correctly', () => {
      const result = levelLoader.loadLevel(3);
      const grid = result.grid;
      const trapTile1 = grid.getTile(2, 2);
      const trapTile2 = grid.getTile(5, 5);
      
      expect(trapTile1.type).toBe(TileType.SPIKE_TRAP);
      expect(trapTile1.state.active).toBe(false);
      expect(trapTile2.type).toBe(TileType.SPIKE_TRAP);
      expect(trapTile2.state.active).toBe(false);
    });
  });
});
