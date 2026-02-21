import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftSystem } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { Grid, TileType } from './Grid.js';
import { TurnManager } from './TurnManager.js';

describe('ShiftSystem Integration', () => {
  describe('Entity movement during shift', () => {
    let grid;
    let chunkManager;
    let shiftSystem;
    let turnManager;
    let player;
    let gameState;

    beforeEach(() => {
      // Create 8x8 grid
      grid = new Grid(8, 8);
      
      // Create chunk manager
      chunkManager = new ChunkManager(grid);
      
      // Create shift system with room swap pattern
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      // Create turn manager
      turnManager = new TurnManager(20);
      
      // Create mock player in chunk 0 (top-left)
      player = {
        gridX: 1,
        gridY: 1,
        hp: 3,
        maxHp: 3,
        keysCollected: 0,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      // Create game state with shift system
      gameState = {
        shiftSystem,
        player,
        enemies: [],
        keysRequired: 0
      };
    });

    it('should move player with chunk during swap', () => {
      // Player starts at (1, 1) in chunk 0
      expect(player.gridX).toBe(1);
      expect(player.gridY).toBe(1);
      
      // Execute shift (first operation swaps chunk 0 ↔ chunk 3)
      const result = shiftSystem.executeShift(grid, [player]);
      
      expect(result).toBe(true);
      
      // Player should now be at (5, 5) in chunk 3
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
    });

    it('should move multiple entities during swap', () => {
      // Create enemy in chunk 3
      const enemy = {
        gridX: 6,
        gridY: 6,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      gameState.enemies = [enemy];
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [player, enemy]);
      
      // Player moved from chunk 0 to chunk 3
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
      
      // Enemy moved from chunk 3 to chunk 0
      expect(enemy.gridX).toBe(2);
      expect(enemy.gridY).toBe(2);
    });

    it('should not move entities in non-swapping chunks', () => {
      // Create enemy in chunk 1 (not being swapped in first operation)
      const enemy = {
        gridX: 4,
        gridY: 1,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      // Execute shift (swaps chunk 0 ↔ chunk 3, not chunk 1)
      shiftSystem.executeShift(grid, [player, enemy]);
      
      // Player moved (was in chunk 0)
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
      
      // Enemy did not move (was in chunk 1)
      expect(enemy.gridX).toBe(4);
      expect(enemy.gridY).toBe(1);
    });

    it('should integrate with TurnManager', () => {
      // Execute shift through TurnManager
      const result = turnManager.executeShift(grid, gameState);
      
      expect(result).toBe(true);
      
      // Player should have moved with chunk
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
    });

    it('should preserve entity offset within chunk', () => {
      // Place player at different position in chunk 0
      player.gridX = 3;
      player.gridY = 2;
      
      // Execute shift
      shiftSystem.executeShift(grid, [player]);
      
      // Player should maintain offset (3,2) relative to chunk origin
      // Chunk 0 origin (0,0) → Chunk 3 origin (4,4)
      // Offset (3,2) → New position (7,6)
      expect(player.gridX).toBe(7);
      expect(player.gridY).toBe(6);
    });

    it('should handle multiple swaps in sequence', () => {
      // Player starts at (1, 1) in chunk 0
      expect(player.gridX).toBe(1);
      expect(player.gridY).toBe(1);
      
      // First swap: chunk 0 ↔ chunk 3
      shiftSystem.executeShift(grid, [player]);
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
      
      // Second swap: chunk 1 ↔ chunk 2 (player not affected)
      shiftSystem.executeShift(grid, [player]);
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
      
      // Third swap: chunk 0 ↔ chunk 1 (player not affected, in chunk 3)
      shiftSystem.executeShift(grid, [player]);
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
      
      // Fourth swap: chunk 2 ↔ chunk 3 (player affected)
      shiftSystem.executeShift(grid, [player]);
      expect(player.gridX).toBe(1);
      expect(player.gridY).toBe(5);
    });
  });

  describe('Tiles and entities move together', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      // Set up distinct tiles in chunks
      // Chunk 0: WALL
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          grid.setTile(x, y, { type: TileType.WALL, x, y });
        }
      }
      
      // Chunk 3: FLOOR
      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
          grid.setTile(x, y, { type: TileType.FLOOR, x, y });
        }
      }
    });

    it('should swap tiles and move entities together', () => {
      const player = {
        gridX: 1,
        gridY: 1,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      // Before swap: player at (1,1) on WALL tile
      expect(grid.getTile(1, 1).type).toBe(TileType.WALL);
      expect(player.gridX).toBe(1);
      expect(player.gridY).toBe(1);
      
      // Execute swap
      shiftSystem.executeShift(grid, [player]);
      
      // After swap: 
      // - Chunk 0 now has FLOOR tiles
      // - Player moved to (5,5)
      // - Position (5,5) now has WALL tiles (from old chunk 0)
      expect(grid.getTile(1, 1).type).toBe(TileType.FLOOR);
      expect(grid.getTile(5, 5).type).toBe(TileType.WALL);
      expect(player.gridX).toBe(5);
      expect(player.gridY).toBe(5);
    });
  });
});
