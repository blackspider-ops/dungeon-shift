import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShiftSystem } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';
import { Grid, TileType } from './Grid.js';

// Mock Phaser before any imports that use it
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      constructor() {}
    },
    Scale: {
      FIT: 1,
      CENTER_BOTH: 1
    },
    AUTO: 'AUTO'
  }
}));

/**
 * Tests for enemy-shift interaction
 * Validates that enemies move correctly with chunks during shifts
 */
describe('ShiftSystem - Enemy Interaction', () => {
  let grid;
  let chunkManager;
  let shiftSystem;
  let mockScene;
  let Patroller;
  let Chaser;
  let Guard;

  beforeEach(async () => {
    // Dynamically import enemy classes after mocking Phaser
    const patrollerModule = await import('../entities/Patroller.js');
    Patroller = patrollerModule.default;
    const chaserModule = await import('../entities/Chaser.js');
    Chaser = chaserModule.default;
    const guardModule = await import('../entities/Guard.js');
    Guard = guardModule.default;
    // Create 12x12 grid for better chunk testing
    grid = new Grid(12, 12);
    
    // Fill with floor tiles
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        grid.setTile(x, y, { type: TileType.FLOOR, x, y });
      }
    }
    
    // Create chunk manager (divides into 6x6 chunks)
    chunkManager = new ChunkManager(grid);
    
    // Create shift system with room swap pattern
    const pattern = ShiftSystem.createRoomSwapPattern();
    shiftSystem = new ShiftSystem(pattern, chunkManager);
    
    // Create mock Phaser scene
    mockScene = {
      add: {
        sprite: vi.fn(() => ({
          setOrigin: vi.fn(),
          play: vi.fn(),
          setPosition: vi.fn(),
          active: true,
          destroy: vi.fn()
        }))
      },
      time: {
        delayedCall: vi.fn((delay, callback) => callback())
      }
    };
  });

  describe('19.1 Move enemies with their chunks during shifts', () => {
    it('should move Patroller enemy with chunk during swap', () => {
      // Create patroller in chunk 0 (top-left, 0-5, 0-5)
      const patroller = new Patroller(mockScene, 2, 2, [
        { x: 2, y: 2 },
        { x: 3, y: 2 }
      ]);
      
      expect(patroller.gridX).toBe(2);
      expect(patroller.gridY).toBe(2);
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      // Chunk 0: (0,0) to (5,5)
      // Chunk 3: (6,6) to (11,11)
      shiftSystem.executeShift(grid, [patroller]);
      
      // Patroller should move from chunk 0 to chunk 3
      // Offset (2,2) in chunk 0 → (8,8) in chunk 3
      expect(patroller.gridX).toBe(8);
      expect(patroller.gridY).toBe(8);
    });

    it('should move Chaser enemy with chunk during swap', () => {
      // Create chaser in chunk 3 (bottom-right, 6-11, 6-11)
      const chaser = new Chaser(mockScene, 7, 7);
      
      expect(chaser.gridX).toBe(7);
      expect(chaser.gridY).toBe(7);
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [chaser]);
      
      // Chaser should move from chunk 3 to chunk 0
      // Offset (1,1) in chunk 3 → (1,1) in chunk 0
      expect(chaser.gridX).toBe(1);
      expect(chaser.gridY).toBe(1);
    });

    it('should move Guard enemy with chunk during swap', () => {
      // Create guard in chunk 0
      const guard = new Guard(mockScene, 4, 3);
      
      expect(guard.gridX).toBe(4);
      expect(guard.gridY).toBe(3);
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [guard]);
      
      // Guard should move from chunk 0 to chunk 3
      // Offset (4,3) in chunk 0 → (10,9) in chunk 3
      expect(guard.gridX).toBe(10);
      expect(guard.gridY).toBe(9);
    });

    it('should move multiple enemy types together during swap', () => {
      // Create enemies in different chunks
      const patroller = new Patroller(mockScene, 1, 1, [{ x: 1, y: 1 }]);
      const chaser = new Chaser(mockScene, 8, 8);
      const guard = new Guard(mockScene, 7, 2);
      
      const enemies = [patroller, chaser, guard];
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, enemies);
      
      // Patroller: chunk 0 → chunk 3
      expect(patroller.gridX).toBe(7);
      expect(patroller.gridY).toBe(7);
      
      // Chaser: chunk 3 → chunk 0
      expect(chaser.gridX).toBe(2);
      expect(chaser.gridY).toBe(2);
      
      // Guard: chunk 1 (not swapped in first operation)
      expect(guard.gridX).toBe(7);
      expect(guard.gridY).toBe(2);
    });

    it('should not move enemies in non-swapping chunks', () => {
      // Create enemies in chunks 1 and 2 (not swapped in first operation)
      const patroller = new Patroller(mockScene, 7, 2, [{ x: 7, y: 2 }]);
      const chaser = new Chaser(mockScene, 2, 8);
      
      const originalPatrollerX = patroller.gridX;
      const originalPatrollerY = patroller.gridY;
      const originalChaserX = chaser.gridX;
      const originalChaserY = chaser.gridY;
      
      // Execute shift (swaps chunk 0 ↔ chunk 3, not chunks 1 or 2)
      shiftSystem.executeShift(grid, [patroller, chaser]);
      
      // Enemies should not move
      expect(patroller.gridX).toBe(originalPatrollerX);
      expect(patroller.gridY).toBe(originalPatrollerY);
      expect(chaser.gridX).toBe(originalChaserX);
      expect(chaser.gridY).toBe(originalChaserY);
    });

    it('should preserve enemy offset within chunk during swap', () => {
      // Create patroller at specific offset in chunk 0
      const patroller = new Patroller(mockScene, 5, 4, [{ x: 5, y: 4 }]);
      
      // Offset from chunk 0 origin (0,0): (5,4)
      expect(patroller.gridX).toBe(5);
      expect(patroller.gridY).toBe(4);
      
      // Execute shift (chunk 0 → chunk 3)
      shiftSystem.executeShift(grid, [patroller]);
      
      // New position should be chunk 3 origin (6,6) + offset (5,4) = (11,10)
      expect(patroller.gridX).toBe(11);
      expect(patroller.gridY).toBe(10);
    });

    it('should handle enemies with player during swap', () => {
      const player = {
        gridX: 1,
        gridY: 1,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        }
      };
      
      const patroller = new Patroller(mockScene, 2, 2, [{ x: 2, y: 2 }]);
      const chaser = new Chaser(mockScene, 8, 8);
      
      // Execute shift with all entities
      shiftSystem.executeShift(grid, [player, patroller, chaser]);
      
      // All entities in swapping chunks should move
      expect(player.gridX).toBe(7);
      expect(player.gridY).toBe(7);
      expect(patroller.gridX).toBe(8);
      expect(patroller.gridY).toBe(8);
      expect(chaser.gridX).toBe(2);
      expect(chaser.gridY).toBe(2);
    });
  });

  describe('19.2 Update enemy paths after rotation shifts', () => {
    it('should rotate Patroller enemy position within chunk', () => {
      // Create shift system with room rotate pattern
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create patroller in chunk 0 at position (2, 1)
      // Chunk 0: (0,0) to (5,5)
      const patroller = new Patroller(mockScene, 2, 1, [{ x: 2, y: 1 }]);
      
      expect(patroller.gridX).toBe(2);
      expect(patroller.gridY).toBe(1);
      
      // Execute rotation (rotates chunk 0 clockwise)
      rotateShiftSystem.executeShift(grid, [patroller]);
      
      // After 90° clockwise rotation:
      // Offset (2, 1) from (0, 0) → (height-1-y, x) = (5-1-1, 2) = (4, 2)
      expect(patroller.gridX).toBe(4);
      expect(patroller.gridY).toBe(2);
    });

    it('should rotate Patroller patrol path after rotation', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create patroller with a patrol path
      const patrolPath = [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 3 }
      ];
      const patroller = new Patroller(mockScene, 1, 1, patrolPath);
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, [patroller]);
      
      // Check that patrol path was rotated
      expect(patroller.patrolPath).toHaveLength(3);
      
      // Original (1,1) → offset (1,1) → rotated (4,1)
      expect(patroller.patrolPath[0]).toEqual({ x: 4, y: 1 });
      // Original (3,1) → offset (3,1) → rotated (4,3)
      expect(patroller.patrolPath[1]).toEqual({ x: 4, y: 3 });
      // Original (3,3) → offset (3,3) → rotated (2,3)
      expect(patroller.patrolPath[2]).toEqual({ x: 2, y: 3 });
    });

    it('should rotate Chaser enemy position within chunk', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create chaser in chunk 0
      const chaser = new Chaser(mockScene, 3, 2);
      
      expect(chaser.gridX).toBe(3);
      expect(chaser.gridY).toBe(2);
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, [chaser]);
      
      // After 90° clockwise rotation:
      // Offset (3, 2) → (5-1-2, 3) = (3, 3)
      expect(chaser.gridX).toBe(3);
      expect(chaser.gridY).toBe(3);
    });

    it('should rotate Guard enemy position within chunk', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create guard in chunk 0
      const guard = new Guard(mockScene, 1, 4);
      
      expect(guard.gridX).toBe(1);
      expect(guard.gridY).toBe(4);
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, [guard]);
      
      // After 90° clockwise rotation:
      // Offset (1, 4) → (5-1-4, 1) = (1, 1)
      expect(guard.gridX).toBe(1);
      expect(guard.gridY).toBe(1);
    });

    it('should rotate enemy facing direction', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create patroller facing right
      const patroller = new Patroller(mockScene, 2, 2, [{ x: 2, y: 2 }]);
      patroller.facing = 'right';
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, [patroller]);
      
      // Right should rotate to down
      expect(patroller.facing).toBe('down');
    });

    it('should not rotate enemies in non-rotating chunks', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create enemy in chunk 1 (not rotated in first operation)
      const patroller = new Patroller(mockScene, 7, 2, [{ x: 7, y: 2 }]);
      
      const originalX = patroller.gridX;
      const originalY = patroller.gridY;
      
      // Execute rotation (rotates chunk 0, not chunk 1)
      rotateShiftSystem.executeShift(grid, [patroller]);
      
      // Enemy should not move
      expect(patroller.gridX).toBe(originalX);
      expect(patroller.gridY).toBe(originalY);
    });

    it('should rotate multiple enemies in the same chunk', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create multiple enemies in chunk 0
      const patroller = new Patroller(mockScene, 1, 1, [{ x: 1, y: 1 }]);
      const chaser = new Chaser(mockScene, 2, 3);
      const guard = new Guard(mockScene, 4, 1);
      
      const enemies = [patroller, chaser, guard];
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, enemies);
      
      // All should be rotated
      expect(patroller.gridX).toBe(4);
      expect(patroller.gridY).toBe(1);
      
      expect(chaser.gridX).toBe(2);
      expect(chaser.gridY).toBe(2);
      
      expect(guard.gridX).toBe(4);
      expect(guard.gridY).toBe(4);
    });

    it('should handle rotation sequence across multiple chunks', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create enemies in different chunks
      const enemy0 = new Patroller(mockScene, 1, 1, [{ x: 1, y: 1 }]);
      const enemy1 = new Patroller(mockScene, 7, 1, [{ x: 7, y: 1 }]);
      const enemy2 = new Patroller(mockScene, 1, 7, [{ x: 1, y: 7 }]);
      const enemy3 = new Patroller(mockScene, 7, 7, [{ x: 7, y: 7 }]);
      
      const enemies = [enemy0, enemy1, enemy2, enemy3];
      
      // First rotation: chunk 0
      rotateShiftSystem.executeShift(grid, enemies);
      expect(enemy0.gridX).toBe(4);
      expect(enemy0.gridY).toBe(1);
      
      // Second rotation: chunk 1
      rotateShiftSystem.executeShift(grid, enemies);
      expect(enemy1.gridX).toBe(10);
      expect(enemy1.gridY).toBe(1);
      
      // Third rotation: chunk 2
      rotateShiftSystem.executeShift(grid, enemies);
      expect(enemy2.gridX).toBe(4);
      expect(enemy2.gridY).toBe(7);
      
      // Fourth rotation: chunk 3
      rotateShiftSystem.executeShift(grid, enemies);
      expect(enemy3.gridX).toBe(10);
      expect(enemy3.gridY).toBe(7);
    });
  });

  describe('19.3 Handle enemy collision with walls post-shift', () => {
    it('should move enemy and tiles together during swap', () => {
      // Create a wall in chunk 3 at (8, 8)
      grid.setTile(8, 8, { type: TileType.WALL, x: 8, y: 8 });
      
      // Create patroller in chunk 0 at (2, 2) on a floor tile
      const originalTile = grid.getTile(2, 2);
      expect(originalTile.type).toBe(TileType.FLOOR);
      
      const patroller = new Patroller(mockScene, 2, 2, [{ x: 2, y: 2 }]);
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [patroller]);
      
      // Patroller moved to (8, 8)
      expect(patroller.gridX).toBe(8);
      expect(patroller.gridY).toBe(8);
      
      // The floor tile from (2, 2) is now at (8, 8)
      const newTile = grid.getTile(8, 8);
      expect(newTile.type).toBe(TileType.FLOOR);
      expect(grid.isWalkable(8, 8)).toBe(true);
      
      // The wall from (8, 8) is now at (2, 2)
      const swappedTile = grid.getTile(2, 2);
      expect(swappedTile.type).toBe(TileType.WALL);
      expect(grid.isWalkable(2, 2)).toBe(false);
    });

    it('should move enemy and tiles together during rotation', () => {
      const rotatePattern = ShiftSystem.createRoomRotatePattern();
      const rotateChunkManager = new ChunkManager(grid);
      const rotateShiftSystem = new ShiftSystem(rotatePattern, rotateChunkManager);
      
      // Create a wall at position (4, 2) in chunk 0
      grid.setTile(4, 2, { type: TileType.WALL, x: 4, y: 2 });
      
      // Create patroller at (2, 1) on a floor tile
      const originalTile = grid.getTile(2, 1);
      expect(originalTile.type).toBe(TileType.FLOOR);
      
      const patroller = new Patroller(mockScene, 2, 1, [{ x: 2, y: 1 }]);
      
      // Execute rotation
      rotateShiftSystem.executeShift(grid, [patroller]);
      
      // Patroller moved to (4, 2)
      expect(patroller.gridX).toBe(4);
      expect(patroller.gridY).toBe(2);
      
      // The floor tile from (2, 1) is now at (4, 2) after rotation
      const newTile = grid.getTile(4, 2);
      expect(newTile.type).toBe(TileType.FLOOR);
      expect(grid.isWalkable(4, 2)).toBe(true);
    });

    it('should handle Patroller movement after shift', () => {
      // Create patroller with patrol path in chunk 0
      const patrolPath = [
        { x: 2, y: 2 },
        { x: 3, y: 2 }
      ];
      const patroller = new Patroller(mockScene, 2, 2, patrolPath);
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [patroller]);
      
      // Patroller moved to chunk 3
      expect(patroller.gridX).toBe(8);
      expect(patroller.gridY).toBe(8);
      
      // Patroller is on a floor tile (moved with it)
      expect(grid.isWalkable(8, 8)).toBe(true);
      
      // Patroller should be able to continue patrolling
      // The patrol path is also updated
      expect(patroller.patrolPath[0]).toEqual({ x: 8, y: 8 });
      expect(patroller.patrolPath[1]).toEqual({ x: 9, y: 8 });
      
      // Try to move patroller
      const nextMove = patroller.update(grid);
      // Movement depends on whether the path is clear
      // Since we're on a mostly empty grid, it should be able to move
      if (grid.isWalkable(9, 8)) {
        expect(nextMove).not.toBeNull();
      } else {
        // If blocked, patroller reverses direction
        expect(nextMove).toBeNull();
      }
    });

    it('should allow Chaser to pathfind after shift', () => {
      // Create chaser in chunk 3
      const chaser = new Chaser(mockScene, 7, 7);
      
      // Create mock player in chunk 0
      const player = {
        gridX: 2,
        gridY: 2,
        getGridPosition: function() {
          return { x: this.gridX, y: this.gridY };
        }
      };
      
      // Execute shift (swaps chunk 0 ↔ chunk 3)
      shiftSystem.executeShift(grid, [chaser]);
      
      // Chaser moved to chunk 0
      expect(chaser.gridX).toBe(1);
      expect(chaser.gridY).toBe(1);
      
      // Chaser should be able to pathfind toward player
      chaser.moveTimer = 2; // Set to trigger movement
      const nextMove = chaser.update(grid, player, 1);
      // Should be able to move (grid is mostly floors)
      expect(nextMove).not.toBeNull();
    });

    it('should handle Guard position after shift', () => {
      // Create guard in chunk 0
      const guard = new Guard(mockScene, 1, 1);
      
      // Execute shift
      shiftSystem.executeShift(grid, [guard]);
      
      // Guard moved to chunk 3
      expect(guard.gridX).toBe(7);
      expect(guard.gridY).toBe(7);
      
      // Guard is on a floor tile (moved with it)
      expect(grid.isWalkable(guard.gridX, guard.gridY)).toBe(true);
      
      // Guard is stationary, so position doesn't affect its update
      const nextMove = guard.update(grid, null, 1);
      expect(nextMove).toBeNull(); // Guards don't move
    });
  });

});
