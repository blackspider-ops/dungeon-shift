import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftSystem, ShiftType } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { Grid, TileType } from './Grid.js';

describe('ShiftSystem - Row/Column Slide', () => {
  describe('createRowColumnSlidePattern', () => {
    it('should create pattern with 4 slide operations', () => {
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      
      expect(pattern.type).toBe(ShiftType.ROW_COLUMN_SLIDE);
      expect(pattern.currentIndex).toBe(0);
      expect(pattern.sequence).toHaveLength(4);
    });

    it('should have correct slide sequence', () => {
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      
      // Operation 0: Slide row 0 right
      expect(pattern.sequence[0].params).toEqual({ axis: 'row', index: 0, direction: 'right' });
      
      // Operation 1: Slide column 0 down
      expect(pattern.sequence[1].params).toEqual({ axis: 'column', index: 0, direction: 'down' });
      
      // Operation 2: Slide row 7 left
      expect(pattern.sequence[2].params).toEqual({ axis: 'row', index: 7, direction: 'left' });
      
      // Operation 3: Slide column 7 up
      expect(pattern.sequence[3].params).toEqual({ axis: 'column', index: 7, direction: 'up' });
    });
  });

  describe('slideRow', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      // Set up distinct tiles in row 0 for testing
      for (let x = 0; x < 8; x++) {
        grid.setTile(x, 0, { type: TileType.FLOOR, x, y: 0, value: x });
      }
    });

    it('should slide row right with wrap-around', () => {
      // Before: [0, 1, 2, 3, 4, 5, 6, 7]
      expect(grid.getTile(0, 0).value).toBe(0);
      expect(grid.getTile(7, 0).value).toBe(7);
      
      shiftSystem.slideRow(grid, 0, 'right', []);
      
      // After: [7, 0, 1, 2, 3, 4, 5, 6]
      expect(grid.getTile(0, 0).value).toBe(7);
      expect(grid.getTile(1, 0).value).toBe(0);
      expect(grid.getTile(7, 0).value).toBe(6);
    });

    it('should slide row left with wrap-around', () => {
      // Before: [0, 1, 2, 3, 4, 5, 6, 7]
      expect(grid.getTile(0, 0).value).toBe(0);
      expect(grid.getTile(1, 0).value).toBe(1);
      
      shiftSystem.slideRow(grid, 0, 'left', []);
      
      // After: [1, 2, 3, 4, 5, 6, 7, 0]
      expect(grid.getTile(0, 0).value).toBe(1);
      expect(grid.getTile(7, 0).value).toBe(0);
      expect(grid.getTile(6, 0).value).toBe(7);
    });

    it('should update tile coordinates after slide', () => {
      shiftSystem.slideRow(grid, 0, 'right', []);
      
      // Check that tile coordinates match their new positions
      for (let x = 0; x < 8; x++) {
        const tile = grid.getTile(x, 0);
        expect(tile.x).toBe(x);
        expect(tile.y).toBe(0);
      }
    });
  });

  describe('slideColumn', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
      
      // Set up distinct tiles in column 0 for testing
      for (let y = 0; y < 8; y++) {
        grid.setTile(0, y, { type: TileType.FLOOR, x: 0, y, value: y });
      }
    });

    it('should slide column down with wrap-around', () => {
      // Before: [0, 1, 2, 3, 4, 5, 6, 7] (top to bottom)
      expect(grid.getTile(0, 0).value).toBe(0);
      expect(grid.getTile(0, 7).value).toBe(7);
      
      shiftSystem.slideColumn(grid, 0, 'down', []);
      
      // After: [7, 0, 1, 2, 3, 4, 5, 6]
      expect(grid.getTile(0, 0).value).toBe(7);
      expect(grid.getTile(0, 1).value).toBe(0);
      expect(grid.getTile(0, 7).value).toBe(6);
    });

    it('should slide column up with wrap-around', () => {
      // Before: [0, 1, 2, 3, 4, 5, 6, 7]
      expect(grid.getTile(0, 0).value).toBe(0);
      expect(grid.getTile(0, 1).value).toBe(1);
      
      shiftSystem.slideColumn(grid, 0, 'up', []);
      
      // After: [1, 2, 3, 4, 5, 6, 7, 0]
      expect(grid.getTile(0, 0).value).toBe(1);
      expect(grid.getTile(0, 7).value).toBe(0);
      expect(grid.getTile(0, 6).value).toBe(7);
    });

    it('should update tile coordinates after slide', () => {
      shiftSystem.slideColumn(grid, 0, 'down', []);
      
      // Check that tile coordinates match their new positions
      for (let y = 0; y < 8; y++) {
        const tile = grid.getTile(0, y);
        expect(tile.x).toBe(0);
        expect(tile.y).toBe(y);
      }
    });
  });

  describe('moveEntitiesWithRowSlide', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should move entity right with wrap-around', () => {
      const entity = {
        gridX: 7,
        gridY: 0,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithRowSlide([entity], 0, 'right', 8);
      
      // Entity at x=7 should wrap to x=0
      expect(entity.gridX).toBe(0);
      expect(entity.gridY).toBe(0);
    });

    it('should move entity left with wrap-around', () => {
      const entity = {
        gridX: 0,
        gridY: 0,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithRowSlide([entity], 0, 'left', 8);
      
      // Entity at x=0 should wrap to x=7
      expect(entity.gridX).toBe(7);
      expect(entity.gridY).toBe(0);
    });

    it('should not move entity in different row', () => {
      const entity = {
        gridX: 3,
        gridY: 1,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithRowSlide([entity], 0, 'right', 8);
      
      // Entity should not move
      expect(entity.gridX).toBe(3);
      expect(entity.gridY).toBe(1);
    });
  });

  describe('moveEntitiesWithColumnSlide', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should move entity down with wrap-around', () => {
      const entity = {
        gridX: 0,
        gridY: 7,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithColumnSlide([entity], 0, 'down', 8);
      
      // Entity at y=7 should wrap to y=0
      expect(entity.gridX).toBe(0);
      expect(entity.gridY).toBe(0);
    });

    it('should move entity up with wrap-around', () => {
      const entity = {
        gridX: 0,
        gridY: 0,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithColumnSlide([entity], 0, 'up', 8);
      
      // Entity at y=0 should wrap to y=7
      expect(entity.gridX).toBe(0);
      expect(entity.gridY).toBe(7);
    });

    it('should not move entity in different column', () => {
      const entity = {
        gridX: 1,
        gridY: 3,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      shiftSystem.moveEntitiesWithColumnSlide([entity], 0, 'down', 8);
      
      // Entity should not move
      expect(entity.gridX).toBe(1);
      expect(entity.gridY).toBe(3);
    });
  });

  describe('slideRowColumn integration', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should execute row slide via slideRowColumn', () => {
      // Set up row 0
      for (let x = 0; x < 8; x++) {
        grid.setTile(x, 0, { type: TileType.FLOOR, x, y: 0, value: x });
      }
      
      shiftSystem.slideRowColumn(grid, { axis: 'row', index: 0, direction: 'right' }, []);
      
      // Verify slide occurred
      expect(grid.getTile(0, 0).value).toBe(7);
      expect(grid.getTile(1, 0).value).toBe(0);
    });

    it('should execute column slide via slideRowColumn', () => {
      // Set up column 0
      for (let y = 0; y < 8; y++) {
        grid.setTile(0, y, { type: TileType.FLOOR, x: 0, y, value: y });
      }
      
      shiftSystem.slideRowColumn(grid, { axis: 'column', index: 0, direction: 'down' }, []);
      
      // Verify slide occurred
      expect(grid.getTile(0, 0).value).toBe(7);
      expect(grid.getTile(0, 1).value).toBe(0);
    });

    it('should execute slide via executeShift', () => {
      // Set up row 0
      for (let x = 0; x < 8; x++) {
        grid.setTile(x, 0, { type: TileType.FLOOR, x, y: 0, value: x });
      }
      
      const result = shiftSystem.executeShift(grid, []);
      
      expect(result).toBe(true);
      expect(shiftSystem.pattern.currentIndex).toBe(1);
      
      // Verify slide occurred (first operation is row 0 right)
      expect(grid.getTile(0, 0).value).toBe(7);
    });
  });

  describe('patrol path updates', () => {
    let grid;
    let chunkManager;
    let shiftSystem;

    beforeEach(() => {
      grid = new Grid(8, 8);
      chunkManager = new ChunkManager(grid);
      const pattern = ShiftSystem.createRowColumnSlidePattern(8, 8);
      shiftSystem = new ShiftSystem(pattern, chunkManager);
    });

    it('should update patrol path after row slide', () => {
      const patrolPath = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 7, y: 0 }
      ];
      
      const updated = shiftSystem.updatePatrolPathAfterRowSlide(patrolPath, 0, 'right', 8);
      
      expect(updated[0]).toEqual({ x: 1, y: 0 });
      expect(updated[1]).toEqual({ x: 4, y: 0 });
      expect(updated[2]).toEqual({ x: 0, y: 0 }); // Wrapped
    });

    it('should update patrol path after column slide', () => {
      const patrolPath = [
        { x: 0, y: 0 },
        { x: 0, y: 3 },
        { x: 0, y: 7 }
      ];
      
      const updated = shiftSystem.updatePatrolPathAfterColumnSlide(patrolPath, 0, 'down', 8);
      
      expect(updated[0]).toEqual({ x: 0, y: 1 });
      expect(updated[1]).toEqual({ x: 0, y: 4 });
      expect(updated[2]).toEqual({ x: 0, y: 0 }); // Wrapped
    });
  });
});
