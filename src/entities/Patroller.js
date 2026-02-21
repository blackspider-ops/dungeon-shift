
import { TILE_SIZE } from '../constants.js';

/**
 * Patroller enemy entity class
 * Moves back and forth along a predefined patrol path
 * Deals damage on contact with player
 */
export default class Patroller {
  /**
   * Create a new Patroller enemy
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} gridX - Starting grid X coordinate
   * @param {number} gridY - Starting grid Y coordinate
   * @param {Array<{x: number, y: number}>} patrolPath - Array of grid positions to patrol
   */
  constructor(scene, gridX, gridY, patrolPath = []) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = 'PATROLLER';
    
    // Patrol path configuration
    this.patrolPath = patrolPath.length > 0 ? patrolPath : [{ x: gridX, y: gridY }];
    this.patrolIndex = 0;
    this.patrolDirection = 1; // 1 = forward, -1 = backward
    this.facing = 'down'; // Current facing direction
    
    // Get screen position from tile renderer
    const pos = scene.tileRenderer.getScreenPosition(gridX, gridY);
    
    this.sprite = scene.add.sprite(pos.x, pos.y, 'patroller', 0);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(2); // Scale up to match player size
    // Depth will be set dynamically in GameScene.updateSpriteDepths()
    
    // Set initial animation
    this.sprite.play('patroller_idle');
    
    console.log(`Patroller: Created at grid position (${gridX}, ${gridY}) with patrol path of ${patrolPath.length} points`);
  }
  
  /**
   * Move patroller to a new grid position
   * @param {number} newGridX - Target grid X coordinate
   * @param {number} newGridY - Target grid Y coordinate
   */
  moveTo(newGridX, newGridY) {
    // Calculate direction for animation
    const dx = newGridX - this.gridX;
    const dy = newGridY - this.gridY;
    
    // Update facing direction
    if (dy > 0) this.facing = 'down';
    else if (dy < 0) this.facing = 'up';
    else if (dx < 0) this.facing = 'left';
    else if (dx > 0) this.facing = 'right';
    
    // Clamp position to grid bounds to prevent escaping
    const grid = this.scene.grid;
    if (grid) {
      newGridX = Math.max(0, Math.min(grid.width - 1, newGridX));
      newGridY = Math.max(0, Math.min(grid.height - 1, newGridY));
    }
    
    // Update grid position
    this.gridX = newGridX;
    this.gridY = newGridY;
    
    // Get screen position from tile renderer
    const pos = this.scene.tileRenderer.getScreenPosition(newGridX, newGridY);
    this.sprite.setPosition(pos.x, pos.y);
    
    // Play movement animation
    this.playMoveAnimation();
    
    console.log(`Patroller: Moved to grid position (${newGridX}, ${newGridY})`);
  }
  
  /**
   * Play movement animation based on facing direction
   */
  playMoveAnimation() {
    const animKey = `patroller_move_${this.facing}`;
    this.sprite.play(animKey);
    
    // Return to idle after a short delay
    this.scene.time.delayedCall(200, () => {
      if (this.sprite && this.sprite.active) {
        this.playIdleAnimation();
      }
    });
  }
  
  /**
   * Play idle animation
   */
  playIdleAnimation() {
    this.sprite.play('patroller_idle');
  }
  
  /**
   * Update patroller AI - move along patrol path
   * Called each turn to advance the patroller's position
   * @param {Object} grid - Game grid for collision detection
   * @returns {{x: number, y: number}|null} New position or null if no move
   */
  update(grid) {
    // If patrol path has only one point, don't move
    if (this.patrolPath.length <= 1) {
      return null;
    }
    
    // Calculate next patrol index
    const nextIndex = this.patrolIndex + this.patrolDirection;
    
    // Check if we've reached the end of the path
    if (nextIndex >= this.patrolPath.length) {
      // Reverse direction
      this.patrolDirection = -1;
      this.patrolIndex = this.patrolPath.length - 2;
    } else if (nextIndex < 0) {
      // Reverse direction
      this.patrolDirection = 1;
      this.patrolIndex = 1;
    } else {
      this.patrolIndex = nextIndex;
    }
    
    // Get target position from patrol path
    const targetPos = this.patrolPath[this.patrolIndex];
    
    // Check if target position is walkable
    if (grid && !grid.isWalkable(targetPos.x, targetPos.y)) {
      console.log(`Patroller: Path blocked at (${targetPos.x}, ${targetPos.y}), reversing direction`);
      // Reverse direction if blocked
      this.patrolDirection *= -1;
      return null;
    }
    
    // Move to target position
    this.moveTo(targetPos.x, targetPos.y);
    
    return { x: targetPos.x, y: targetPos.y };
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
   * Destroy the patroller sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
