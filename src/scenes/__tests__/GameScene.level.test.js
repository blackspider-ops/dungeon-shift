/**
 * Integration tests for GameScene level loading
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LevelLoader } from '../../core/LevelLoader.js';

describe('GameScene Level Loading Integration', () => {
  let levelLoader;

  beforeEach(() => {
    levelLoader = new LevelLoader();
  });

  describe('Level 1 Integration', () => {
    it('should load level 1 and create valid game state', () => {
      const result = levelLoader.loadLevel(1);

      // Verify grid
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);

      // Verify level data
      expect(result.levelData.name).toBe('First Steps');
      expect(result.levelData.keysRequired).toBe(1);
      expect(result.levelData.collapseMeter).toBe(30);

      // Verify player start position
      expect(result.levelData.playerStart).toEqual({ x: 1, y: 1 });

      // Verify exit position
      expect(result.levelData.exitPosition).toEqual({ x: 6, y: 6 });
    });

    it('should have key placed on grid', () => {
      const result = levelLoader.loadLevel(1);
      const keyTile = result.grid.getTile(4, 1);
      
      expect(keyTile.type).toBe('KEY');
    });

    it('should have exit placed on grid', () => {
      const result = levelLoader.loadLevel(1);
      const exitTile = result.grid.getTile(6, 6);
      
      expect(exitTile.type).toBe('EXIT');
      expect(exitTile.state.unlocked).toBe(false);
    });
  });

  describe('Level 2 Integration', () => {
    it('should load level 2 and create valid game state', () => {
      const result = levelLoader.loadLevel(2);

      // Verify grid
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);

      // Verify level data
      expect(result.levelData.name).toBe('Shifting Rooms');
      expect(result.levelData.keysRequired).toBe(1);
      expect(result.levelData.collapseMeter).toBe(28);

      // Verify player start position
      expect(result.levelData.playerStart).toEqual({ x: 1, y: 1 });

      // Verify exit position
      expect(result.levelData.exitPosition).toEqual({ x: 6, y: 6 });
    });

    it('should have key placed on grid', () => {
      const result = levelLoader.loadLevel(2);
      
      const keyTile = result.grid.getTile(6, 1);
      
      expect(keyTile.type).toBe('KEY');
    });

    it('should have room swap shift pattern', () => {
      const result = levelLoader.loadLevel(2);
      
      expect(result.levelData.shiftPattern.type).toBe('ROOM_SWAP');
    });
  });

  describe('Level 3 Integration', () => {
    it('should load level 3 and create valid game state', () => {
      const result = levelLoader.loadLevel(3);

      // Verify grid
      expect(result.grid.width).toBe(8);
      expect(result.grid.height).toBe(8);

      // Verify level data
      expect(result.levelData.name).toBe('Dangerous Ground');
      expect(result.levelData.keysRequired).toBe(1);
      expect(result.levelData.collapseMeter).toBe(30);
    });

    it('should have spike traps placed on grid', () => {
      const result = levelLoader.loadLevel(3);
      const trap1Tile = result.grid.getTile(2, 2);
      const trap2Tile = result.grid.getTile(5, 5);
      
      expect(trap1Tile.type).toBe('SPIKE_TRAP');
      expect(trap1Tile.state.active).toBe(false);
      expect(trap2Tile.type).toBe('SPIKE_TRAP');
      expect(trap2Tile.state.active).toBe(false);
    });
  });

  describe('Level Transition Logic', () => {
    it('should support transitioning from level 1 to level 2', () => {
      // Load level 1
      const level1 = levelLoader.loadLevel(1);
      expect(level1.levelData.id).toBe(1);

      // Check next level exists
      expect(levelLoader.levelExists(2)).toBe(true);

      // Load level 2
      const level2 = levelLoader.loadLevel(2);
      expect(level2.levelData.id).toBe(2);
    });

    it('should handle level restart by reloading same level', () => {
      const level1First = levelLoader.loadLevel(1);
      const level1Second = levelLoader.loadLevel(1);

      // Both should have same structure
      expect(level1First.levelData.id).toBe(level1Second.levelData.id);
      expect(level1First.grid.width).toBe(level1Second.grid.width);
      expect(level1First.grid.height).toBe(level1Second.grid.height);
    });
  });

  describe('Level Data Consistency', () => {
    it('should have consistent grid dimensions across loads', () => {
      const result1 = levelLoader.loadLevel(1);
      const result2 = levelLoader.loadLevel(1);

      expect(result1.grid.width).toBe(result2.grid.width);
      expect(result1.grid.height).toBe(result2.grid.height);
    });

    it('should have consistent tile layout across loads', () => {
      const result1 = levelLoader.loadLevel(1);
      const result2 = levelLoader.loadLevel(1);

      // Check a few key tiles
      expect(result1.grid.getTile(0, 0).type).toBe(result2.grid.getTile(0, 0).type);
      expect(result1.grid.getTile(1, 1).type).toBe(result2.grid.getTile(1, 1).type);
      expect(result1.grid.getTile(6, 6).type).toBe(result2.grid.getTile(6, 6).type);
    });
  });
});
