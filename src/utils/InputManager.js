

/**
 * InputManager - Handles keyboard input for Dungeon Shift
 * 
 * Responsibilities:
 * - Configure and manage keyboard controls (Arrow keys, WASD)
 * - Handle power-up hotkeys (1-4 for different power-ups)
 * - Manage input state (enabled/disabled during animations)
 * - Provide directional input mapping
 * 
 * Requirements Coverage:
 * - Requirement 23: Input and Control System
 */

export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  NONE: 'NONE'
};

export const PowerUpKey = {
  ANCHOR: '1',
  PHASE_STEP: '2',
  UNDO: '3',
  SHIELD: '4'
};

export default class InputManager {
  /**
   * @param {Phaser.Scene} scene - The Phaser scene to attach input to
   */
  constructor(scene) {
    this.scene = scene;
    this.enabled = true;
    this.keys = {};
    this.lastDirection = Direction.NONE;
    this.lastPowerUpKey = null;
    
    this.setupKeyboardControls();
  }

  /**
   * Sets up keyboard controls for movement and power-ups
   */
  setupKeyboardControls() {
    const keyboard = this.scene.input.keyboard;

    // Movement keys - Arrow keys
    this.keys.up = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keys.down = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keys.left = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keys.right = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

    // Movement keys - WASD
    this.keys.w = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keys.a = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keys.s = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keys.d = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // Power-up hotkeys
    this.keys.one = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keys.two = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keys.three = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.keys.four = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);

    // Utility keys
    this.keys.esc = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keys.space = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    console.log('InputManager: Keyboard controls configured');
  }

  /**
   * Gets the current directional input
   * Checks both arrow keys and WASD
   * @returns {string} Direction constant (UP, DOWN, LEFT, RIGHT, NONE)
   */
  getDirectionInput() {
    if (!this.enabled) {
      return Direction.NONE;
    }

    // Check UP (Arrow Up or W)
    if (Phaser.Input.Keyboard.JustDown(this.keys.up) || 
        Phaser.Input.Keyboard.JustDown(this.keys.w)) {
      this.lastDirection = Direction.UP;
      return Direction.UP;
    }

    // Check DOWN (Arrow Down or S)
    if (Phaser.Input.Keyboard.JustDown(this.keys.down) || 
        Phaser.Input.Keyboard.JustDown(this.keys.s)) {
      this.lastDirection = Direction.DOWN;
      return Direction.DOWN;
    }

    // Check LEFT (Arrow Left or A)
    if (Phaser.Input.Keyboard.JustDown(this.keys.left) || 
        Phaser.Input.Keyboard.JustDown(this.keys.a)) {
      this.lastDirection = Direction.LEFT;
      return Direction.LEFT;
    }

    // Check RIGHT (Arrow Right or D)
    if (Phaser.Input.Keyboard.JustDown(this.keys.right) || 
        Phaser.Input.Keyboard.JustDown(this.keys.d)) {
      this.lastDirection = Direction.RIGHT;
      return Direction.RIGHT;
    }

    return Direction.NONE;
  }

  /**
   * Gets the current power-up key input
   * @returns {string|null} PowerUpKey constant or null if no key pressed
   */
  getPowerUpInput() {
    if (!this.enabled) {
      return null;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.lastPowerUpKey = PowerUpKey.ANCHOR;
      return PowerUpKey.ANCHOR;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.lastPowerUpKey = PowerUpKey.PHASE_STEP;
      return PowerUpKey.PHASE_STEP;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      this.lastPowerUpKey = PowerUpKey.UNDO;
      return PowerUpKey.UNDO;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.four)) {
      this.lastPowerUpKey = PowerUpKey.SHIELD;
      return PowerUpKey.SHIELD;
    }

    return null;
  }

  /**
   * Checks if ESC key was pressed
   * @returns {boolean}
   */
  isEscPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.esc);
  }

  /**
   * Checks if SPACE key was pressed
   * @returns {boolean}
   */
  isSpacePressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.space);
  }

  /**
   * Enables input processing
   * Call this when the player turn phase begins
   */
  enable() {
    this.enabled = true;
    console.log('InputManager: Input enabled');
  }

  /**
   * Disables input processing
   * Call this during animations or when input should be ignored
   */
  disable() {
    this.enabled = false;
    console.log('InputManager: Input disabled');
  }

  /**
   * Checks if input is currently enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Resets input state
   * Clears last direction and power-up key
   */
  reset() {
    this.lastDirection = Direction.NONE;
    this.lastPowerUpKey = null;
  }

  /**
   * Converts direction to delta coordinates
   * @param {string} direction - Direction constant
   * @returns {{dx: number, dy: number}} Delta coordinates
   */
  static directionToDelta(direction) {
    switch (direction) {
      case Direction.UP:
        return { dx: 0, dy: -1 };
      case Direction.DOWN:
        return { dx: 0, dy: 1 };
      case Direction.LEFT:
        return { dx: -1, dy: 0 };
      case Direction.RIGHT:
        return { dx: 1, dy: 0 };
      default:
        return { dx: 0, dy: 0 };
    }
  }

  /**
   * Converts direction to animation key suffix
   * @param {string} direction - Direction constant
   * @returns {string} Animation suffix (e.g., 'down', 'up', 'left', 'right')
   */
  static directionToAnimationSuffix(direction) {
    switch (direction) {
      case Direction.UP:
        return 'up';
      case Direction.DOWN:
        return 'down';
      case Direction.LEFT:
        return 'left';
      case Direction.RIGHT:
        return 'right';
      default:
        return 'down';
    }
  }

  /**
   * Destroys the input manager and cleans up resources
   */
  destroy() {
    this.keys = {};
    this.enabled = false;
    console.log('InputManager: Destroyed');
  }
}
