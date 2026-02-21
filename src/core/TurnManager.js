/**
 * TurnManager - Orchestrates the turn-based game loop
 * Responsibilities:
 * - Process player moves
 * - Trigger shift system
 * - Resolve hazards (traps and enemies)
 * - Track turn counter
 * - Manage collapse meter
 * - Check win/loss conditions
 */

import { TileType } from './Grid.js';

/**
 * @typedef {Object} TurnResult
 * @property {boolean} success - Whether the turn was processed successfully
 * @property {HazardResult[]} hazardResults - Results from hazard resolution
 * @property {boolean} shiftExecuted - Whether a shift was executed
 * @property {boolean} gameOver - Whether the game has ended
 * @property {boolean} victory - Whether the player won
 * @property {string} [message] - Optional message about the turn result
 * @property {Array<{x: number, y: number}>} [slidePositions] - Positions player slid through on slime
 */

/**
 * @typedef {Object} HazardResult
 * @property {string} type - 'trap' or 'enemy'
 * @property {number} damage - Damage dealt
 * @property {Object} position - {x, y} position of hazard
 * @property {string} description - Description of what happened
 */

export class TurnManager {
  /**
   * Create a new TurnManager
   * @param {number} initialCollapseMeter - Starting number of moves
   */
  /**
     * Create a new TurnManager
     * @param {number} initialCollapseMeter - Starting number of moves
     */
    constructor(initialCollapseMeter) {
      this.turnNumber = 0;
      this.collapseMeter = initialCollapseMeter;
      this.initialCollapseMeter = initialCollapseMeter;
      this.savedState = null; // For undo functionality

      console.log(`TurnManager: Initialized with ${initialCollapseMeter} moves`);
    }

  /**
   * Process a complete turn
   * Sequence: validate move → execute move → shift → hazards → collapse → win/loss
   * @param {Object} player - Player entity
   * @param {Object} direction - Direction to move
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   * @returns {Promise<TurnResult>} Result of the turn
   */
  /**
     * Process a complete turn
     * Sequence: save state → validate move → execute move → shift → hazards → collapse → win/loss
     * @param {Object} player - Player entity
     * @param {Object} direction - Direction to move
     * @param {Object} grid - Game grid
     * @param {Object} gameState - Current game state
     * @returns {Promise<TurnResult>} Result of the turn
     */
    async processTurn(player, direction, grid, gameState) {
      console.log(`TurnManager: Processing turn ${this.turnNumber + 1}`);

      // 0. Save state before processing turn (for undo)
      this.saveState(player, grid, gameState);

      // 1. Validate move
      const newX = player.gridX + direction.dx;
      const newY = player.gridY + direction.dy;

      if (!this.validateMove(player, newX, newY, grid)) {
        console.log('TurnManager: Move validation failed');
        return {
          success: false,
          hazardResults: [],
          shiftExecuted: false,
          gameOver: false,
          victory: false,
          message: 'Invalid move'
        };
      }

      // 2. Execute player move
      this.executePlayerMove(player, newX, newY, grid);

      // 2.5. Handle slime tile sliding and track positions
      const slideDirection = { dx: direction.dx, dy: direction.dy };
      const slidePositions = [];
      this.handleSlimeSlide(player, slideDirection, grid, gameState, slidePositions);

      // 2.6. Check for item collection (keys, power-ups)
      const collectedItems = this.collectItems(player, grid, gameState);

      // 2.7. Toggle switches when player steps on them
      this.toggleSwitch(player, grid, gameState);

      // 3. Trigger shift system
      // Pass player in gameState for entity movement
      const shiftGameState = { ...gameState, player };
      const shiftExecuted = this.executeShift(grid, shiftGameState);

      // 3.5. Update anchor durations after shift
      if (gameState.chunkManager) {
        gameState.chunkManager.updateAnchors();
      }

      // 4. Resolve hazards
      const hazardResults = this.resolveHazards(player, grid, gameState);

      // 5. Decrement collapse meter
      this.collapseMeter--;
      console.log(`TurnManager: Collapse meter: ${this.collapseMeter}`);

      // 6. Increment turn counter
      this.turnNumber++;

      // 7. Check win/loss conditions
      const victory = this.checkWinCondition(player, grid, gameState);
      const loss = this.checkLossCondition(player);
      const gameOver = victory || loss;

      if (gameOver) {
        console.log(`TurnManager: Game over - Victory: ${victory}, Loss: ${loss}`);
      }

      return {
        success: true,
        hazardResults,
        shiftExecuted,
        gameOver,
        victory,
        message: gameOver ? (victory ? 'Victory!' : 'Game Over') : null,
        slidePositions: slidePositions.length > 0 ? slidePositions : undefined,
        collectedItems: collectedItems.length > 0 ? collectedItems : undefined
      };
    }

  /**
   * Validate if a move is allowed
   * @param {Object} player - Player entity
   * @param {number} newX - Target X coordinate
   * @param {number} newY - Target Y coordinate
   * @param {Object} grid - Game grid
   * @returns {boolean} True if move is valid
   */
  validateMove(player, newX, newY, grid) {
    // Check bounds
    if (!grid.isInBounds(newX, newY)) {
      return false;
    }
    
    // If phase step is active, check if we can pass through a wall
    if (player.phaseStepActive) {
      const tile = grid.getTile(newX, newY);
      
      // If the target tile is a wall, check if we can phase through it
      if (tile && tile.type === 'WALL') {
        // Calculate the tile beyond the wall
        const direction = {
          dx: newX - player.gridX,
          dy: newY - player.gridY
        };
        const beyondX = newX + direction.dx;
        const beyondY = newY + direction.dy;
        
        // Check if the tile beyond the wall is valid
        if (!grid.isInBounds(beyondX, beyondY)) {
          console.log('TurnManager: Phase step blocked - beyond tile out of bounds');
          return false;
        }
        
        const beyondTile = grid.getTile(beyondX, beyondY);
        
        // The tile beyond must not be a wall
        if (beyondTile && beyondTile.type === 'WALL') {
          console.log('TurnManager: Phase step blocked - tile beyond wall is also a wall');
          return false;
        }
        
        // The tile beyond must be walkable
        if (!grid.isWalkable(beyondX, beyondY)) {
          console.log('TurnManager: Phase step blocked - tile beyond wall is not walkable');
          return false;
        }
        
        console.log(`TurnManager: Phase step allowed - passing through wall at (${newX}, ${newY}) to (${beyondX}, ${beyondY})`);
        return true;
      }
    }
    
    // Check if tile is walkable (normal movement)
    return grid.isWalkable(newX, newY);
  }

  /**
   * Execute player movement
   * @param {Object} player - Player entity
   * @param {number} newX - Target X coordinate
   * @param {number} newY - Target Y coordinate
   * @param {Object} grid - Game grid for phase step validation
   */
  executePlayerMove(player, newX, newY, grid) {
    // Check if phase step is active and we're moving through a wall
    if (player.phaseStepActive && grid) {
      const tile = grid.getTile(newX, newY);
      
      if (tile && tile.type === 'WALL') {
        // Calculate the tile beyond the wall
        const direction = {
          dx: newX - player.gridX,
          dy: newY - player.gridY
        };
        const beyondX = newX + direction.dx;
        const beyondY = newY + direction.dy;
        
        console.log(`TurnManager: Phase step - moving through wall at (${newX}, ${newY}) to (${beyondX}, ${beyondY})`);
        
        // Move to the tile beyond the wall
        player.moveTo(beyondX, beyondY);
        
        // Deactivate phase step after use
        player.phaseStepActive = false;
        console.log('TurnManager: Phase step consumed');
        
        return;
      }
    }
    
    // Normal movement
    console.log(`TurnManager: Moving player from (${player.gridX}, ${player.gridY}) to (${newX}, ${newY})`);
    player.moveTo(newX, newY);
    
    // If phase step was active but not used (normal move), deactivate it
    if (player.phaseStepActive) {
      player.phaseStepActive = false;
      console.log('TurnManager: Phase step consumed on normal move');
    }
  }
  /**
   * Handle slime tile sliding effect
   * When player steps on slime, they slide one additional tile in the same direction
   * Sliding can chain if the player lands on another slime tile
   * @param {Object} player - Player entity
   * @param {Object} direction - Direction object with dx and dy
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   * @param {Array} slidePositions - Array to track slide positions for animation
   */
  handleSlimeSlide(player, direction, grid, gameState, slidePositions = []) {
    const currentTile = grid.getTile(player.gridX, player.gridY);

    // Check if current tile is slime
    if (!currentTile || currentTile.type !== TileType.SLIME) {
      return;
    }

    console.log(`TurnManager: Player stepped on slime at (${player.gridX}, ${player.gridY})`);

    // Calculate slide destination
    const slideX = player.gridX + direction.dx;
    const slideY = player.gridY + direction.dy;

    // Check if slide destination is valid (in bounds and walkable)
    if (!grid.isInBounds(slideX, slideY)) {
      console.log(`TurnManager: Slide blocked - out of bounds`);
      return;
    }

    if (!grid.isWalkable(slideX, slideY)) {
      console.log(`TurnManager: Slide blocked - obstacle at (${slideX}, ${slideY})`);
      return;
    }

    // Execute the slide
    console.log(`TurnManager: Player sliding from (${player.gridX}, ${player.gridY}) to (${slideX}, ${slideY})`);
    this.executePlayerMove(player, slideX, slideY);

    // Track slide position for animation
    slidePositions.push({ x: slideX, y: slideY });

    // Check for item collection after slide
    this.collectItems(player, grid, gameState);

    // Recursively check if the new tile is also slime (chain sliding)
    this.handleSlimeSlide(player, direction, grid, gameState, slidePositions);
  }
  /**
   * Collect items at player's current position
   * Handles keys, power-ups, and other collectibles
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   */
  /**
     * Collect items at player's current position
     * Handles keys, power-ups, and other collectibles
     * @param {Object} player - Player entity
     * @param {Object} grid - Game grid
     * @param {Object} gameState - Current game state
     * @returns {Array} Array of collected items with type and position
     */
    collectItems(player, grid, gameState) {
      const tile = grid.getTile(player.gridX, player.gridY);
      const collectedItems = [];
      if (!tile) return collectedItems;

      // Check for key collection
      if (tile.type === 'KEY') {
        player.keysCollected++;
        console.log(`TurnManager: Player collected key (${player.keysCollected}/${gameState.keysRequired})`);

        collectedItems.push({
          type: 'KEY',
          position: { x: player.gridX, y: player.gridY }
        });

        // Remove key from grid (convert to floor)
        grid.setTile(player.gridX, player.gridY, {
          type: 'FLOOR',
          x: player.gridX,
          y: player.gridY
        });

        // Unlock doors when player collects a key
        const unlockedDoors = this.unlockDoors(grid, player);
        
        // Add unlocked doors to collected items for animation
        for (const doorPos of unlockedDoors) {
          collectedItems.push({
            type: 'DOOR_UNLOCKED',
            position: doorPos
          });
        }

        // Check if all keys collected - unlock exit
        if (player.keysCollected >= gameState.keysRequired) {
          this.unlockExit(grid, gameState);
        }
      }

      // Check for undo power-up collection
      if (tile.type === 'UNDO') {
        // Add undo to player inventory
        player.inventory.push({ type: 'UNDO', quantity: 1 });
        console.log('TurnManager: Player collected undo power-up');

        collectedItems.push({
          type: 'UNDO',
          position: { x: player.gridX, y: player.gridY }
        });

        // Remove undo from grid (convert to floor)
        grid.setTile(player.gridX, player.gridY, {
          type: 'FLOOR',
          x: player.gridX,
          y: player.gridY
        });
      }

      // Check for anchor power-up collection
      if (tile.type === 'ANCHOR') {
        player.inventory.push({ type: 'ANCHOR', quantity: 1 });
        console.log('TurnManager: Player collected anchor power-up');

        collectedItems.push({
          type: 'ANCHOR',
          position: { x: player.gridX, y: player.gridY }
        });

        grid.setTile(player.gridX, player.gridY, {
          type: 'FLOOR',
          x: player.gridX,
          y: player.gridY
        });
      }

      // Check for phase step power-up collection
      if (tile.type === 'PHASE_STEP') {
        player.inventory.push({ type: 'PHASE_STEP', quantity: 1 });
        console.log('TurnManager: Player collected phase step power-up');

        collectedItems.push({
          type: 'PHASE_STEP',
          position: { x: player.gridX, y: player.gridY }
        });

        grid.setTile(player.gridX, player.gridY, {
          type: 'FLOOR',
          x: player.gridX,
          y: player.gridY
        });
      }

      // Check for shield power-up collection
      if (tile.type === 'SHIELD') {
        player.inventory.push({ type: 'SHIELD', quantity: 1 });
        console.log('TurnManager: Player collected shield power-up');

        collectedItems.push({
          type: 'SHIELD',
          position: { x: player.gridX, y: player.gridY }
        });

        grid.setTile(player.gridX, player.gridY, {
          type: 'FLOOR',
          x: player.gridX,
          y: player.gridY
        });
      }

      return collectedItems;
    }

  /**
   * Toggle switch when player steps on it
   * Switches control which shift pattern is active
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   */
  toggleSwitch(player, grid, gameState) {
    const tile = grid.getTile(player.gridX, player.gridY);
    if (!tile) return;

    // Check if player is on a switch tile
    if (tile.type === 'SWITCH') {
      // Toggle the switch state
      const currentState = tile.state?.active || false;
      const newState = !currentState;
      
      // Update tile state
      tile.state = { active: newState };
      
      console.log(`TurnManager: Switch at (${player.gridX}, ${player.gridY}) toggled to ${newState ? 'ON' : 'OFF'}`);
      
      // Store switch states in gameState for shift pattern updates
      if (!gameState.switchStates) {
        gameState.switchStates = new Map();
      }
      
      const switchKey = `${player.gridX},${player.gridY}`;
      gameState.switchStates.set(switchKey, newState);
      
      // Trigger shift pattern update based on switch states
      if (gameState.shiftSystem) {
        this.updateShiftPattern(gameState);
      }
    }
  }

  /**
   * Update shift pattern based on switch states
   * Different switch combinations can activate different shift patterns
   * @param {Object} gameState - Current game state with shiftSystem and switchStates
   */
  updateShiftPattern(gameState) {
    if (!gameState.shiftSystem || !gameState.switchStates) {
      return;
    }

    // Get all switch states as an array
    const switchStates = Array.from(gameState.switchStates.values());
    
    // Count active switches
    const activeSwitches = switchStates.filter(state => state === true).length;
    
    console.log(`TurnManager: Updating shift pattern - ${activeSwitches} switches active`);
    
    // Store the switch-controlled patterns in gameState if not already present
    if (!gameState.shiftPatterns) {
      // Default patterns based on switch states
      // These can be customized per level
      gameState.shiftPatterns = {
        default: gameState.shiftSystem.pattern, // Original pattern
        alternate: null // Will be set by level data
      };
    }
    
    // Switch pattern based on number of active switches
    // This is a simple implementation - can be made more complex
    if (activeSwitches > 0 && gameState.shiftPatterns.alternate) {
      // Use alternate pattern when switches are active
      gameState.shiftSystem.pattern = gameState.shiftPatterns.alternate;
      console.log('TurnManager: Switched to alternate shift pattern');
    } else {
      // Use default pattern when no switches are active
      gameState.shiftSystem.pattern = gameState.shiftPatterns.default;
      console.log('TurnManager: Using default shift pattern');
    }
  }

  /**
   * Unlock all locked doors on the grid
   * Called when player collects a key
   * @param {Object} grid - Game grid
   * @param {Object} player - Player entity
   * @returns {Array} Array of unlocked door positions
   */
  unlockDoors(grid, player) {
    let doorsUnlocked = 0;
    const unlockedDoorPositions = [];

    // Find and unlock all locked doors
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === 'DOOR_LOCKED') {
          // Update tile to unlocked state
          grid.setTile(x, y, {
            type: 'DOOR_UNLOCKED',
            x: x,
            y: y
          });
          doorsUnlocked++;
          unlockedDoorPositions.push({ x, y });
        }
      }
    }

    if (doorsUnlocked > 0) {
      console.log(`TurnManager: Unlocked ${doorsUnlocked} door(s) with key`);
    }

    return unlockedDoorPositions;
  }

  /**
   * Unlock the exit when all keys are collected
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   */
  unlockExit(grid, gameState) {
    console.log('TurnManager: All keys collected - unlocking exit');
    gameState.exitUnlocked = true;

    // Find and update exit tile
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === 'EXIT') {
          // Update tile to unlocked state
          grid.setTile(x, y, {
            type: 'EXIT_UNLOCKED',
            x: x,
            y: y,
            state: { unlocked: true }
          });
          console.log(`TurnManager: Exit unlocked at (${x}, ${y})`);
        }
      }
    }
  }

  /**
   * Execute shift system
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if shift was executed
   */
  executeShift(grid, gameState) {
    // Check if shift system is available
    if (!gameState.shiftSystem) {
      console.log('TurnManager: No shift system available');
      return false;
    }
    
    // Collect all entities that need to move with chunks
    const entities = [];
    
    // Add player
    if (gameState.player) {
      entities.push(gameState.player);
    }
    
    // Add enemies
    if (gameState.enemies && Array.isArray(gameState.enemies)) {
      entities.push(...gameState.enemies);
    }
    
    // Execute shift with entities
    return gameState.shiftSystem.executeShift(grid, entities);
  }

  /**
   * Resolve all hazards (traps and enemies)
   * Placeholder - will be implemented in Tasks 12-18
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   * @returns {HazardResult[]} Array of hazard results
   */
  resolveHazards(player, grid, gameState) {
    const hazardResults = [];
    
    // Update arrow trap timers FIRST
    this.updateArrowTraps(grid);
    
    // Then check for arrow traps that should fire (timer just reached 0)
    const arrowProjectiles = this.checkArrowTraps(grid);
    
    // Process arrow projectiles and check for player hits
    for (const projectile of arrowProjectiles) {
      const arrowPath = this.calculateArrowPath(projectile, grid);
      const playerPos = player.getGridPosition ? player.getGridPosition() : { x: player.gridX, y: player.gridY };
      
      // Check if player is in the arrow's path
      const hitPlayer = arrowPath.some(pos => pos.x === playerPos.x && pos.y === playerPos.y);
      
      if (hitPlayer) {
        // Deal damage to player
        const survived = this.applyDamage(player, 1, 'arrow trap');
        
        hazardResults.push({
          type: 'trap',
          damage: 1,
          position: { x: projectile.startX, y: projectile.startY },
          description: `Arrow trap fired ${projectile.direction}!`,
          survived: survived
        });
        
        console.log(`TurnManager: Arrow trap at (${projectile.startX}, ${projectile.startY}) hit player`);
      }
    }
    
    // Get player position - support both real Player objects and mock objects
    const playerPos = player.getGridPosition ? player.getGridPosition() : { x: player.gridX, y: player.gridY };
    const tile = grid.getTile(playerPos.x, playerPos.y);
    
    if (!tile) {
      return hazardResults;
    }

    // Check for spike traps
    if (tile.type === TileType.SPIKE_TRAP) {
      // Activate the spike trap
      if (!tile.state) {
        tile.state = {};
      }
      tile.state.active = true;
      
      // Deal damage to player
      const survived = this.applyDamage(player, 1, 'spike trap');
      
      hazardResults.push({
        type: 'trap',
        damage: 1,
        position: { x: playerPos.x, y: playerPos.y },
        description: 'Spike trap activated!',
        survived: survived
      });
      
      console.log(`TurnManager: Spike trap activated at (${playerPos.x}, ${playerPos.y})`);
    }

    // Check for cracked floors
    if (tile.type === TileType.CRACKED_FLOOR) {
      // Initialize crack level if not set
      if (!tile.state) {
        tile.state = { crackLevel: 0 };
      }
      if (tile.state.crackLevel === undefined) {
        tile.state.crackLevel = 0;
      }
      
      const currentCrackLevel = tile.state.crackLevel;
      
      if (currentCrackLevel === 0) {
        // First step: crack the floor (no damage)
        tile.state.crackLevel = 1;
        console.log(`TurnManager: Cracked floor at (${playerPos.x}, ${playerPos.y}) progressed to stage 1`);
        
        hazardResults.push({
          type: 'trap',
          damage: 0,
          position: { x: playerPos.x, y: playerPos.y },
          description: 'Floor cracked!',
          survived: true
        });
      } else if (currentCrackLevel === 1) {
        // Second step: break the floor and deal damage
        tile.state.crackLevel = 2;
        
        // Deal damage to player
        const survived = this.applyDamage(player, 1, 'cracked floor');
        
        // Convert tile to pit
        tile.type = TileType.PIT;
        
        console.log(`TurnManager: Cracked floor at (${playerPos.x}, ${playerPos.y}) broke and became a pit`);
        
        hazardResults.push({
          type: 'trap',
          damage: 1,
          position: { x: playerPos.x, y: playerPos.y },
          description: 'Floor collapsed!',
          survived: survived
        });
      }
    }

    // Update enemies and check for contact with player
    if (gameState.enemies && Array.isArray(gameState.enemies)) {
      for (const enemy of gameState.enemies) {
        // Update enemy AI
        // Patroller: update(grid)
        // Chaser: update(grid, player, turnNumber)
        // Guard: update(grid, player, turnNumber)
        if (enemy.update && typeof enemy.update === 'function') {
          if (enemy.type === 'CHASER' || enemy.type === 'GUARD') {
            enemy.update(grid, player, this.turnNumber);
          } else {
            enemy.update(grid);
          }
        }
        
        // Check for contact with player (Patroller and Chaser)
        const enemyPos = enemy.getGridPosition ? enemy.getGridPosition() : { x: enemy.gridX, y: enemy.gridY };
        if (enemyPos.x === playerPos.x && enemyPos.y === playerPos.y) {
          // Deal damage to player
          const survived = this.applyDamage(player, 1, `${enemy.type} enemy`);
          
          hazardResults.push({
            type: 'enemy',
            damage: 1,
            position: { x: enemyPos.x, y: enemyPos.y },
            description: `${enemy.type} enemy hit!`,
            survived: survived
          });
          
          console.log(`TurnManager: ${enemy.type} enemy at (${enemyPos.x}, ${enemyPos.y}) hit player`);
        }
        
        // Check for Guard attack (adjacent tiles on even turns)
        if (enemy.type === 'GUARD' && enemy.isAttacking && enemy.isPlayerAdjacent) {
          if (enemy.isPlayerAdjacent(player)) {
            // Deal damage to player
            const survived = this.applyDamage(player, 1, 'GUARD enemy attack');
            
            hazardResults.push({
              type: 'enemy',
              damage: 1,
              position: { x: enemyPos.x, y: enemyPos.y },
              description: 'GUARD enemy attacked!',
              survived: survived
            });
            
            console.log(`TurnManager: GUARD enemy at (${enemyPos.x}, ${enemyPos.y}) attacked adjacent player`);
          }
        }
      }
    }
    
    return hazardResults;
  }

  /**
   * Update all arrow trap timers on the grid
   * Decrements timers and resets them when they reach 0
   * @param {Object} grid - Game grid
   */
  updateArrowTraps(grid) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === TileType.ARROW_TRAP) {
          // Initialize timer if not set
          if (!tile.state) {
            tile.state = {
              arrowTimer: 3,
              arrowDirection: tile.state?.arrowDirection || 'UP'
            };
          }
          if (tile.state.arrowTimer === undefined) {
            tile.state.arrowTimer = 3;
          }
          
          // Don't decrement if timer is already 0 (will be reset by checkArrowTraps)
          if (tile.state.arrowTimer > 0) {
            tile.state.arrowTimer--;
            console.log(`TurnManager: Arrow trap at (${x}, ${y}) timer: ${tile.state.arrowTimer}`);
          }
        }
      }
    }
  }

  /**
   * Check for arrow traps that should fire and create projectiles
   * Called during hazard resolution
   * @param {Object} grid - Game grid
   * @returns {Array} Array of arrow projectiles
   */
  checkArrowTraps(grid) {
    const projectiles = [];
    
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === TileType.ARROW_TRAP) {
          // Fire when timer reaches 0
          if (tile.state?.arrowTimer === 0) {
            const direction = tile.state.arrowDirection || 'UP';
            
            projectiles.push({
              startX: x,
              startY: y,
              direction: direction
            });
            
            console.log(`TurnManager: Arrow trap at (${x}, ${y}) firing ${direction}`);
            
            // Reset timer after firing
            tile.state.arrowTimer = 3;
          }
        }
      }
    }
    
    return projectiles;
  }

  /**
   * Calculate the path of an arrow projectile
   * Returns array of positions the arrow travels through
   * @param {Object} projectile - Arrow projectile data
   * @param {Object} grid - Game grid
   * @returns {Array} Array of {x, y} positions
   */
  calculateArrowPath(projectile, grid) {
    const path = [];
    const { startX, startY, direction } = projectile;
    
    // Direction vectors
    const directionVectors = {
      'UP': { dx: 0, dy: -1 },
      'DOWN': { dx: 0, dy: 1 },
      'LEFT': { dx: -1, dy: 0 },
      'RIGHT': { dx: 1, dy: 0 }
    };
    
    const vector = directionVectors[direction] || directionVectors['UP'];
    
    // Start from the tile adjacent to the trap
    let x = startX + vector.dx;
    let y = startY + vector.dy;
    
    // Continue until hitting a wall or edge
    while (grid.isInBounds(x, y)) {
      const tile = grid.getTile(x, y);
      
      // Stop at walls (don't include the wall tile in path)
      if (tile.type === TileType.WALL) {
        break;
      }
      
      path.push({ x, y });
      
      // Move to next position
      x += vector.dx;
      y += vector.dy;
    }
    
    return path;
  }

  /**
   * Apply damage to player
   * Helper method for hazard resolution
   * @param {Object} player - Player entity
   * @param {number} amount - Damage amount
   * @param {string} source - Source of damage (for logging)
   * @returns {boolean} True if player survived
   */
  applyDamage(player, amount, source) {
    console.log(`TurnManager: Applying ${amount} damage from ${source}`);
    return player.takeDamage(amount);
  }

  /**
   * Check if win condition is met
   * Player must have all required keys and be on the exit tile
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   * @returns {boolean} True if player has won
   */
  checkWinCondition(player, grid, gameState) {
    // Get tile at player position
    const tile = grid.getTile(player.gridX, player.gridY);
    if (!tile) return false;
    
    // Check if player is on exit tile
    const onExit = tile.type === 'EXIT_UNLOCKED' || tile.type === 'EXIT';
    
    // Check if player has all required keys
    const hasAllKeys = gameState && gameState.keysRequired !== undefined
      ? player.keysCollected >= gameState.keysRequired
      : false;
    
    // Win if on exit and has all keys
    return onExit && hasAllKeys;
  }

  /**
   * Check if loss condition is met
   * Loss occurs when HP reaches 0 or collapse meter reaches 0
   * @param {Object} player - Player entity
   * @returns {boolean} True if player has lost
   */
  checkLossCondition(player) {
    // Check HP
    if (player.hp <= 0) {
      console.log('TurnManager: Loss condition - HP reached 0');
      return true;
    }
    
    // Check collapse meter
    if (this.collapseMeter <= 0) {
      console.log('TurnManager: Loss condition - Collapse meter reached 0');
      return true;
    }
    
    return false;
  }

  /**
   * Get current turn number
   * @returns {number} Current turn number
   */
  getTurnNumber() {
    return this.turnNumber;
  }

  /**
   * Get current collapse meter value
   * @returns {number} Current collapse meter value
   */
  getCollapseMeter() {
    return this.collapseMeter;
  }

  /**
   * Reset turn manager to initial state
   */
  reset() {
    this.turnNumber = 0;
    this.collapseMeter = this.initialCollapseMeter;
    console.log('TurnManager: Reset to initial state');
  }
  /**
   * Save current game state for undo functionality
   * Creates a deep copy of all relevant game state
   * @param {Object} player - Player entity
   * @param {Object} grid - Game grid
   * @param {Object} gameState - Current game state
   */
  saveState(player, grid, gameState) {
    console.log('TurnManager: Saving game state for undo');

    this.savedState = {
      // Turn manager state
      turnNumber: this.turnNumber,
      collapseMeter: this.collapseMeter,

      // Player state
      player: {
        gridX: player.gridX,
        gridY: player.gridY,
        hp: player.hp,
        keysCollected: player.keysCollected,
        inventory: player.inventory ? [...player.inventory] : [], // Shallow copy of inventory array
        activeShield: player.activeShield,
        phaseStepActive: player.phaseStepActive,
        facing: player.facing
      },

      // Grid state - deep copy of tiles
      grid: {
        width: grid.width,
        height: grid.height,
        tiles: this.cloneGridTiles(grid)
      },

      // Game state
      gameState: {
        keysRequired: gameState.keysRequired,
        exitUnlocked: gameState.exitUnlocked,
        enemies: this.cloneEnemies(gameState.enemies),
        items: [...(gameState.items || [])],
        // Store shift system state (pattern.currentIndex)
        shiftSystemIndex: gameState.shiftSystem && gameState.shiftSystem.pattern 
          ? gameState.shiftSystem.pattern.currentIndex 
          : 0
      }
    };

    console.log('TurnManager: Game state saved successfully');
  }

  /**
   * Clone grid tiles for state saving
   * Creates a deep copy of the tile array
   * @param {Object} grid - Game grid
   * @returns {Array} Cloned tile array
   */
  cloneGridTiles(grid) {
    const clonedTiles = [];

    for (let y = 0; y < grid.height; y++) {
      clonedTiles[y] = [];
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile) {
          // Deep copy tile with state
          clonedTiles[y][x] = {
            type: tile.type,
            x: tile.x,
            y: tile.y,
            state: tile.state ? { ...tile.state } : undefined
          };
        } else {
          clonedTiles[y][x] = null;
        }
      }
    }

    return clonedTiles;
  }

  /**
   * Clone enemies for state saving
   * Creates a deep copy of enemy array with positions and state
   * @param {Array} enemies - Array of enemy entities
   * @returns {Array} Cloned enemy data
   */
  cloneEnemies(enemies) {
    if (!enemies || !Array.isArray(enemies)) {
      return [];
    }

    return enemies.map(enemy => ({
      type: enemy.type,
      gridX: enemy.gridX,
      gridY: enemy.gridY,
      facing: enemy.facing,
      patrolPath: enemy.patrolPath ? [...enemy.patrolPath] : undefined,
      patrolIndex: enemy.patrolIndex,
      moveTimer: enemy.moveTimer,
      attackTimer: enemy.attackTimer,
      isAttacking: enemy.isAttacking
    }));
  }
  /**
   * Restore previously saved game state (undo)
   * Returns false if no saved state exists
   * @param {Object} player - Player entity to restore
   * @param {Object} grid - Game grid to restore
   * @param {Object} gameState - Game state to restore
   * @returns {boolean} True if state was restored successfully
   */
  restoreState(player, grid, gameState) {
    if (!this.savedState) {
      console.log('TurnManager: No saved state available for undo');
      return false;
    }

    console.log('TurnManager: Restoring game state from undo');

    // Restore turn manager state
    this.turnNumber = this.savedState.turnNumber;
    this.collapseMeter = this.savedState.collapseMeter;

    // Restore player state
    player.gridX = this.savedState.player.gridX;
    player.gridY = this.savedState.player.gridY;
    player.hp = this.savedState.player.hp;
    player.keysCollected = this.savedState.player.keysCollected;
    player.inventory = [...this.savedState.player.inventory];
    player.activeShield = this.savedState.player.activeShield;
    player.phaseStepActive = this.savedState.player.phaseStepActive;
    player.facing = this.savedState.player.facing;

    // Update player sprite position
    if (player.sprite && this.scene.tileRenderer) {
      const pos = this.scene.tileRenderer.getScreenPosition(player.gridX, player.gridY);
      player.sprite.setPosition(pos.x, pos.y);
    }

    // Restore grid state
    this.restoreGridTiles(grid, this.savedState.grid.tiles);

    // Restore game state
    gameState.keysRequired = this.savedState.gameState.keysRequired;
    gameState.exitUnlocked = this.savedState.gameState.exitUnlocked;
    gameState.items = [...this.savedState.gameState.items];

    // Restore shift system index
    if (gameState.shiftSystem && gameState.shiftSystem.pattern && 
        this.savedState.gameState.shiftSystemIndex !== undefined) {
      gameState.shiftSystem.pattern.currentIndex = this.savedState.gameState.shiftSystemIndex;
    }

    // Restore enemies
    this.restoreEnemies(gameState.enemies, this.savedState.gameState.enemies);

    // Clear saved state after restore (undo can only be used once)
    this.savedState = null;

    console.log('TurnManager: Game state restored successfully');
    return true;
  }

  /**
   * Restore grid tiles from saved state
   * @param {Object} grid - Game grid to restore
   * @param {Array} savedTiles - Saved tile array
   */
  restoreGridTiles(grid, savedTiles) {
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const savedTile = savedTiles[y][x];
        if (savedTile) {
          grid.setTile(x, y, {
            type: savedTile.type,
            x: savedTile.x,
            y: savedTile.y,
            state: savedTile.state ? { ...savedTile.state } : undefined
          });
        }
      }
    }
  }

  /**
   * Restore enemies from saved state
   * @param {Array} enemies - Current enemy array
   * @param {Array} savedEnemies - Saved enemy data
   */
  restoreEnemies(enemies, savedEnemies) {
    if (!enemies || !Array.isArray(enemies) || !savedEnemies) {
      return;
    }

    // Restore each enemy's state
    for (let i = 0; i < Math.min(enemies.length, savedEnemies.length); i++) {
      const enemy = enemies[i];
      const savedEnemy = savedEnemies[i];

      enemy.gridX = savedEnemy.gridX;
      enemy.gridY = savedEnemy.gridY;
      enemy.facing = savedEnemy.facing;
      enemy.patrolIndex = savedEnemy.patrolIndex;
      enemy.moveTimer = savedEnemy.moveTimer;
      enemy.attackTimer = savedEnemy.attackTimer;
      enemy.isAttacking = savedEnemy.isAttacking;

      // Update enemy sprite position if it exists
      if (enemy.sprite && this.scene.tileRenderer) {
        const pos = this.scene.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
        enemy.sprite.setPosition(pos.x, pos.y);
      }
    }
  }




}
