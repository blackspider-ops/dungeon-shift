
import { TILE_SIZE, SPRITE_SIZE } from '../constants.js';

/**
 * Player entity class
 * Manages the player character sprite, position, and state
 */
export default class Player {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    
    // Player state
    this.hp = 3;
    this.maxHp = 3;
    this.keysCollected = 0;
    this.inventory = [];
    this.activeShield = false;
    this.phaseStepActive = false;
    this.facing = 'down';
    
    // Get screen position from tile renderer
    const pos = scene.tileRenderer.getScreenPosition(gridX, gridY);
    
    this.sprite = scene.add.sprite(pos.x, pos.y, 'player', 0);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(2);
    
    // Set initial animation
    this.sprite.play('player_idle_down');
    
    console.log(`Player: Created at grid (${gridX}, ${gridY}), screen (${pos.x}, ${pos.y})`);
  }
  
  /**
   * Move player to a new grid position with animation
   * @param {number} newGridX - Target grid X coordinate
   * @param {number} newGridY - Target grid Y coordinate
   * @param {boolean} animate - Whether to play walk animation (default: true)
   */
  moveTo(newGridX, newGridY, animate = true) {
    console.log(`Player.moveTo called: (${newGridX}, ${newGridY})`);
    
    // Clamp position to grid bounds to prevent escaping
    const grid = this.scene.grid;
    if (grid) {
      newGridX = Math.max(0, Math.min(grid.width - 1, newGridX));
      newGridY = Math.max(0, Math.min(grid.height - 1, newGridY));
      console.log(`Player.moveTo clamped to: (${newGridX}, ${newGridY})`);
    }
    
    this.gridX = newGridX;
    this.gridY = newGridY;
    
    // Get screen position from tile renderer
    if (!this.scene.tileRenderer) {
      console.error('Player.moveTo: tileRenderer not found!');
      return;
    }
    
    const pos = this.scene.tileRenderer.getScreenPosition(newGridX, newGridY);
    console.log(`Player.moveTo: Setting sprite position to (${pos.x}, ${pos.y})`);
    
    this.sprite.setPosition(pos.x, pos.y);
    
    // Play walk animation if requested
    if (animate) {
      this.playWalkAnimation();
    }
    
    console.log(`Player: Moved to grid position (${newGridX}, ${newGridY})`);
  }
  /**
   * Slide player to a new grid position with tween animation
   * Used for slime tile sliding effect
   * @param {number} newGridX - Target grid X coordinate
   * @param {number} newGridY - Target grid Y coordinate
   * @param {number} duration - Duration of slide animation in ms (default: 200)
   * @returns {Promise} Promise that resolves when animation completes
   */
  slideTo(newGridX, newGridY, duration = 200) {
    return new Promise((resolve) => {
      // Clamp position to grid bounds to prevent escaping
      const grid = this.scene.grid;
      if (grid) {
        newGridX = Math.max(0, Math.min(grid.width - 1, newGridX));
        newGridY = Math.max(0, Math.min(grid.height - 1, newGridY));
      }
      
      this.gridX = newGridX;
      this.gridY = newGridY;

      // Get screen position from tile renderer
      const pos = this.scene.tileRenderer.getScreenPosition(newGridX, newGridY);

      // Create tween for smooth sliding
      this.scene.tweens.add({
        targets: this.sprite,
        x: pos.x,
        y: pos.y,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
          console.log(`Player: Slid to grid position (${newGridX}, ${newGridY})`);
          resolve();
        }
      });
    });
  }
  
  /**
   * Play walk animation based on current facing direction
   */
  playWalkAnimation() {
    const animKey = `player_walk_${this.facing}`;
    this.sprite.play(animKey);
    
    // Return to idle after animation completes
    this.sprite.once('animationcomplete', () => {
      this.playIdleAnimation();
    });
  }
  
  /**
   * Play idle animation based on current facing direction
   */
  playIdleAnimation() {
    const animKey = `player_idle_${this.facing}`;
    this.sprite.play(animKey);
  }
  
  /**
   * Set the facing direction and update idle animation
   * @param {string} direction - 'up', 'down', 'left', or 'right'
   */
  setFacing(direction) {
    this.facing = direction;
    // Update to idle animation in new direction if not currently walking
    if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim.key.includes('idle')) {
      this.playIdleAnimation();
    }
  }
  
  /**
   * Get current grid position
   */
  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }
  
  /**
   * Get pixel position (center of sprite)
   */
  getPixelPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }
  /**
   * Take damage and reduce HP
   * @param {number} amount - Amount of damage to take (default: 1)
   * @returns {boolean} True if player is still alive after damage
   */
  takeDamage(amount = 1) {
    // Check if shield is active
    if (this.activeShield) {
      console.log('Player: Damage blocked by shield');
      this.activeShield = false;
      return true;
    }

    // Apply damage
    this.hp = Math.max(0, this.hp - amount);
    console.log(`Player: Took ${amount} damage, HP: ${this.hp}/${this.maxHp}`);

    return this.hp > 0;
  }

  /**
   * Heal player by specified amount
   * @param {number} amount - Amount of HP to restore
   */
  heal(amount = 1) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    console.log(`Player: Healed ${amount} HP, HP: ${this.hp}/${this.maxHp}`);
  }

  /**
   * Check if player is alive
   * @returns {boolean} True if player has HP remaining
   */
  isAlive() {
    return this.hp > 0;
  }
  
  /**
   * Destroy the player sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
