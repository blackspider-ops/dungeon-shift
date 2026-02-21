import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkManager, ChunkPattern } from './ChunkManager.js';
import { Grid } from './Grid.js';

describe('ChunkManager', () => {
  describe('Constructor and Initialization', () => {
    it('should create ChunkManager with valid grid', () => {
      const grid = new Grid(12, 12);
      const chunkManager = new ChunkManager(grid);
      
      expect(chunkManager).toBeDefined();
      expect(chunkManager.chunks).toHaveLength(4);
    });

    it('should throw error if grid is null', () => {
      expect(() => new ChunkManager(null)).toThrow('ChunkManager requires a valid grid');
    });

    it('should throw error if grid is too small', () => {
      const grid = new Grid(1, 1);
      expect(() => new ChunkManager(grid)).toThrow('Grid is too small to divide into chunks');
    });
  });

  describe('Four Quadrants Division', () => {
    it('should divide 12x12 grid into 4 chunks of 6x6', () => {
      const grid = new Grid(12, 12);
      const chunkManager = new ChunkManager(grid);
      
      expect(chunkManager.chunks).toHaveLength(4);
      
      // Chunk 0: Top-left
      expect(chunkManager.chunks[0]).toEqual({
        id: 0,
        x: 0,
        y: 0,
        width: 6,
        height: 6,
        isAnchored: false,
        anchorTurnsRemaining: 0
      });
      
      // Chunk 1: Top-right
      expect(chunkManager.chunks[1]).toEqual({
        id: 1,
        x: 6,
        y: 0,
        width: 6,
        height: 6,
        isAnchored: false,
        anchorTurnsRemaining: 0
      });
      
      // Chunk 2: Bottom-left
      expect(chunkManager.chunks[2]).toEqual({
        id: 2,
        x: 0,
        y: 6,
        width: 6,
        height: 6,
        isAnchored: false,
        anchorTurnsRemaining: 0
      });
      
      // Chunk 3: Bottom-right
      expect(chunkManager.chunks[3]).toEqual({
        id: 3,
        x: 6,
        y: 6,
        width: 6,
        height: 6,
        isAnchored: false,
        anchorTurnsRemaining: 0
      });
    });

    it('should divide 8x8 grid into 4 chunks of 4x4', () => {
      const grid = new Grid(8, 8);
      const chunkManager = new ChunkManager(grid);
      
      expect(chunkManager.chunks).toHaveLength(4);
      expect(chunkManager.chunks[0].width).toBe(4);
      expect(chunkManager.chunks[0].height).toBe(4);
    });

    it('should handle odd dimensions by using largest even subdivision', () => {
      const grid = new Grid(13, 13);
      const chunkManager = new ChunkManager(grid);
      
      expect(chunkManager.chunks).toHaveLength(4);
      // 13 / 2 = 6.5, floor to 6
      expect(chunkManager.chunks[0].width).toBe(6);
      expect(chunkManager.chunks[0].height).toBe(6);
      // Border tiles (x=12, y=12) are excluded from chunks
    });
  });

  describe('getChunkAt', () => {
    let grid;
    let chunkManager;

    beforeEach(() => {
      grid = new Grid(12, 12);
      chunkManager = new ChunkManager(grid);
    });

    it('should return correct chunk for coordinates in chunk 0', () => {
      const chunk = chunkManager.getChunkAt(0, 0);
      expect(chunk.id).toBe(0);
      
      const chunk2 = chunkManager.getChunkAt(5, 5);
      expect(chunk2.id).toBe(0);
    });

    it('should return correct chunk for coordinates in chunk 1', () => {
      const chunk = chunkManager.getChunkAt(6, 0);
      expect(chunk.id).toBe(1);
      
      const chunk2 = chunkManager.getChunkAt(11, 5);
      expect(chunk2.id).toBe(1);
    });

    it('should return correct chunk for coordinates in chunk 2', () => {
      const chunk = chunkManager.getChunkAt(0, 6);
      expect(chunk.id).toBe(2);
      
      const chunk2 = chunkManager.getChunkAt(5, 11);
      expect(chunk2.id).toBe(2);
    });

    it('should return correct chunk for coordinates in chunk 3', () => {
      const chunk = chunkManager.getChunkAt(6, 6);
      expect(chunk.id).toBe(3);
      
      const chunk2 = chunkManager.getChunkAt(11, 11);
      expect(chunk2.id).toBe(3);
    });

    it('should return null for coordinates outside all chunks', () => {
      const grid = new Grid(13, 13);
      const chunkManager = new ChunkManager(grid);
      
      // Border tile at (12, 12) is outside chunks
      const chunk = chunkManager.getChunkAt(12, 12);
      expect(chunk).toBeNull();
    });
  });

  describe('getChunkById', () => {
    let chunkManager;

    beforeEach(() => {
      const grid = new Grid(12, 12);
      chunkManager = new ChunkManager(grid);
    });

    it('should return chunk with matching ID', () => {
      const chunk = chunkManager.getChunkById(0);
      expect(chunk).toBeDefined();
      expect(chunk.id).toBe(0);
    });

    it('should return null for invalid ID', () => {
      const chunk = chunkManager.getChunkById(99);
      expect(chunk).toBeNull();
    });
  });

  describe('Anchor System', () => {
    let chunkManager;

    beforeEach(() => {
      const grid = new Grid(12, 12);
      chunkManager = new ChunkManager(grid);
    });

    it('should anchor chunk with default duration', () => {
      chunkManager.anchorChunk(0);
      
      const chunk = chunkManager.getChunkById(0);
      expect(chunk.isAnchored).toBe(true);
      expect(chunk.anchorTurnsRemaining).toBe(2);
    });

    it('should anchor chunk with custom duration', () => {
      chunkManager.anchorChunk(1, 5);
      
      const chunk = chunkManager.getChunkById(1);
      expect(chunk.isAnchored).toBe(true);
      expect(chunk.anchorTurnsRemaining).toBe(5);
    });

    it('should decrement anchor duration on update', () => {
      chunkManager.anchorChunk(0, 3);
      
      chunkManager.updateAnchors();
      const chunk = chunkManager.getChunkById(0);
      expect(chunk.anchorTurnsRemaining).toBe(2);
      expect(chunk.isAnchored).toBe(true);
    });

    it('should remove anchor when duration reaches 0', () => {
      chunkManager.anchorChunk(0, 1);
      
      chunkManager.updateAnchors();
      const chunk = chunkManager.getChunkById(0);
      expect(chunk.isAnchored).toBe(false);
      expect(chunk.anchorTurnsRemaining).toBe(0);
    });

    it('should correctly report if chunk can be shifted', () => {
      expect(chunkManager.canShiftChunk(0)).toBe(true);
      
      chunkManager.anchorChunk(0);
      expect(chunkManager.canShiftChunk(0)).toBe(false);
      
      chunkManager.updateAnchors();
      chunkManager.updateAnchors();
      expect(chunkManager.canShiftChunk(0)).toBe(true);
    });
  });

  describe('getChunkTiles', () => {
    let grid;
    let chunkManager;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
    });

    it('should return tiles for a chunk', () => {
      const tiles = chunkManager.getChunkTiles(0);
      
      expect(tiles).toHaveLength(4); // 4 rows
      expect(tiles[0]).toHaveLength(4); // 4 columns
      
      // Check first tile
      expect(tiles[0][0].x).toBe(0);
      expect(tiles[0][0].y).toBe(0);
      
      // Check last tile in chunk
      expect(tiles[3][3].x).toBe(3);
      expect(tiles[3][3].y).toBe(3);
    });

    it('should return empty array for invalid chunk ID', () => {
      const tiles = chunkManager.getChunkTiles(99);
      expect(tiles).toEqual([]);
    });
  });
});
