
import { TILE_SIZE } from '../constants.js';

/**
 * Chaser enemy entity class
 * Pursues the player using greedy pathfinding
 * Moves every 2 turns toward the player
 * Deals damage on contact with player
 */
export default class Chaser {
  /**
   * Create a new Chaser enemy
   * @param {Phaser.Scene} scene - The scene this enemy belongs to
   * @param {number} gridX - Starting grid X coordinate
   * @param {number} gridY - Starting grid Y coordinate
   */
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = 'CHASER';
    
    // Movement timer - moves every 2 turns
    this.moveTimer = 0;
    this.moveInterval = 2;
    this.facing = 'down'; // Current facing direction
    
    // Get screen position from tile renderer
    const pos = scene.tileRenderer.getScreenPosition(gridX, gridY);
    
    // Get dynamic scale from tile renderer (defaults to 2 if not available)
    const spriteScale = scene.tileRenderer.tileScale || 2;
    
    this.sprite = scene.add.sprite(pos.x, pos.y, 'patroller', 7);
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(spriteScale); // Scale dynamically to match tile size
    // Depth will be set dynamically in GameScene.updateSpriteDepths()
    
    // Set initial animation
    this.sprite.play('chaser_idle');
    
    console.log(`Chaser: Created at grid position (${gridX}, ${gridY}), scale ${spriteScale}`);
  }
  
  /**
   * Move chaser to a new grid position
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
    
    console.log(`Chaser: Moved to grid position (${newGridX}, ${newGridY})`);
  }
  
  /**
   * Play movement animation based on facing direction
   */
  playMoveAnimation() {
    const animKey = `chaser_move_${this.facing}`;
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
    this.sprite.play('chaser_idle');
  }
  
  /**
   * Calculate Manhattan distance to target position
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @returns {number} Manhattan distance
   */
  calculateManhattanDistance(targetX, targetY) {
    return Math.abs(this.gridX - targetX) + Math.abs(this.gridY - targetY);
  }
  
  /**
   * Get next move toward player using greedy pathfinding
   * Prioritizes horizontal movement over vertical
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid for collision detection
   * @returns {{x: number, y: number}|null} Next position or null if no valid move
   */
  getNextMove(player, grid) {
    const playerPos = player.getGridPosition ? player.getGridPosition() : { x: player.gridX, y: player.gridY };
    
    // Calculate direction to player
    const dx = playerPos.x - this.gridX;
    const dy = playerPos.y - this.gridY;
    
    // Already at player position
    if (dx === 0 && dy === 0) {
      return null;
    }
    
    // Try moves in order of priority
    const moves = [];
    
    // Prioritize horizontal movement over vertical
    if (dx !== 0) {
      const horizontalMove = {
        x: this.gridX + Math.sign(dx),
        y: this.gridY
      };
      moves.push(horizontalMove);
    }
    
    if (dy !== 0) {
      const verticalMove = {
        x: this.gridX,
        y: this.gridY + Math.sign(dy)
      };
      moves.push(verticalMove);
    }
    
    // Try each move in priority order
    for (const move of moves) {
      if (grid.isInBounds(move.x, move.y) && grid.isWalkable(move.x, move.y)) {
        return move;
      }
    }
    
    // No valid moves
    return null;
  }
  
  /**
   * Update chaser AI - move toward player every 2 turns
   * Called each turn to advance the chaser's behavior
   * @param {Object} grid - Game grid for collision detection
   * @param {Object} player - Player entity to chase
   * @param {number} turnNumber - Current turn number
   * @returns {{x: number, y: number}|null} New position or null if no move
   */
  update(grid, player, turnNumber) {
    // Increment move timer
    this.moveTimer++;
    
    // Only move every 2 turns
    if (this.moveTimer < this.moveInterval) {
      console.log(`Chaser: Waiting (timer: ${this.moveTimer}/${this.moveInterval})`);
      return null;
    }
    
    // Reset timer
    this.moveTimer = 0;
    
    // Get next move toward player
    const nextMove = this.getNextMove(player, grid);
    
    if (!nextMove) {
      console.log('Chaser: No valid move toward player');
      return null;
    }
    
    // Move to target position
    this.moveTo(nextMove.x, nextMove.y);
    
    return { x: nextMove.x, y: nextMove.y };
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
   * Destroy the chaser sprite
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
