import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for InputManager
 * Tests keyboard input handling and state management
 * 
 * Note: We test the InputManager logic without importing Phaser
 * to avoid canvas/DOM dependencies in the test environment
 */

// Mock Phaser module
const mockPhaser = {
  Input: {
    Keyboard: {
      KeyCodes: {
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        ONE: 49,
        TWO: 50,
        THREE: 51,
        FOUR: 52,
        ESC: 27,
        SPACE: 32
      },
      JustDown: vi.fn(() => false)
    }
  }
};

vi.mock('phaser', () => ({
  default: mockPhaser
}));

// Import after mocking
const { default: InputManager, Direction, PowerUpKey } = await import('./InputManager.js');

describe('InputManager', () => {
  let mockScene;
  let mockKeyboard;
  let inputManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockPhaser.Input.Keyboard.JustDown.mockReturnValue(false);

    // Mock Phaser keyboard system
    mockKeyboard = {
      addKey: vi.fn((keyCode) => ({
        keyCode,
        isDown: false,
        isUp: true
      }))
    };

    mockScene = {
      input: {
        keyboard: mockKeyboard
      }
    };

    inputManager = new InputManager(mockScene);
  });

  describe('Constructor and Setup', () => {
    it('should initialize with enabled state', () => {
      expect(inputManager.isEnabled()).toBe(true);
    });

    it('should set up all required keyboard controls', () => {
      // Movement keys (8 total: arrows + WASD)
      // Power-up keys (4 total: 1-4)
      // Utility keys (2 total: ESC, SPACE)
      expect(mockKeyboard.addKey).toHaveBeenCalledTimes(14);
    });

    it('should initialize with NONE direction', () => {
      expect(inputManager.lastDirection).toBe(Direction.NONE);
    });
  });

  describe('Enable/Disable', () => {
    it('should enable input', () => {
      inputManager.disable();
      expect(inputManager.isEnabled()).toBe(false);
      
      inputManager.enable();
      expect(inputManager.isEnabled()).toBe(true);
    });

    it('should disable input', () => {
      expect(inputManager.isEnabled()).toBe(true);
      
      inputManager.disable();
      expect(inputManager.isEnabled()).toBe(false);
    });

    it('should return NONE direction when disabled', () => {
      inputManager.disable();
      const direction = inputManager.getDirectionInput();
      expect(direction).toBe(Direction.NONE);
    });

    it('should return null for power-up input when disabled', () => {
      inputManager.disable();
      const powerUp = inputManager.getPowerUpInput();
      expect(powerUp).toBe(null);
    });
  });

  describe('Direction Constants', () => {
    it('should have all direction constants defined', () => {
      expect(Direction.UP).toBe('UP');
      expect(Direction.DOWN).toBe('DOWN');
      expect(Direction.LEFT).toBe('LEFT');
      expect(Direction.RIGHT).toBe('RIGHT');
      expect(Direction.NONE).toBe('NONE');
    });
  });

  describe('PowerUpKey Constants', () => {
    it('should have all power-up key constants defined', () => {
      expect(PowerUpKey.ANCHOR).toBe('1');
      expect(PowerUpKey.PHASE_STEP).toBe('2');
      expect(PowerUpKey.UNDO).toBe('3');
      expect(PowerUpKey.SHIELD).toBe('4');
    });
  });

  describe('Static Helper Methods', () => {
    it('should convert direction to delta coordinates', () => {
      expect(InputManager.directionToDelta(Direction.UP)).toEqual({ dx: 0, dy: -1 });
      expect(InputManager.directionToDelta(Direction.DOWN)).toEqual({ dx: 0, dy: 1 });
      expect(InputManager.directionToDelta(Direction.LEFT)).toEqual({ dx: -1, dy: 0 });
      expect(InputManager.directionToDelta(Direction.RIGHT)).toEqual({ dx: 1, dy: 0 });
      expect(InputManager.directionToDelta(Direction.NONE)).toEqual({ dx: 0, dy: 0 });
    });

    it('should convert direction to animation suffix', () => {
      expect(InputManager.directionToAnimationSuffix(Direction.UP)).toBe('up');
      expect(InputManager.directionToAnimationSuffix(Direction.DOWN)).toBe('down');
      expect(InputManager.directionToAnimationSuffix(Direction.LEFT)).toBe('left');
      expect(InputManager.directionToAnimationSuffix(Direction.RIGHT)).toBe('right');
      expect(InputManager.directionToAnimationSuffix(Direction.NONE)).toBe('down');
    });
  });

  describe('Reset', () => {
    it('should reset input state', () => {
      inputManager.lastDirection = Direction.UP;
      inputManager.lastPowerUpKey = PowerUpKey.ANCHOR;

      inputManager.reset();

      expect(inputManager.lastDirection).toBe(Direction.NONE);
      expect(inputManager.lastPowerUpKey).toBe(null);
    });
  });

  describe('Destroy', () => {
    it('should clean up resources', () => {
      inputManager.destroy();

      expect(inputManager.enabled).toBe(false);
      expect(Object.keys(inputManager.keys).length).toBe(0);
    });
  });
});
