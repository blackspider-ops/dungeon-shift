import { describe, it, expect, beforeEach } from 'vitest';
import { Grid } from './Grid.js';
import { ChunkManager } from './ChunkManager.js';

describe('ChunkManager - Anchor System', () => {
  let grid;
  let chunkManager;

  beforeEach(() => {
    grid = new Grid(12, 12);
    chunkManager = new ChunkManager(grid);
  });

  describe('Anchor Placement', () => {
    it('should anchor a chunk for specified duration', () => {
      chunkManager.anchorChunk(0, 2);
      
      const chunk = chunkManager.getChunkById(0);
      expect(chunk.isAnchored).toBe(true);
      expect(chunk.anchorTurnsRemaining).toBe(2);
    });

    it('should use default duration of 2 turns', () => {
      chunkManager.anchorChunk(1);
      
      const chunk = chunkManager.getChunkById(1);
      expect(chunk.isAnchored).toBe(true);
      expect(chunk.anchorTurnsRemaining).toBe(2);
    });

    it('should handle invalid chunk ID gracefully', () => {
      chunkManager.anchorChunk(99, 2);
      
      // Should not throw error, just log warning
      const chunk = chunkManager.getChunkById(99);
      expect(chunk).toBeNull();
    });
  });

  describe('Anchor Duration', () => {
    it('should decrement anchor duration each turn', () => {
      chunkManager.anchorChunk(0, 3);
      
      let chunk = chunkManager.getChunkById(0);
      expect(chunk.anchorTurnsRemaining).toBe(3);
      
      chunkManager.updateAnchors();
      chunk = chunkManager.getChunkById(0);
      expect(chunk.anchorTurnsRemaining).toBe(2);
      expect(chunk.isAnchored).toBe(true);
      
      chunkManager.updateAnchors();
      chunk = chunkManager.getChunkById(0);
      expect(chunk.anchorTurnsRemaining).toBe(1);
      expect(chunk.isAnchored).toBe(true);
    });

    it('should remove anchor when duration reaches 0', () => {
      chunkManager.anchorChunk(0, 1);
      
      let chunk = chunkManager.getChunkById(0);
      expect(chunk.isAnchored).toBe(true);
      
      chunkManager.updateAnchors();
      chunk = chunkManager.getChunkById(0);
      expect(chunk.isAnchored).toBe(false);
      expect(chunk.anchorTurnsRemaining).toBe(0);
    });

    it('should handle multiple anchored chunks', () => {
      chunkManager.anchorChunk(0, 2);
      chunkManager.anchorChunk(2, 3);
      
      let chunk0 = chunkManager.getChunkById(0);
      let chunk2 = chunkManager.getChunkById(2);
      
      expect(chunk0.isAnchored).toBe(true);
      expect(chunk2.isAnchored).toBe(true);
      
      chunkManager.updateAnchors();
      
      chunk0 = chunkManager.getChunkById(0);
      chunk2 = chunkManager.getChunkById(2);
      
      expect(chunk0.anchorTurnsRemaining).toBe(1);
      expect(chunk2.anchorTurnsRemaining).toBe(2);
      
      chunkManager.updateAnchors();
      
      chunk0 = chunkManager.getChunkById(0);
      chunk2 = chunkManager.getChunkById(2);
      
      expect(chunk0.isAnchored).toBe(false);
      expect(chunk2.isAnchored).toBe(true);
    });
  });

  describe('Shift Prevention', () => {
    it('should prevent shifting of anchored chunk', () => {
      chunkManager.anchorChunk(0, 2);
      
      expect(chunkManager.canShiftChunk(0)).toBe(false);
      expect(chunkManager.canShiftChunk(1)).toBe(true);
    });

    it('should allow shifting after anchor expires', () => {
      chunkManager.anchorChunk(0, 1);
      
      expect(chunkManager.canShiftChunk(0)).toBe(false);
      
      chunkManager.updateAnchors();
      
      expect(chunkManager.canShiftChunk(0)).toBe(true);
    });
  });
});
