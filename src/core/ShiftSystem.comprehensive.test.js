import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftSystem, ShiftType } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { Grid, TileType } from './Grid.js';

/**
 * Comprehensive tests for all three shift types:
 * - Room Swap
 * - Room Rotate
 * - Row/Column Slide
 * 
 * Tests verify that all shift types work correctly according to requirements.
 */
describe('ShiftSystem - Comprehensive Shift Type Tests', () => {
  
  describe('35.1 Test all shift types work correctly', () => {
    
    describe('Room Swap Shift Type', () => {
      let grid;
      let chunkManager;
      let shiftSystem;

      beforeEach(() => {
        grid = new Grid(12, 12);
        chunkManager = new ChunkManager(grid);
        const pattern = ShiftSystem.createRoomSwapPattern();
        shiftSystem = new ShiftSystem(pattern, chunkManager);
        
        // Set up distinct tiles in each chunk for verification
        // Chunk 0 (top-left): WALL
        for (let y = 0; y < 6; y++) {
          for (let x = 0; x < 6; x++) {
            grid.setTile(x, y, { type: TileType.WALL, x, y, chunkId: 0 });
          }
        }
        
        // Chunk 1 (top-right): FLOOR
        for (let y = 0; y < 6; y++) {
          for (let x = 6; x < 12; x++) {
            grid.setTile(x, y, { type: TileType.FLOOR, x, y, chunkId: 1 });
          }
        }
        
        // Chunk 2 (bottom-left): SPIKE_TRAP
        for (let y = 6; y < 12; y++) {
          for (let x = 0; x < 6; x++) {
            grid.setTile(x, y, { type: TileType.SPIKE_TRAP, x, y, chunkId: 2 });
          }
        }
        
        // Chunk 3 (bottom-right): CRACKED_FLOOR
        for (let y = 6; y < 12; y++) {
          for (let x = 6; x < 12; x++) {
            grid.setTile(x, y, { type: TileType.CRACKED_FLOOR, x, y, chunkId: 3 });
          }
        }
      });

      it('should execute diagonal swap (chunk 0 ↔ chunk 3)', () => {
        // Before swap
        expect(grid.getTile(0, 0).type).toBe(TileType.WALL);
        expect(grid.getTile(6, 6).type).toBe(TileType.CRACKED_FLOOR);
        
        // Execute first swap operation (0 ↔ 3)
        const result = shiftSystem.executeShift(grid, []);
        
        expect(result).toBe(true);
        
        // After swap: tiles should have swapped
        expect(grid.getTile(0, 0).type).toBe(TileType.CRACKED_FLOOR);
        expect(grid.getTile(6, 6).type).toBe(TileType.WALL);
      });

      it('should execute all four swap operations in sequence', () => {
        // Operation 1: Swap 0 ↔ 3 (diagonal)
        shiftSystem.executeShift(grid, []);
        expect(grid.getTile(0, 0).type).toBe(TileType.CRACKED_FLOOR);
        expect(grid.getTile(6, 6).type).toBe(TileType.WALL);
        
        // Operation 2: Swap 1 ↔ 2 (diagonal)
        shiftSystem.executeShift(grid, []);
        expect(grid.getTile(6, 0).type).toBe(TileType.SPIKE_TRAP);
        expect(grid.getTile(0, 6).type).toBe(TileType.FLOOR);
        
        // Operation 3: Swap 0 ↔ 1 (horizontal)
        shiftSystem.executeShift(grid, []);
        expect(grid.getTile(0, 0).type).toBe(TileType.SPIKE_TRAP);
        expect(grid.getTile(6, 0).type).toBe(TileType.CRACKED_FLOOR);
        
        // Operation 4: Swap 2 ↔ 3 (horizontal)
        shiftSystem.executeShift(grid, []);
        expect(grid.getTile(0, 6).type).toBe(TileType.WALL);
        expect(grid.getTile(6, 6).type).toBe(TileType.FLOOR);
      });

      it('should move entities with swapping chunks', () => {
        const entity = {
          gridX: 2,
          gridY: 2,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Entity starts in chunk 0 at (2, 2)
        expect(entity.gridX).toBe(2);
        expect(entity.gridY).toBe(2);
        
        // Execute swap (0 ↔ 3)
        shiftSystem.executeShift(grid, [entity]);
        
        // Entity should move to chunk 3 at (8, 8)
        expect(entity.gridX).toBe(8);
        expect(entity.gridY).toBe(8);
      });

      it('should cycle pattern and repeat swaps', () => {
        // Execute all 4 operations
        for (let i = 0; i < 4; i++) {
          shiftSystem.executeShift(grid, []);
        }
        
        // Pattern should cycle back to 0
        expect(shiftSystem.pattern.currentIndex).toBe(0);
        
        // Next operation should be first swap again
        const nextOp = shiftSystem.getNextOperation();
        expect(nextOp.params).toEqual({ chunkA: 0, chunkB: 3 });
      });
    });

    describe('Room Rotate Shift Type', () => {
      let grid;
      let chunkManager;
      let shiftSystem;

      beforeEach(() => {
        grid = new Grid(12, 12);
        chunkManager = new ChunkManager(grid);
        const pattern = ShiftSystem.createRoomRotatePattern();
        shiftSystem = new ShiftSystem(pattern, chunkManager);
        
        // Set up a recognizable pattern in chunk 0 for rotation testing
        // Create an L-shape pattern
        grid.setTile(0, 0, { type: TileType.WALL, x: 0, y: 0 });
        grid.setTile(1, 0, { type: TileType.WALL, x: 1, y: 0 });
        grid.setTile(0, 1, { type: TileType.WALL, x: 0, y: 1 });
        grid.setTile(2, 0, { type: TileType.FLOOR, x: 2, y: 0 });
      });

      it('should rotate chunk 90 degrees clockwise', () => {
        // Before rotation: L-shape in top-left corner
        expect(grid.getTile(0, 0).type).toBe(TileType.WALL);
        expect(grid.getTile(1, 0).type).toBe(TileType.WALL);
        expect(grid.getTile(0, 1).type).toBe(TileType.WALL);
        expect(grid.getTile(2, 0).type).toBe(TileType.FLOOR);
        
        // Execute rotation on chunk 0
        const result = shiftSystem.executeShift(grid, []);
        
        expect(result).toBe(true);
        
        // After 90° clockwise rotation:
        // (0,0) → (5,0)
        // (1,0) → (5,1)
        // (0,1) → (4,0)
        // (2,0) → (5,2)
        expect(grid.getTile(5, 0).type).toBe(TileType.WALL);
        expect(grid.getTile(5, 1).type).toBe(TileType.WALL);
        expect(grid.getTile(4, 0).type).toBe(TileType.WALL);
        expect(grid.getTile(5, 2).type).toBe(TileType.FLOOR);
      });

      it('should rotate all four chunks in sequence', () => {
        // Rotate chunk 0
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(1);
        
        // Rotate chunk 1
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(2);
        
        // Rotate chunk 2
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(3);
        
        // Rotate chunk 3
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(0);
      });

      it('should move entities with rotating chunk', () => {
        const entity = {
          gridX: 1,
          gridY: 2,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Entity at (1, 2) in chunk 0
        expect(entity.gridX).toBe(1);
        expect(entity.gridY).toBe(2);
        
        // Execute rotation
        shiftSystem.executeShift(grid, [entity]);
        
        // After 90° clockwise rotation:
        // Offset (1, 2) → (chunkHeight-1-y, x) = (6-1-2, 1) = (3, 1)
        expect(entity.gridX).toBe(3);
        expect(entity.gridY).toBe(1);
      });

      it('should rotate entity facing direction', () => {
        const entity = {
          gridX: 1,
          gridY: 1,
          facing: 'up',
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Execute rotation
        shiftSystem.executeShift(grid, [entity]);
        
        // Facing should rotate: up → right
        expect(entity.facing).toBe('right');
      });

      it('should not rotate entities in non-rotating chunks', () => {
        const entity = {
          gridX: 7,
          gridY: 1,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Entity in chunk 1, but first rotation is chunk 0
        const originalX = entity.gridX;
        const originalY = entity.gridY;
        
        shiftSystem.executeShift(grid, [entity]);
        
        // Entity should not move
        expect(entity.gridX).toBe(originalX);
        expect(entity.gridY).toBe(originalY);
      });
    });

    describe('Row/Column Slide Shift Type', () => {
      let grid;
      let chunkManager;
      let shiftSystem;

      beforeEach(() => {
        grid = new Grid(8, 8);
        chunkManager = new ChunkManager(grid);
        const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
        shiftSystem = new ShiftSystem(pattern, chunkManager);
        
        // Set up numbered tiles for easy tracking
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            grid.setTile(x, y, { 
              type: TileType.FLOOR, 
              x, 
              y, 
              value: y * 8 + x 
            });
          }
        }
      });

      it('should slide row right with wrap-around', () => {
        // Row 0 before: [0, 1, 2, 3, 4, 5, 6, 7]
        expect(grid.getTile(0, 0).value).toBe(0);
        expect(grid.getTile(7, 0).value).toBe(7);
        
        // Execute first operation (slide row 0 right)
        const result = shiftSystem.executeShift(grid, []);
        
        expect(result).toBe(true);
        
        // Row 0 after: [7, 0, 1, 2, 3, 4, 5, 6]
        expect(grid.getTile(0, 0).value).toBe(7);
        expect(grid.getTile(1, 0).value).toBe(0);
        expect(grid.getTile(7, 0).value).toBe(6);
      });

      it('should slide column down with wrap-around', () => {
        // Execute first operation (row slide)
        shiftSystem.executeShift(grid, []);
        
        // Column 0 before: [7, 8, 16, 24, 32, 40, 48, 56]
        const col0Before = [];
        for (let y = 0; y < 8; y++) {
          col0Before.push(grid.getTile(0, y).value);
        }
        
        // Execute second operation (slide column 0 down)
        shiftSystem.executeShift(grid, []);
        
        // Column 0 after: last element wraps to top
        const lastValue = col0Before[7];
        expect(grid.getTile(0, 0).value).toBe(lastValue);
        expect(grid.getTile(0, 1).value).toBe(col0Before[0]);
      });

      it('should execute all four slide operations in sequence', () => {
        // Operation 1: Slide row 0 right
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(1);
        
        // Operation 2: Slide column 0 down
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(2);
        
        // Operation 3: Slide row 7 left
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(3);
        
        // Operation 4: Slide column 7 up
        shiftSystem.executeShift(grid, []);
        expect(shiftSystem.pattern.currentIndex).toBe(0);
      });

      it('should move entities with sliding row', () => {
        const entity = {
          gridX: 7,
          gridY: 0,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Entity at end of row 0
        expect(entity.gridX).toBe(7);
        
        // Execute row slide right
        shiftSystem.executeShift(grid, [entity]);
        
        // Entity should wrap to x=0
        expect(entity.gridX).toBe(0);
        expect(entity.gridY).toBe(0);
      });

      it('should move entities with sliding column', () => {
        const entity = {
          gridX: 0,
          gridY: 7,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Skip first operation (row slide)
        shiftSystem.executeShift(grid, []);
        
        // Entity at bottom of column 0
        expect(entity.gridY).toBe(7);
        
        // Execute column slide down
        shiftSystem.executeShift(grid, [entity]);
        
        // Entity should wrap to y=0
        expect(entity.gridX).toBe(0);
        expect(entity.gridY).toBe(0);
      });

      it('should not move entities in different row/column', () => {
        const entity = {
          gridX: 3,
          gridY: 3,
          moveTo: function(x, y) {
            this.gridX = x;
            this.gridY = y;
          }
        };
        
        // Entity not in row 0
        const originalX = entity.gridX;
        const originalY = entity.gridY;
        
        // Execute row 0 slide
        shiftSystem.executeShift(grid, [entity]);
        
        // Entity should not move
        expect(entity.gridX).toBe(originalX);
        expect(entity.gridY).toBe(originalY);
      });
    });

    describe('Cross-shift type verification', () => {
      it('should support all three shift types', () => {
        const swapPattern = ShiftSystem.createRoomSwapPattern();
        const rotatePattern = ShiftSystem.createRoomRotatePattern();
        const slidePattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
        
        expect(swapPattern.type).toBe(ShiftType.ROOM_SWAP);
        expect(rotatePattern.type).toBe(ShiftType.ROOM_ROTATE);
        expect(slidePattern.type).toBe(ShiftType.ROW_COLUMN_SLIDE);
      });

      it('should execute different shift types independently', () => {
        const grid = new Grid(8, 8);
        const chunkManager = new ChunkManager(grid);
        
        // Test swap
        const swapSystem = new ShiftSystem(
          ShiftSystem.createRoomSwapPattern(), 
          chunkManager
        );
        expect(swapSystem.executeShift(grid, [])).toBe(true);
        
        // Test rotate
        const rotateSystem = new ShiftSystem(
          ShiftSystem.createRoomRotatePattern(), 
          chunkManager
        );
        expect(rotateSystem.executeShift(grid, [])).toBe(true);
        
        // Test slide
        const slideSystem = new ShiftSystem(
          ShiftSystem.createRowColumnSlidePattern(8, 8), 
          chunkManager
        );
        expect(slideSystem.executeShift(grid, [])).toBe(true);
      });
    });
  });
});
