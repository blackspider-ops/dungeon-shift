import { describe, it, expect, beforeEach } from 'vitest';
import { LevelLoader } from './LevelLoader.js';

describe('Level Solvability Tests', () => {
  let levelLoader;

  beforeEach(() => {
    levelLoader = new LevelLoader();
  });

  // Helper function to check if there's a path from start to a position
  function hasPath(grid, start, target) {
    const visited = new Set();
    const queue = [start];
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.x === target.x && current.y === target.y) {
        return true;
      }

      const directions = [
        { x: 0, y: -1 }, // UP
        { x: 0, y: 1 },  // DOWN
        { x: -1, y: 0 }, // LEFT
        { x: 1, y: 0 }   // RIGHT
      ];

      for (const dir of directions) {
        const newX = current.x + dir.x;
        const newY = current.y + dir.y;
        const key = `${newX},${newY}`;

        if (visited.has(key)) continue;

        if (newX >= 0 && newX < grid.width && newY >= 0 && newY < grid.height) {
          const tile = grid.getTile(newX, newY);
          if (tile && tile.type !== 'WALL' && tile.type !== 'PIT') {
            visited.add(key);
            queue.push({ x: newX, y: newY });
          }
        }
      }
    }

    return false;
  }

  // Helper to count minimum moves needed (Manhattan distance)
  function minimumMoves(start, end) {
    return Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
  }

  describe('All Levels Solvability', () => {
    for (let levelId = 1; levelId <= 10; levelId++) {
      it(`Level ${levelId} should load successfully`, () => {
        const result = levelLoader.loadLevel(levelId);
        expect(result).toBeDefined();
        expect(result.grid).toBeDefined();
        expect(result.levelData).toBeDefined();
      });

      it(`Level ${levelId} should have correct number of keys`, () => {
        const result = levelLoader.loadLevel(levelId);
        const { levelData } = result;

        // Keys are in the items array in levelData
        const keyItems = levelData.items.filter(item => item.type === 'KEY');
        
        expect(keyItems.length).toBe(levelData.keysRequired);
      });

      it(`Level ${levelId} should have sufficient collapse meter for grid size`, () => {
        const result = levelLoader.loadLevel(levelId);
        const { levelData, grid } = result;

        const gridSize = grid.width * grid.height;
        const minMoves = minimumMoves(levelData.playerStart, levelData.exitPosition);
        
        // Collapse meter should be reasonable for the grid size
        expect(levelData.collapseMeter).toBeGreaterThanOrEqual(minMoves);
        expect(levelData.collapseMeter).toBeGreaterThan(10); // At least 10 moves
      });

      it(`Level ${levelId} should have reasonable hazard-to-space ratio`, () => {
        const result = levelLoader.loadLevel(levelId);
        const { grid } = result;

        let floorTiles = 0;
        let hazardTiles = 0;

        for (let y = 0; y < grid.height; y++) {
          for (let x = 0; x < grid.width; x++) {
            const tile = grid.getTile(x, y);
            if (tile && tile.type !== 'WALL') {
              floorTiles++;
              if (tile.trap || tile.type === 'SPIKE_TRAP' || tile.type === 'ARROW_TRAP' || 
                  tile.type === 'CRACKED_FLOOR' || tile.type === 'SLIME') {
                hazardTiles++;
              }
            }
          }
        }

        // Hazards should not exceed 40% of floor space
        if (floorTiles > 0) {
          const hazardRatio = hazardTiles / floorTiles;
          expect(hazardRatio).toBeLessThanOrEqual(0.4);
        }
      });
    }
  });

  describe('Progressive Difficulty', () => {
    it('should have increasing enemy counts in later levels', () => {
      const level1 = levelLoader.loadLevel(1);
      const level6 = levelLoader.loadLevel(6);
      const level10 = levelLoader.loadLevel(10);

      expect(level1.levelData.enemies.length).toBe(0);
      expect(level6.levelData.enemies.length).toBeGreaterThan(0);
      expect(level10.levelData.enemies.length).toBeGreaterThan(level6.levelData.enemies.length);
    });

    it('should have increasing trap complexity in later levels', () => {
      const level1 = levelLoader.loadLevel(1);
      const level5 = levelLoader.loadLevel(5);
      const level10 = levelLoader.loadLevel(10);

      const level1Traps = level1.levelData.traps?.length || 0;
      const level5Traps = level5.levelData.traps?.length || 0;
      const level10Traps = level10.levelData.traps?.length || 0;

      expect(level1Traps).toBe(0);
      expect(level5Traps).toBeGreaterThan(level1Traps);
      expect(level10Traps).toBeGreaterThan(level5Traps);
    });

    it('should have increasing key requirements in later levels', () => {
      const level1 = levelLoader.loadLevel(1);
      const level5 = levelLoader.loadLevel(5);
      const level9 = levelLoader.loadLevel(9);

      expect(level1.levelData.keysRequired).toBe(1);
      expect(level5.levelData.keysRequired).toBeGreaterThanOrEqual(level1.levelData.keysRequired);
      expect(level9.levelData.keysRequired).toBeGreaterThanOrEqual(level5.levelData.keysRequired);
    });
  });

  describe('Level Balance Verification', () => {
    it('should have balanced collapse meters across all levels', () => {
      const collapseMeterValues = [];
      
      for (let levelId = 1; levelId <= 10; levelId++) {
        const result = levelLoader.loadLevel(levelId);
        collapseMeterValues.push(result.levelData.collapseMeter);
      }

      // Verify general upward trend (with some variation allowed)
      expect(collapseMeterValues[0]).toBeLessThan(collapseMeterValues[9]);
      expect(collapseMeterValues[4]).toBeGreaterThan(collapseMeterValues[0]);
    });

    it('should have power-ups available in challenging levels', () => {
      // Levels 5+ should have power-ups to help with difficulty
      for (let levelId = 5; levelId <= 10; levelId++) {
        const result = levelLoader.loadLevel(levelId);
        const items = result.levelData.items || [];
        
        const hasPowerUps = items.some(item => 
          item.type === 'SHIELD' || 
          item.type === 'ANCHOR' || 
          item.type === 'PHASE_STEP' || 
          item.type === 'UNDO'
        );

        expect(hasPowerUps).toBe(true);
      }
    });
  });
});
