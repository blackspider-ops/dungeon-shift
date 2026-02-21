/**
 * Grid System for Dungeon Shift
 * Manages the 2D array of tiles that make up the dungeon layout
 */

/**
 * @typedef {Object} TileState
 * @property {number} [crackLevel] - 0 = intact, 1 = cracked, 2 = broken
 * @property {number} [arrowTimer] - Countdown to next arrow fire
 * @property {string} [arrowDirection] - Direction arrow will fire
 */

/**
 * @typedef {Object} Tile
 * @property {string} type - Type of tile (FLOOR, WALL, SPIKE_TRAP, etc.)
 * @property {number} x - X coordinate in grid
 * @property {number} y - Y coordinate in grid
 * @property {TileState} [state] - Optional state for dynamic tiles
 * @property {Object} [entity] - Entity occupying this tile
 * @property {Object} [item] - Item on this tile
 * @property {Object} [trap] - Trap on this tile
 */

/**
 * Tile types enum
 */
export const TileType = {
  FLOOR: 'FLOOR',
  WALL: 'WALL',
  SPIKE_TRAP: 'SPIKE_TRAP',
  SPIKE_TRAP_ACTIVE: 'SPIKE_TRAP_ACTIVE',
  CRACKED_FLOOR: 'CRACKED_FLOOR',
  CRACKED_FLOOR_2: 'CRACKED_FLOOR_2',
  ARROW_TRAP: 'ARROW_TRAP',
  SLIME: 'SLIME',
  EXIT: 'EXIT',
  EXIT_UNLOCKED: 'EXIT_UNLOCKED',
  PIT: 'PIT',
  KEY: 'KEY',
  DOOR_LOCKED: 'DOOR_LOCKED',
  DOOR_UNLOCKED: 'DOOR_UNLOCKED',
  UNDO: 'UNDO',
  ANCHOR: 'ANCHOR',
  PHASE_STEP: 'PHASE_STEP',
  SHIELD: 'SHIELD',
  SWITCH: 'SWITCH'
};

/**
 * Grid class - manages the 2D dungeon layout
 */
export class Grid {
  /**
   * Create a new Grid
   * @param {number} width - Width of the grid in tiles
   * @param {number} height - Height of the grid in tiles
   */
  constructor(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error('Grid dimensions must be positive');
    }
    
    this.width = width;
    this.height = height;
    this.tiles = this._initializeTiles();
  }

  /**
   * Initialize the 2D tile array with floor tiles
   * @private
   * @returns {Tile[][]} 2D array of tiles
   */
  _initializeTiles() {
    const tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({
          type: TileType.FLOOR,
          x: x,
          y: y
        });
      }
      tiles.push(row);
    }
    return tiles;
  }

  /**
   * Get a tile at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Tile|null} The tile at the coordinates, or null if out of bounds
   */
  getTile(x, y) {
    if (!this.isInBounds(x, y)) {
      return null;
    }
    return this.tiles[y][x];
  }

  /**
   * Set a tile at the specified coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Tile} tile - The tile to set
   */
  setTile(x, y, tile) {
    if (!this.isInBounds(x, y)) {
      throw new Error(`Cannot set tile at (${x}, ${y}): out of bounds`);
    }
    // Ensure tile has correct coordinates
    tile.x = x;
    tile.y = y;
    this.tiles[y][x] = tile;
  }

  /**
   * Check if coordinates are within grid bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if coordinates are in bounds
   */
  isInBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Check if a tile is walkable (not a wall or pit)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if the tile can be walked on
   */
  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) {
      return false;
    }
    // Walls, pits, and locked doors are not walkable
    return tile.type !== TileType.WALL && 
           tile.type !== TileType.PIT && 
           tile.type !== TileType.DOOR_LOCKED;
  }

  /**
   * Get chunks for shift operations
   * @returns {Array} Array of chunks
   */
  getChunks() {
    // Chunks are managed by ChunkManager
    // This method is kept for backwards compatibility
    return [];
  }
}
