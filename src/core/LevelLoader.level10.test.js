import { describe, it, expect, beforeEach } from 'vitest';
import { LevelLoader } from './LevelLoader.js';

describe('LevelLoader - Level 10 (Final Level)', () => {
  let levelLoader;

  beforeEach(() => {
    levelLoader = new LevelLoader();
  });

  describe('Level 10 Loading', () => {
    it('should load level 10 with correct dimensions', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result).toBeDefined();
      expect(result.grid.width).toBe(16);
      expect(result.grid.height).toBe(16);
    });

    it('should have 3 keys required', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.keysRequired).toBe(3);
    });

    it('should have 55 moves collapse meter', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.collapseMeter).toBe(55);
    });

    it('should have all 3 enemy types', () => {
      const result = levelLoader.loadLevel(10);
      
      const guards = result.entities.enemies.filter(e => e.type === 'GUARD');
      const chasers = result.entities.enemies.filter(e => e.type === 'CHASER');
      const patrollers = result.entities.enemies.filter(e => e.type === 'PATROLLER');
      
      expect(guards.length).toBeGreaterThan(0);
      expect(chasers.length).toBeGreaterThan(0);
      expect(patrollers.length).toBeGreaterThan(0);
      expect(result.entities.enemies.length).toBe(9);
    });

    it('should have all 4 trap types', () => {
      const result = levelLoader.loadLevel(10);
      const grid = result.grid;
      
      let hasSpikes = false;
      let hasArrows = false;
      let hasSlime = false;
      let hasCracked = false;
      
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const tile = grid.getTile(x, y);
          if (tile.type === 'SPIKE_TRAP') hasSpikes = true;
          if (tile.type === 'ARROW_TRAP') hasArrows = true;
          if (tile.type === 'SLIME') hasSlime = true;
          if (tile.type === 'CRACKED_FLOOR') hasCracked = true;
        }
      }
      
      expect(hasSpikes).toBe(true);
      expect(hasArrows).toBe(true);
      expect(hasSlime).toBe(true);
      expect(hasCracked).toBe(true);
    });

    it('should have all 4 power-up types', () => {
      const result = levelLoader.loadLevel(10);
      const grid = result.grid;
      
      let hasShield = false;
      let hasAnchor = false;
      let hasPhaseStep = false;
      let hasUndo = false;
      
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const tile = grid.getTile(x, y);
          if (tile.type === 'SHIELD') hasShield = true;
          if (tile.type === 'ANCHOR') hasAnchor = true;
          if (tile.type === 'PHASE_STEP') hasPhaseStep = true;
          if (tile.type === 'UNDO') hasUndo = true;
        }
      }
      
      expect(hasShield).toBe(true);
      expect(hasAnchor).toBe(true);
      expect(hasPhaseStep).toBe(true);
      expect(hasUndo).toBe(true);
    });

    it('should have 3 keys placed on the grid', () => {
      const result = levelLoader.loadLevel(10);
      const grid = result.grid;
      
      let keyCount = 0;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const tile = grid.getTile(x, y);
          if (tile.type === 'KEY') keyCount++;
        }
      }
      
      expect(keyCount).toBe(3);
    });

    it('should have player start and exit positions', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.playerStart).toEqual({ x: 1, y: 1 });
      expect(result.levelData.exitPosition).toEqual({ x: 14, y: 14 });
    });

    it('should have shift pattern defined', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.shiftPattern).toBeDefined();
      expect(result.levelData.shiftPattern.type).toBe('ROOM_SWAP');
      expect(result.levelData.shiftPattern.sequence).toBeDefined();
      expect(result.levelData.shiftPattern.sequence.length).toBeGreaterThan(0);
    });

    it('should have switches for pattern control', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.switches).toBeDefined();
      expect(result.levelData.switches.length).toBeGreaterThan(0);
    });

    it('should have correct level name', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.name).toBe('The Final Shift');
    });

    it('should have tutorial message', () => {
      const result = levelLoader.loadLevel(10);
      
      expect(result.levelData.tutorial).toBeDefined();
      expect(result.levelData.tutorial).toContain('final');
    });
  });

  describe('Level 10 Balance', () => {
    it('should have reasonable enemy density', () => {
      const result = levelLoader.loadLevel(10);
      
      const totalTiles = 16 * 16;
      const enemyDensity = result.entities.enemies.length / totalTiles;
      
      // Should have less than 5% enemy density
      expect(enemyDensity).toBeLessThan(0.05);
      expect(enemyDensity).toBeGreaterThan(0.02);
    });

    it('should have reasonable trap density', () => {
      const result = levelLoader.loadLevel(10);
      const grid = result.grid;
      
      let trapCount = 0;
      for (let y = 0; y < grid.height; y++) {
        for (let x = 0; x < grid.width; x++) {
          const tile = grid.getTile(x, y);
          if (tile.type === 'SPIKE_TRAP' || tile.type === 'ARROW_TRAP' || 
              tile.type === 'SLIME' || tile.type === 'CRACKED_FLOOR') {
            trapCount++;
          }
        }
      }
      
      const totalTiles = 16 * 16;
      const trapDensity = trapCount / totalTiles;
      
      // Should have less than 15% trap density
      expect(trapDensity).toBeLessThan(0.15);
      expect(trapDensity).toBeGreaterThan(0.05);
    });

    it('should have sufficient moves for grid size', () => {
      const result = levelLoader.loadLevel(10);
      
      const gridSize = 16 * 16;
      const movesPerTile = result.levelData.collapseMeter / gridSize;
      
      // Should have at least 0.2 moves per tile
      expect(movesPerTile).toBeGreaterThan(0.2);
    });
  });
});
