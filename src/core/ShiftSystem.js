/**
 * ShiftSystem - Manages dungeon reconfiguration after player moves
 * Responsibilities:
 * - Execute shift operations (swap, rotate, slide)
 * - Manage shift patterns and sequences
 * - Move entities with their chunks during shifts
 */

/**
 * Shift types
 */
export const ShiftType = {
  ROOM_SWAP: 'ROOM_SWAP',
  ROOM_ROTATE: 'ROOM_ROTATE',
  ROW_COLUMN_SLIDE: 'ROW_COLUMN_SLIDE'
};

/**
 * @typedef {Object} ShiftPattern
 * @property {string} type - Type of shift (ROOM_SWAP, ROOM_ROTATE, ROW_COLUMN_SLIDE)
 * @property {ShiftOperation[]} sequence - Array of shift operations in order
 * @property {number} currentIndex - Current position in sequence
 */

/**
 * @typedef {Object} ShiftOperation
 * @property {string} type - Type of shift operation
 * @property {Object} params - Parameters for the operation
 */

/**
 * @typedef {Object} SwapParams
 * @property {number} chunkA - ID of first chunk to swap
 * @property {number} chunkB - ID of second chunk to swap
 */

/**
 * ShiftSystem class - manages dungeon reconfiguration
 */
export class ShiftSystem {
  /**
   * Create a new ShiftSystem
   * @param {ShiftPattern} pattern - Shift pattern to use
   * @param {Object} chunkManager - ChunkManager instance
   */
  constructor(pattern, chunkManager) {
    if (!pattern) {
      throw new Error('ShiftSystem requires a valid pattern');
    }
    if (!chunkManager) {
      throw new Error('ShiftSystem requires a valid chunkManager');
    }
    
    this.pattern = pattern;
    this.chunkManager = chunkManager;
    
    console.log(`ShiftSystem: Initialized with ${pattern.type} pattern`);
  }

  /**
   * Get the next shift operation in the sequence
   * @returns {ShiftOperation} Next operation to execute
   */
  getNextOperation() {
    const operation = this.pattern.sequence[this.pattern.currentIndex];
    return operation;
  }

  /**
   * Execute the next shift operation
   * @param {Object} grid - Grid instance
   * @param {Array} entities - Array of entities to move with chunks
   * @returns {boolean} True if shift was executed
   */
  executeShift(grid, entities = []) {
    const operation = this.getNextOperation();
    
    if (!operation) {
      console.warn('ShiftSystem: No operation to execute');
      return false;
    }
    
    console.log(`ShiftSystem: Executing ${operation.type} operation`);
    
    // Execute based on operation type
    switch (operation.type) {
      case ShiftType.ROOM_SWAP:
        this.swapChunks(grid, operation.params, entities);
        break;
      case ShiftType.ROOM_ROTATE:
        this.rotateChunk(grid, operation.params, entities);
        break;
      case ShiftType.ROW_COLUMN_SLIDE:
        this.slideRowColumn(grid, operation.params, entities);
        break;
      default:
        console.warn(`ShiftSystem: Unknown operation type: ${operation.type}`);
        return false;
    }
    
    // Advance to next operation in sequence
    this.pattern.currentIndex = (this.pattern.currentIndex + 1) % this.pattern.sequence.length;
    
    return true;
  }

  /**
   * Swap two chunks
   * @param {Object} grid - Grid instance
   * @param {SwapParams} params - Swap parameters
   * @param {Array} entities - Array of entities to move
   */
  swapChunks(grid, params, entities = []) {
    const chunkA = this.chunkManager.getChunkById(params.chunkA);
    const chunkB = this.chunkManager.getChunkById(params.chunkB);
    
    if (!chunkA || !chunkB) {
      console.error(`ShiftSystem: Cannot swap - invalid chunk IDs: ${params.chunkA}, ${params.chunkB}`);
      return;
    }
    
    // Check if chunks are anchored
    if (!this.chunkManager.canShiftChunk(params.chunkA)) {
      console.log(`ShiftSystem: Chunk ${params.chunkA} is anchored, skipping swap`);
      return;
    }
    if (!this.chunkManager.canShiftChunk(params.chunkB)) {
      console.log(`ShiftSystem: Chunk ${params.chunkB} is anchored, skipping swap`);
      return;
    }
    
    console.log(`ShiftSystem: Swapping chunk ${params.chunkA} ↔ chunk ${params.chunkB}`);
    
    // Store tiles from both chunks
    const tilesA = this.extractChunkTiles(grid, chunkA);
    const tilesB = this.extractChunkTiles(grid, chunkB);
    
    // Swap tiles
    this.placeChunkTiles(grid, chunkB, tilesA);
    this.placeChunkTiles(grid, chunkA, tilesB);
    
    // Move entities with their chunks
    this.moveEntitiesWithSwap(entities, chunkA, chunkB);
  }

  /**
   * Extract tiles from a chunk
   * @param {Object} grid - Grid instance
   * @param {Object} chunk - Chunk to extract from
   * @returns {Array} 2D array of tiles
   */
  extractChunkTiles(grid, chunk) {
    const tiles = [];
    for (let y = 0; y < chunk.height; y++) {
      const row = [];
      for (let x = 0; x < chunk.width; x++) {
        const tile = grid.getTile(chunk.x + x, chunk.y + y);
        // Create a copy of the tile
        row.push({ ...tile });
      }
      tiles.push(row);
    }
    return tiles;
  }

  /**
   * Place tiles into a chunk
   * @param {Object} grid - Grid instance
   * @param {Object} chunk - Chunk to place into
   * @param {Array} tiles - 2D array of tiles to place
   */
  placeChunkTiles(grid, chunk, tiles) {
    for (let y = 0; y < chunk.height; y++) {
      for (let x = 0; x < chunk.width; x++) {
        if (tiles[y] && tiles[y][x]) {
          const tile = tiles[y][x];
          // Update tile coordinates to new position
          tile.x = chunk.x + x;
          tile.y = chunk.y + y;
          grid.setTile(chunk.x + x, chunk.y + y, tile);
        }
      }
    }
  }

  /**
   * Move entities that are in swapping chunks
   * @param {Array} entities - Array of entities
   * @param {Object} chunkA - First chunk
   * @param {Object} chunkB - Second chunk
   */
  moveEntitiesWithSwap(entities, chunkA, chunkB) {
    if (!entities || entities.length === 0) {
      return;
    }
    
    for (const entity of entities) {
      // Check if entity has grid position
      if (entity.gridX === undefined || entity.gridY === undefined) {
        continue;
      }
      
      // Check if entity is in chunk A
      if (this.isInChunk(entity, chunkA)) {
        const offsetX = entity.gridX - chunkA.x;
        const offsetY = entity.gridY - chunkA.y;
        const newX = chunkB.x + offsetX;
        const newY = chunkB.y + offsetY;
        
        console.log(`ShiftSystem: Moving entity from (${entity.gridX}, ${entity.gridY}) to (${newX}, ${newY})`);
        
        if (entity.moveTo) {
          entity.moveTo(newX, newY);
        } else {
          entity.gridX = newX;
          entity.gridY = newY;
        }
        
        // Update patrol path for Patroller enemies
        if (entity.type === 'PATROLLER' && entity.patrolPath) {
          entity.patrolPath = this.updatePatrolPathAfterSwap(entity.patrolPath, chunkA, chunkB);
        }
      }
      // Check if entity is in chunk B
      else if (this.isInChunk(entity, chunkB)) {
        const offsetX = entity.gridX - chunkB.x;
        const offsetY = entity.gridY - chunkB.y;
        const newX = chunkA.x + offsetX;
        const newY = chunkA.y + offsetY;
        
        console.log(`ShiftSystem: Moving entity from (${entity.gridX}, ${entity.gridY}) to (${newX}, ${newY})`);
        
        if (entity.moveTo) {
          entity.moveTo(newX, newY);
        } else {
          entity.gridX = newX;
          entity.gridY = newY;
        }
        
        // Update patrol path for Patroller enemies
        if (entity.type === 'PATROLLER' && entity.patrolPath) {
          entity.patrolPath = this.updatePatrolPathAfterSwap(entity.patrolPath, chunkB, chunkA);
        }
      }
    }
  }

  /**
   * Check if an entity is within a chunk's boundaries
   * @param {Object} entity - Entity to check
   * @param {Object} chunk - Chunk to check against
   * @returns {boolean} True if entity is in chunk
   */
  isInChunk(entity, chunk) {
    return entity.gridX >= chunk.x &&
           entity.gridX < chunk.x + chunk.width &&
           entity.gridY >= chunk.y &&
           entity.gridY < chunk.y + chunk.height;
  }

  /**
   * Create a default room swap pattern
   * Swaps diagonal chunks in sequence: 0↔3, 1↔2, 0↔1, 2↔3
   * @returns {ShiftPattern} Room swap pattern
   */
  static createRoomSwapPattern() {
    return {
      type: ShiftType.ROOM_SWAP,
      currentIndex: 0,
      sequence: [
        {
          type: ShiftType.ROOM_SWAP,
          params: { chunkA: 0, chunkB: 3 } // Top-left ↔ Bottom-right
        },
        {
          type: ShiftType.ROOM_SWAP,
          params: { chunkA: 1, chunkB: 2 } // Top-right ↔ Bottom-left
        },
        {
          type: ShiftType.ROOM_SWAP,
          params: { chunkA: 0, chunkB: 1 } // Top-left ↔ Top-right
        },
        {
          type: ShiftType.ROOM_SWAP,
          params: { chunkA: 2, chunkB: 3 } // Bottom-left ↔ Bottom-right
        }
      ]
    };
  }

  /**
   * Rotate a chunk 90 degrees clockwise
   * @param {Object} grid - Grid instance
   * @param {Object} params - Rotation parameters
   * @param {Array} entities - Array of entities to move
   */
  rotateChunk(grid, params, entities = []) {
    const chunk = this.chunkManager.getChunkById(params.chunkId);
    
    if (!chunk) {
      console.error(`ShiftSystem: Cannot rotate - invalid chunk ID: ${params.chunkId}`);
      return;
    }
    
    // Check if chunk is anchored
    if (!this.chunkManager.canShiftChunk(params.chunkId)) {
      console.log(`ShiftSystem: Chunk ${params.chunkId} is anchored, skipping rotation`);
      return;
    }
    
    console.log(`ShiftSystem: Rotating chunk ${params.chunkId} clockwise`);
    
    // Extract tiles from chunk
    const tiles = this.extractChunkTiles(grid, chunk);
    
    // Rotate tiles 90 degrees clockwise
    const rotatedTiles = this.rotateTilesClockwise(tiles);
    
    // Place rotated tiles back into chunk
    this.placeChunkTiles(grid, chunk, rotatedTiles);
    
    // Rotate entities within the chunk
    this.rotateEntitiesInChunk(entities, chunk);
  }

  /**
   * Rotate a 2D array of tiles 90 degrees clockwise
   * @param {Array} tiles - 2D array of tiles
   * @returns {Array} Rotated 2D array
   */
  rotateTilesClockwise(tiles) {
    const height = tiles.length;
    const width = tiles[0].length;
    const rotated = [];
    
    // For clockwise rotation: new[x][y] = old[height-1-y][x]
    for (let x = 0; x < width; x++) {
      const row = [];
      for (let y = height - 1; y >= 0; y--) {
        row.push(tiles[y][x]);
      }
      rotated.push(row);
    }
    
    return rotated;
  }

  /**
   * Rotate entities within a chunk 90 degrees clockwise
   * @param {Array} entities - Array of entities
   * @param {Object} chunk - Chunk being rotated
   */
  rotateEntitiesInChunk(entities, chunk) {
    if (!entities || entities.length === 0) {
      return;
    }
    
    for (const entity of entities) {
      // Check if entity has grid position
      if (entity.gridX === undefined || entity.gridY === undefined) {
        continue;
      }
      
      // Check if entity is in this chunk
      if (this.isInChunk(entity, chunk)) {
        // Calculate offset from chunk origin
        const offsetX = entity.gridX - chunk.x;
        const offsetY = entity.gridY - chunk.y;
        
        // Rotate offset 90 degrees clockwise
        // (x, y) -> (height - 1 - y, x)
        const newOffsetX = chunk.height - 1 - offsetY;
        const newOffsetY = offsetX;
        
        // Calculate new position
        const newX = chunk.x + newOffsetX;
        const newY = chunk.y + newOffsetY;
        
        console.log(`ShiftSystem: Rotating entity from (${entity.gridX}, ${entity.gridY}) to (${newX}, ${newY})`);
        
        if (entity.moveTo) {
          entity.moveTo(newX, newY);
        } else {
          entity.gridX = newX;
          entity.gridY = newY;
        }
        
        // Update entity facing direction if it has one
        if (entity.facing) {
          entity.facing = this.rotateFacingClockwise(entity.facing);
        }
        
        // Update patrol path for Patroller enemies
        if (entity.type === 'PATROLLER' && entity.patrolPath) {
          entity.patrolPath = this.rotatePatrolPath(entity.patrolPath, chunk);
        }
      }
    }
  }

  /**
   * Update patrol path coordinates after a swap
   * @param {Array} patrolPath - Array of {x, y} positions
   * @param {Object} fromChunk - Source chunk
   * @param {Object} toChunk - Destination chunk
   * @returns {Array} Updated patrol path
   */
  updatePatrolPathAfterSwap(patrolPath, fromChunk, toChunk) {
    return patrolPath.map(pos => {
      // Check if position is in the from chunk
      if (pos.x >= fromChunk.x && pos.x < fromChunk.x + fromChunk.width &&
          pos.y >= fromChunk.y && pos.y < fromChunk.y + fromChunk.height) {
        // Calculate offset from chunk origin
        const offsetX = pos.x - fromChunk.x;
        const offsetY = pos.y - fromChunk.y;
        
        // Calculate new position in destination chunk
        return {
          x: toChunk.x + offsetX,
          y: toChunk.y + offsetY
        };
      }
      return pos;
    });
  }

  /**
   * Rotate a facing direction 90 degrees clockwise
   * @param {string} facing - Current facing direction (up, down, left, right)
   * @returns {string} New facing direction
   */
  rotateFacingClockwise(facing) {
    const rotationMap = {
      'up': 'right',
      'right': 'down',
      'down': 'left',
      'left': 'up'
    };
    return rotationMap[facing] || facing;
  }

  /**
   * Rotate a patrol path 90 degrees clockwise within a chunk
   * @param {Array} patrolPath - Array of {x, y} positions
   * @param {Object} chunk - Chunk being rotated
   * @returns {Array} Rotated patrol path
   */
  rotatePatrolPath(patrolPath, chunk) {
    return patrolPath.map(pos => {
      // Calculate offset from chunk origin
      const offsetX = pos.x - chunk.x;
      const offsetY = pos.y - chunk.y;
      
      // Rotate offset 90 degrees clockwise
      const newOffsetX = chunk.height - 1 - offsetY;
      const newOffsetY = offsetX;
      
      // Calculate new position
      return {
        x: chunk.x + newOffsetX,
        y: chunk.y + newOffsetY
      };
    });
  }

  /**
   * Slide a row or column with wrap-around
   * @param {Object} grid - Grid instance
   * @param {Object} params - Slide parameters {axis: 'row'|'column', index: number, direction: 'left'|'right'|'up'|'down'}
   * @param {Array} entities - Array of entities to move
   */
  slideRowColumn(grid, params, entities = []) {
    const { axis, index, direction } = params;
    
    if (axis === 'row') {
      this.slideRow(grid, index, direction, entities);
    } else if (axis === 'column') {
      this.slideColumn(grid, index, direction, entities);
    } else {
      console.error(`ShiftSystem: Invalid axis: ${axis}`);
    }
  }

  /**
   * Slide a row left or right with wrap-around
   * @param {Object} grid - Grid instance
   * @param {number} rowIndex - Row to slide
   * @param {string} direction - 'left' or 'right'
   * @param {Array} entities - Array of entities to move
   */
  slideRow(grid, rowIndex, direction, entities = []) {
    if (rowIndex < 0 || rowIndex >= grid.height) {
      console.error(`ShiftSystem: Invalid row index: ${rowIndex}`);
      return;
    }
    
    console.log(`ShiftSystem: Sliding row ${rowIndex} ${direction}`);
    
    // Extract all tiles in the row
    const rowTiles = [];
    for (let x = 0; x < grid.width; x++) {
      rowTiles.push(grid.getTile(x, rowIndex));
    }
    
    // Slide tiles with wrap-around
    let shiftedTiles;
    if (direction === 'right') {
      // Move last tile to front
      shiftedTiles = [rowTiles[rowTiles.length - 1], ...rowTiles.slice(0, -1)];
    } else if (direction === 'left') {
      // Move first tile to end
      shiftedTiles = [...rowTiles.slice(1), rowTiles[0]];
    } else {
      console.error(`ShiftSystem: Invalid direction for row: ${direction}`);
      return;
    }
    
    // Place shifted tiles back
    for (let x = 0; x < grid.width; x++) {
      const tile = { ...shiftedTiles[x] };
      tile.x = x;
      tile.y = rowIndex;
      grid.setTile(x, rowIndex, tile);
    }
    
    // Move entities in the row
    this.moveEntitiesWithRowSlide(entities, rowIndex, direction, grid.width);
  }

  /**
   * Slide a column up or down with wrap-around
   * @param {Object} grid - Grid instance
   * @param {number} colIndex - Column to slide
   * @param {string} direction - 'up' or 'down'
   * @param {Array} entities - Array of entities to move
   */
  slideColumn(grid, colIndex, direction, entities = []) {
    if (colIndex < 0 || colIndex >= grid.width) {
      console.error(`ShiftSystem: Invalid column index: ${colIndex}`);
      return;
    }
    
    console.log(`ShiftSystem: Sliding column ${colIndex} ${direction}`);
    
    // Extract all tiles in the column
    const colTiles = [];
    for (let y = 0; y < grid.height; y++) {
      colTiles.push(grid.getTile(colIndex, y));
    }
    
    // Slide tiles with wrap-around
    let shiftedTiles;
    if (direction === 'down') {
      // Move last tile to front
      shiftedTiles = [colTiles[colTiles.length - 1], ...colTiles.slice(0, -1)];
    } else if (direction === 'up') {
      // Move first tile to end
      shiftedTiles = [...colTiles.slice(1), colTiles[0]];
    } else {
      console.error(`ShiftSystem: Invalid direction for column: ${direction}`);
      return;
    }
    
    // Place shifted tiles back
    for (let y = 0; y < grid.height; y++) {
      const tile = { ...shiftedTiles[y] };
      tile.x = colIndex;
      tile.y = y;
      grid.setTile(colIndex, y, tile);
    }
    
    // Move entities in the column
    this.moveEntitiesWithColumnSlide(entities, colIndex, direction, grid.height);
  }

  /**
   * Move entities in a sliding row
   * @param {Array} entities - Array of entities
   * @param {number} rowIndex - Row being slid
   * @param {string} direction - 'left' or 'right'
   * @param {number} gridWidth - Width of the grid
   */
  moveEntitiesWithRowSlide(entities, rowIndex, direction, gridWidth) {
    if (!entities || entities.length === 0) {
      return;
    }
    
    for (const entity of entities) {
      // Check if entity has grid position
      if (entity.gridX === undefined || entity.gridY === undefined) {
        continue;
      }
      
      // Check if entity is in this row
      if (entity.gridY === rowIndex) {
        let newX;
        if (direction === 'right') {
          newX = (entity.gridX + 1) % gridWidth;
        } else if (direction === 'left') {
          newX = (entity.gridX - 1 + gridWidth) % gridWidth;
        } else {
          continue;
        }
        
        console.log(`ShiftSystem: Moving entity from (${entity.gridX}, ${entity.gridY}) to (${newX}, ${entity.gridY})`);
        
        if (entity.moveTo) {
          entity.moveTo(newX, entity.gridY);
        } else {
          entity.gridX = newX;
        }
        
        // Update patrol path for Patroller enemies
        if (entity.type === 'PATROLLER' && entity.patrolPath) {
          entity.patrolPath = this.updatePatrolPathAfterRowSlide(entity.patrolPath, rowIndex, direction, gridWidth);
        }
      }
    }
  }

  /**
   * Move entities in a sliding column
   * @param {Array} entities - Array of entities
   * @param {number} colIndex - Column being slid
   * @param {string} direction - 'up' or 'down'
   * @param {number} gridHeight - Height of the grid
   */
  moveEntitiesWithColumnSlide(entities, colIndex, direction, gridHeight) {
    if (!entities || entities.length === 0) {
      return;
    }
    
    for (const entity of entities) {
      // Check if entity has grid position
      if (entity.gridX === undefined || entity.gridY === undefined) {
        continue;
      }
      
      // Check if entity is in this column
      if (entity.gridX === colIndex) {
        let newY;
        if (direction === 'down') {
          newY = (entity.gridY + 1) % gridHeight;
        } else if (direction === 'up') {
          newY = (entity.gridY - 1 + gridHeight) % gridHeight;
        } else {
          continue;
        }
        
        console.log(`ShiftSystem: Moving entity from (${entity.gridX}, ${entity.gridY}) to (${entity.gridX}, ${newY})`);
        
        if (entity.moveTo) {
          entity.moveTo(entity.gridX, newY);
        } else {
          entity.gridY = newY;
        }
        
        // Update patrol path for Patroller enemies
        if (entity.type === 'PATROLLER' && entity.patrolPath) {
          entity.patrolPath = this.updatePatrolPathAfterColumnSlide(entity.patrolPath, colIndex, direction, gridHeight);
        }
      }
    }
  }

  /**
   * Update patrol path coordinates after a row slide
   * @param {Array} patrolPath - Array of {x, y} positions
   * @param {number} rowIndex - Row being slid
   * @param {string} direction - 'left' or 'right'
   * @param {number} gridWidth - Width of the grid
   * @returns {Array} Updated patrol path
   */
  updatePatrolPathAfterRowSlide(patrolPath, rowIndex, direction, gridWidth) {
    return patrolPath.map(pos => {
      if (pos.y === rowIndex) {
        let newX;
        if (direction === 'right') {
          newX = (pos.x + 1) % gridWidth;
        } else if (direction === 'left') {
          newX = (pos.x - 1 + gridWidth) % gridWidth;
        } else {
          return pos;
        }
        return { x: newX, y: pos.y };
      }
      return pos;
    });
  }

  /**
   * Update patrol path coordinates after a column slide
   * @param {Array} patrolPath - Array of {x, y} positions
   * @param {number} colIndex - Column being slid
   * @param {string} direction - 'up' or 'down'
   * @param {number} gridHeight - Height of the grid
   * @returns {Array} Updated patrol path
   */
  updatePatrolPathAfterColumnSlide(patrolPath, colIndex, direction, gridHeight) {
    return patrolPath.map(pos => {
      if (pos.x === colIndex) {
        let newY;
        if (direction === 'down') {
          newY = (pos.y + 1) % gridHeight;
        } else if (direction === 'up') {
          newY = (pos.y - 1 + gridHeight) % gridHeight;
        } else {
          return pos;
        }
        return { x: pos.x, y: newY };
      }
      return pos;
    });
  }

  /**
   * Create a default room rotate pattern
   * Rotates each chunk in sequence: 0, 1, 2, 3
   * @returns {ShiftPattern} Room rotate pattern
   */
  static createRoomRotatePattern() {
    return {
      type: ShiftType.ROOM_ROTATE,
      currentIndex: 0,
      sequence: [
        {
          type: ShiftType.ROOM_ROTATE,
          params: { chunkId: 0 } // Top-left
        },
        {
          type: ShiftType.ROOM_ROTATE,
          params: { chunkId: 1 } // Top-right
        },
        {
          type: ShiftType.ROOM_ROTATE,
          params: { chunkId: 2 } // Bottom-left
        },
        {
          type: ShiftType.ROOM_ROTATE,
          params: { chunkId: 3 } // Bottom-right
        }
      ]
    };
  }

  /**
   * Create a default row/column slide pattern
   * Slides rows and columns in sequence with wrap-around
   * @param {number} gridWidth - Width of the grid
   * @param {number} gridHeight - Height of the grid
   * @returns {ShiftPattern} Row/column slide pattern
   */
  static createRowColumnSlidePattern(gridWidth, gridHeight) {
    return {
      type: ShiftType.ROW_COLUMN_SLIDE,
      currentIndex: 0,
      sequence: [
        {
          type: ShiftType.ROW_COLUMN_SLIDE,
          params: { axis: 'row', index: 0, direction: 'right' }
        },
        {
          type: ShiftType.ROW_COLUMN_SLIDE,
          params: { axis: 'column', index: 0, direction: 'down' }
        },
        {
          type: ShiftType.ROW_COLUMN_SLIDE,
          params: { axis: 'row', index: gridHeight - 1, direction: 'left' }
        },
        {
          type: ShiftType.ROW_COLUMN_SLIDE,
          params: { axis: 'column', index: gridWidth - 1, direction: 'up' }
        }
      ]
    };
  }
}
