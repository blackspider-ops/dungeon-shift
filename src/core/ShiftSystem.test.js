import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftSystem, ShiftType } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { Grid, TileType } from './Grid.js';

describe('ShiftSystem', () => {
  describe('Constructor', () => {
    it('should create ShiftSystem with valid pattern and chunkManager', () => {
      const grid = new Grid(12, 12);
      const chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      const shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      expect(shiftSystem).toBeDefined();
      expect(shiftSystem.pattern).toBe(pattern);
      expect(shiftSystem.chunkManager).toBe(chunkManager);
    });

    it('should throw error if pattern is null', () => {
      const grid = new Grid(12, 12);
      const chunkManager = new ChunkManager(grid);
      
      expect(() => new ShiftSystem(null, chunkManager)).toThrow('ShiftSystem requires a valid pattern');
    });

    it('should throw error if chunkManager is null', () => {
      const pattern = ShiftSystem.createRoomSwapPattern();
      
      expect(() => new ShiftSystem(pattern, null)).toThrow('ShiftSystem requires a valid chunkManager');
    });
  });

  describe('createRoomSwapPattern', () => {
    it('should create pattern with 4 swap operations', () => {
      const pattern = ShiftSystem.createRoomSwapPattern();
      
      expect(pattern.type).toBe(ShiftType.ROOM_SWAP);
      expect(pattern.currentIndex).toBe(0);
      expect(pattern.sequence).toHaveLength(4);
    });

    it('should have correct swap sequence', () => {
      const pattern = ShiftSystem.createRoomSwapPattern();
      
      // Operation 0: Swap 0 ↔ 3 (diagonal)
      expect(pattern.sequence[0].params).toEqual({ chunkA: 0, chunkB: 3 });
      
      // Operation 1: Swap 1 ↔ 2 (diagonal)
      expect(pattern.sequence[1].params).toEqual({ chunkA: 1, chunkB: 2 });
      
      // Operation 2: Swap 0 ↔ 1 (horizontal)
      expect(pattern.sequence[2].params).toEqual({ chunkA: 0, chunkB: 1 });
      
      // Operation 3: Swap 2 ↔ 3 (horizontal)
      expect(pattern.sequence[3].params).toEqual({ chunkA: 2, chunkB: 3 });
    });
  });

  describe('getNextOperation', () => {
    let shiftSystem;

    beforeEach(() => {
      const grid = new Grid(12, 12);
      const chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should return first operation initially', () => {
      const operation = shiftSystem.getNextOperation();
      
      expect(operation.type).toBe(ShiftType.ROOM_SWAP);
      expect(operation.params).toEqual({ chunkA: 0, chunkB: 3 });
    });

    it('should cycle through operations', () => {
      // Execute first operation
      shiftSystem.pattern.currentIndex = 1;
      const op1 = shiftSystem.getNextOperation();
      expect(op1.params).toEqual({ chunkA: 1, chunkB: 2 });
      
      // Execute second operation
      shiftSystem.pattern.currentIndex = 2;
      const op2 = shiftSystem.getNextOperation();
      expect(op2.params).toEqual({ chunkA: 0, chunkB: 1 });
    });
  });

  describe('swapChunks', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      // Set up distinct tiles in each chunk for testing
      // Chunk 0 (top-left): WALL tiles
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          grid.setTile(x, y, { type: TileType.WALL, x, y });
        }
      }
      
      // Chunk 3 (bottom-right): SPIKE_TRAP tiles
      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
          grid.setTile(x, y, { type: TileType.SPIKE_TRAP, x, y });
        }
      }
    });

    it('should swap tiles between two chunks', () => {
      // Before swap: chunk 0 has walls, chunk 3 has spike traps
      expect(grid.getTile(0, 0).type).toBe(TileType.WALL);
      expect(grid.getTile(4, 4).type).toBe(TileType.SPIKE_TRAP);
      
      // Swap chunks 0 and 3
      shiftSystem.swapChunks(grid, { chunkA: 0, chunkB: 3 });
      
      // After swap: chunk 0 has spike traps, chunk 3 has walls
      expect(grid.getTile(0, 0).type).toBe(TileType.SPIKE_TRAP);
      expect(grid.getTile(4, 4).type).toBe(TileType.WALL);
    });

    it('should update tile coordinates after swap', () => {
      shiftSystem.swapChunks(grid, { chunkA: 0, chunkB: 3 });
      
      // Check that tile coordinates match their new positions
      const tile00 = grid.getTile(0, 0);
      expect(tile00.x).toBe(0);
      expect(tile00.y).toBe(0);
      
      const tile44 = grid.getTile(4, 4);
      expect(tile44.x).toBe(4);
      expect(tile44.y).toBe(4);
    });

    it('should not swap if chunk A is anchored', () => {
      chunkManager.anchorChunk(0);
      
      // Store original tile type
      const originalType = grid.getTile(0, 0).type;
      
      shiftSystem.swapChunks(grid, { chunkA: 0, chunkB: 3 });
      
      // Tiles should not have swapped
      expect(grid.getTile(0, 0).type).toBe(originalType);
    });

    it('should not swap if chunk B is anchored', () => {
      chunkManager.anchorChunk(3);
      
      // Store original tile type
      const originalType = grid.getTile(0, 0).type;
      
      shiftSystem.swapChunks(grid, { chunkA: 0, chunkB: 3 });
      
      // Tiles should not have swapped
      expect(grid.getTile(0, 0).type).toBe(originalType);
    });
  });

  describe('executeShift', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should execute shift and advance pattern index', () => {
      expect(shiftSystem.pattern.currentIndex).toBe(0);
      
      const result = shiftSystem.executeShift(grid);
      
      expect(result).toBe(true);
      expect(shiftSystem.pattern.currentIndex).toBe(1);
    });

    it('should cycle pattern index back to 0', () => {
      // Advance to last operation
      shiftSystem.pattern.currentIndex = 3;
      
      shiftSystem.executeShift(grid);
      
      // Should wrap back to 0
      expect(shiftSystem.pattern.currentIndex).toBe(0);
    });
  });

  describe('moveEntitiesWithSwap', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should move entity from chunk A to chunk B', () => {
      const entity = {
        gridX: 1,
        gridY: 1,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      const chunkA = chunkManager.getChunkById(0);
      const chunkB = chunkManager.getChunkById(3);
      
      shiftSystem.moveEntitiesWithSwap([entity], chunkA, chunkB);
      
      // Entity should move from chunk 0 to chunk 3
      // Offset (1,1) in chunk 0 becomes (5,5) in chunk 3
      expect(entity.gridX).toBe(5);
      expect(entity.gridY).toBe(5);
    });

    it('should move entity from chunk B to chunk A', () => {
      const entity = {
        gridX: 5,
        gridY: 5,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      const chunkA = chunkManager.getChunkById(0);
      const chunkB = chunkManager.getChunkById(3);
      
      shiftSystem.moveEntitiesWithSwap([entity], chunkA, chunkB);
      
      // Entity should move from chunk 3 to chunk 0
      // Offset (1,1) in chunk 3 becomes (1,1) in chunk 0
      expect(entity.gridX).toBe(1);
      expect(entity.gridY).toBe(1);
    });

    it('should not move entity outside swapping chunks', () => {
      const entity = {
        gridX: 0,
        gridY: 4, // In chunk 2, not being swapped
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      const chunkA = chunkManager.getChunkById(0);
      const chunkB = chunkManager.getChunkById(3);
      
      shiftSystem.moveEntitiesWithSwap([entity], chunkA, chunkB);
      
      // Entity should not move
      expect(entity.gridX).toBe(0);
      expect(entity.gridY).toBe(4);
    });

    it('should handle entity without moveTo method', () => {
      const entity = {
        gridX: 1,
        gridY: 1
      };
      
      const chunkA = chunkManager.getChunkById(0);
      const chunkB = chunkManager.getChunkById(3);
      
      shiftSystem.moveEntitiesWithSwap([entity], chunkA, chunkB);
      
      // Should update gridX/gridY directly
      expect(entity.gridX).toBe(5);
      expect(entity.gridY).toBe(5);
    });
  });

  describe('isInChunk', () => {
    let shiftSystem;
    let chunkManager;

    beforeEach(() => {
      const grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRoomSwapPattern();
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should return true for entity in chunk', () => {
      const entity = { gridX: 1, gridY: 1 };
      const chunk = chunkManager.getChunkById(0);
      
      expect(shiftSystem.isInChunk(entity, chunk)).toBe(true);
    });

    it('should return false for entity outside chunk', () => {
      const entity = { gridX: 5, gridY: 5 };
      const chunk = chunkManager.getChunkById(0);
      
      expect(shiftSystem.isInChunk(entity, chunk)).toBe(false);
    });

    it('should return false for entity on chunk boundary', () => {
      const entity = { gridX: 4, gridY: 4 };
      const chunk = chunkManager.getChunkById(0); // 0-3, 0-3
      
      expect(shiftSystem.isInChunk(entity, chunk)).toBe(false);
    });
  });
});
