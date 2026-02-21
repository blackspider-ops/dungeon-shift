import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShiftType } from '../core/ShiftSystem.js';

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

// Import GameScene after mocking Phaser
const GameScene = (await import('./GameScene.js')).default;

describe('GameScene Shift Indicator', () => {
  let scene;
  let mockAdd;
  let mockContainer;
  let mockText;
  let mockGraphics;

  beforeEach(() => {
    // Create mock Phaser scene
    mockText = {
      setText: vi.fn(),
      setOrigin: vi.fn()
    };

    mockGraphics = {
      lineStyle: vi.fn(),
      fillStyle: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      strokePath: vi.fn(),
      fillPath: vi.fn(),
      closePath: vi.fn()
    };

    mockContainer = {
      add: vi.fn(),
      removeAll: vi.fn(),
      setDepth: vi.fn(),
      setScrollFactor: vi.fn()
    };

    mockAdd = {
      text: vi.fn(() => mockText),
      container: vi.fn(() => mockContainer),
      rectangle: vi.fn(() => ({ setStrokeStyle: vi.fn(), setOrigin: vi.fn() })),
      graphics: vi.fn(() => mockGraphics)
    };

    scene = new GameScene();
    scene.add = mockAdd;
    scene.hudElements = {};
  });

  describe('createShiftIndicator', () => {
    it('should create shift indicator container', () => {
      scene.cameras = { main: { width: 800 } };
      
      scene.createShiftIndicator();

      expect(mockAdd.container).toHaveBeenCalled();
      expect(mockAdd.text).toHaveBeenCalledWith(75, 8, 'Next Shift:', expect.any(Object));
      expect(scene.hudElements.shiftIndicator).toBeDefined();
      expect(scene.hudElements.shiftPatternText).toBeDefined();
      expect(scene.hudElements.shiftDiagram).toBeDefined();
    });
  });

  describe('formatShiftDescription', () => {
    beforeEach(() => {
      scene.cameras = { main: { width: 800 } };
      scene.createShiftIndicator();
    });

    it('should format ROOM_SWAP operation correctly', () => {
      const operation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 0, chunkB: 3 }
      };

      const description = scene.formatShiftDescription(operation);

      expect(description).toBe('Swap TL ↔ BR');
    });

    it('should format ROOM_SWAP with different chunks', () => {
      const operation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 1, chunkB: 2 }
      };

      const description = scene.formatShiftDescription(operation);

      expect(description).toBe('Swap TR ↔ BL');
    });

    it('should format ROOM_ROTATE operation correctly', () => {
      const operation = {
        type: ShiftType.ROOM_ROTATE,
        params: { chunkId: 0 }
      };

      const description = scene.formatShiftDescription(operation);

      expect(description).toBe('Rotate TL ↻');
    });

    it('should format ROW_COLUMN_SLIDE operation correctly', () => {
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'row', index: 0, direction: 'right' }
      };

      const description = scene.formatShiftDescription(operation);

      expect(description).toBe('Row 0 →');
    });

    it('should handle unknown operation type', () => {
      const operation = {
        type: 'UNKNOWN',
        params: {}
      };

      const description = scene.formatShiftDescription(operation);

      expect(description).toBe('Unknown');
    });
  });

  describe('updateShiftIndicator', () => {
    beforeEach(() => {
      scene.cameras = { main: { width: 800 } };
      scene.createShiftIndicator();
    });

    it('should update shift indicator with next operation', () => {
      const mockOperation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 0, chunkB: 3 }
      };

      scene.gameState = {
        shiftSystem: {
          getNextOperation: vi.fn(() => mockOperation)
        }
      };

      scene.updateShiftIndicator();

      expect(scene.gameState.shiftSystem.getNextOperation).toHaveBeenCalled();
      expect(mockText.setText).toHaveBeenCalledWith('Swap TL ↔ BR');
      expect(mockContainer.removeAll).toHaveBeenCalled();
    });

    it('should handle missing shift system gracefully', () => {
      scene.gameState = null;

      expect(() => scene.updateShiftIndicator()).not.toThrow();
    });

    it('should handle missing operation gracefully', () => {
      scene.gameState = {
        shiftSystem: {
          getNextOperation: vi.fn(() => null)
        }
      };

      expect(() => scene.updateShiftIndicator()).not.toThrow();
    });
  });

  describe('updateShiftDiagram', () => {
    beforeEach(() => {
      scene.cameras = { main: { width: 800 } };
      scene.createShiftIndicator();
      // Reset call counts after createShiftIndicator
      mockAdd.text.mockClear();
      mockAdd.rectangle.mockClear();
      mockAdd.graphics.mockClear();
      
      // Mock chunk manager
      scene.chunkManager = {
        getChunkById: vi.fn((id) => ({
          id,
          isAnchored: false,
          anchorTurnsRemaining: 0
        }))
      };
    });

    it('should clear existing diagram before drawing', () => {
      const operation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 0, chunkB: 3 }
      };

      scene.updateShiftDiagram(operation);

      expect(mockContainer.removeAll).toHaveBeenCalledWith(true);
    });

    it('should draw 4 chunks for 2x2 grid', () => {
      const operation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 0, chunkB: 3 }
      };

      scene.updateShiftDiagram(operation);

      // Should create 4 rectangles (one for each chunk)
      expect(mockAdd.rectangle).toHaveBeenCalledTimes(4);
      // Should create 4 labels (one for each chunk)
      expect(mockAdd.text).toHaveBeenCalledTimes(4);
    });

    it('should draw swap arrows for ROOM_SWAP operation', () => {
      const operation = {
        type: ShiftType.ROOM_SWAP,
        params: { chunkA: 0, chunkB: 3 }
      };

      scene.updateShiftDiagram(operation);

      // Should create graphics for arrows
      expect(mockAdd.graphics).toHaveBeenCalled();
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
    });

    it('should draw rotation indicator for ROOM_ROTATE operation', () => {
      const operation = {
        type: ShiftType.ROOM_ROTATE,
        params: { chunkId: 0 }
      };

      scene.updateShiftDiagram(operation);

      // Should create graphics for rotation arrow
      expect(mockAdd.graphics).toHaveBeenCalled();
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.arc).toHaveBeenCalled(); // Circular arrow
      expect(mockGraphics.fillStyle).toHaveBeenCalled(); // Arrowhead
    });

    it('should draw slide indicator for ROW_COLUMN_SLIDE operation', () => {
      const operation = {
        type: ShiftType.ROW_COLUMN_SLIDE,
        params: { axis: 'row', index: 0, direction: 'right' }
      };

      scene.updateShiftDiagram(operation);

      // Should create graphics for slide arrow
      expect(mockAdd.graphics).toHaveBeenCalled();
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.moveTo).toHaveBeenCalled();
      expect(mockGraphics.lineTo).toHaveBeenCalled();
      expect(mockGraphics.fillStyle).toHaveBeenCalled(); // Arrowhead
    });
  });
});
