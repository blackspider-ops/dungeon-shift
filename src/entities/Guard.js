
import { TILE_SIZE } from '../constants.js';

/**
 * Guard enemy entity class
 * Stationary enemy that attacks adjacent tiles on even turns
 * Deals damage on contact with player during attack phase
 */
export default class Guard {
  /**
   * Create a new Guard enemy
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} gridX - Starting grid X coordinate
   * @param {number} gridY - Starting grid Y coordinate
   */
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = 'GUARD';
    
    // Attack configuration
    this.attackTimer = 0; // Tracks turn parity for attack timing
    this.isAttacking = false; // Whether currently in attack state
    this.facing = 'down'; // Current facing direction
    
    // Get screen position from tile renderer
    const pos = scene.tileRenderer.getScreenPosition(gridX, gridY);
    
    this.sprite = scene.add.sprite(pos.x, pos.y, 'patroller', 14);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(2); // Scale up to match player size
    // Depth will be set dynamically in GameScene.updateSpriteDepths()
    
    // Set initial animation
    this.sprite.play('guard_idle');
    
    console.log(`Guard: Created at grid position (${gridX}, ${gridY})`);
  }
  
  /**
   * Play idle animation
   */
  playIdleAnimation() {
    this.sprite.play('guard_idle');
  }
  
  /**
   * Play attack animation
   */
  playAttackAnimation() {
    this.sprite.play('guard_attack');
    
    // Return to idle after a short delay
    this.scene.time.delayedCall(300, () => {
      if (this.sprite && this.sprite.active) {
        this.playIdleAnimation();
      }
    });
  }
  
  /**
   * Play telegraph animation (warning before attack)
   */
  playTelegraphAnimation() {
    this.sprite.play('guard_telegraph');
  }
  
  /**
   * Check if guard should show telegraph on this turn
   * Telegraph appears one turn before attack (odd turns before even attack turns)
   * @param {number} turnNumber - Current turn number
   * @returns {boolean} True if guard should show telegraph this turn
   */
  shouldTelegraph(turnNumber) {
    // Telegraph on odd turns (1, 3, 5, etc.) which are one turn before even attack turns
    return turnNumber % 2 === 1;
  }
  
  /**
   * Check if guard should attack on this turn
   * Guards attack on even turns (turn 2, 4, 6, etc.)
   * @param {number} turnNumber - Current turn number
   * @returns {boolean} True if guard should attack this turn
   */
  shouldAttack(turnNumber) {
    return turnNumber % 2 === 0;
  }
  
  /**
   * Get all adjacent tile positions (4-directional)
   * @returns {Array<{x: number, y: number}>} Array of adjacent positions
   */
  getAdjacentPositions() {
    return [
      { x: this.gridX, y: this.gridY - 1 }, // Up
      { x: this.gridX, y: this.gridY + 1 }, // Down
      { x: this.gridX - 1, y: this.gridY }, // Left
      { x: this.gridX + 1, y: this.gridY }  // Right
    ];
  }
  
  /**
   * Check if player is in an adjacent tile
   * @param {Object} player - Player entity
   * @returns {boolean} True if player is adjacent
   */
  isPlayerAdjacent(player) {
    const playerPos = player.getGridPosition ? player.getGridPosition() : { x: player.gridX, y: player.gridY };
    const adjacentPositions = this.getAdjacentPositions();
    
    return adjacentPositions.some(pos => 
      pos.x === playerPos.x && pos.y === playerPos.y
    );
  }
  
  /**
   * Update guard AI - stationary, no movement
   * Guards do not move, they only attack on even turns
   * Called each turn to advance the guard's behavior
   * @param {Object} grid - Game grid for collision detection
   * @param {Object} player - Player entity
   * @param {number} turnNumber - Current turn number
   * @returns {null} Always returns null as guards don't move
   */
  update(grid, player, turnNumber) {
    // Check if we should show telegraph (one turn before attack)
    if (this.shouldTelegraph(turnNumber)) {
      console.log(`Guard: Telegraphing attack at (${this.gridX}, ${this.gridY}), turn ${turnNumber}`);
      this.playTelegraphAnimation();
      this.isAttacking = false;
    }
    // Check if we should attack this turn
    else if (this.shouldAttack(turnNumber)) {
      console.log(`Guard: Attacking at (${this.gridX}, ${this.gridY}), turn ${turnNumber}`);
      this.playAttackAnimation();
      this.isAttacking = true;
    }
    // Idle on other turns
    else {
      this.isAttacking = false;
      this.playIdleAnimation();
    }
    
    // Guards are stationary and never move
    return null;
  }
  
  /**
   * Get current grid position
   * @returns {{x: number, y: number}} Current grid position
   */
  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }
  
  /**
   * Get pixel position (center of sprite)
   * @returns {{x: number, y: number}} Current pixel position
   */
  getPixelPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
  
  /**
   * Destroy the guard sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
