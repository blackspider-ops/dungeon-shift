/**
 * ChunkManager - Manages grid subdivision for shift operations
 * Responsibilities:
 * - Divide grid into chunks (2x2 pattern for room swap/rotate)
 * - Track chunk positions and boundaries
 * - Handle anchor system (prevent chunks from shifting)
 */

/**
 * @typedef {Object} Chunk
 * @property {number} id - Unique chunk identifier (0-3 for 2x2 pattern)
 * @property {number} x - Top-left corner X coordinate in grid
 * @property {number} y - Top-left corner Y coordinate in grid
 * @property {number} width - Width of chunk in tiles
 * @property {number} height - Height of chunk in tiles
 * @property {boolean} isAnchored - Whether chunk is anchored (cannot shift)
 * @property {number} anchorTurnsRemaining - Turns remaining for anchor effect
 */

/**
 * Chunk pattern types
 */
export const ChunkPattern = {
  FOUR_QUADRANTS: 'FOUR_QUADRANTS' // 2x2 pattern
};

/**
 * ChunkManager class - manages grid subdivision
 */
export class ChunkManager {
  /**
   * Create a new ChunkManager
   * @param {Object} grid - Grid instance to subdivide
   * @param {string} chunkPattern - Pattern to use for subdivision (default: FOUR_QUADRANTS)
   */
  constructor(grid, chunkPattern = ChunkPattern.FOUR_QUADRANTS) {
    if (!grid) {
      throw new Error('ChunkManager requires a valid grid');
    }
    
    this.grid = grid;
    this.chunkPattern = chunkPattern;
    this.chunks = [];
    
    // Divide grid into chunks
    this.divideGrid();
    
    console.log(`ChunkManager: Created ${this.chunks.length} chunks using ${chunkPattern} pattern`);
  }

  /**
   * Divide the grid into chunks based on the pattern
   * For FOUR_QUADRANTS: Creates a 2x2 grid of chunks with even subdivision
   */
  divideGrid() {
    if (this.chunkPattern === ChunkPattern.FOUR_QUADRANTS) {
      this.divideFourQuadrants();
    } else {
      throw new Error(`Unsupported chunk pattern: ${this.chunkPattern}`);
    }
  }

  /**
   * Divide grid into 4 quadrants (2x2 pattern)
   * Uses even subdivision - if dimensions are odd, the border tiles are excluded
   * 
   * Layout:
   * ┌─────────┬─────────┐
   * │ Chunk 0 │ Chunk 1 │
   * ├─────────┼─────────┤
   * │ Chunk 2 │ Chunk 3 │
   * └─────────┴─────────┘
   */
  divideFourQuadrants() {
    // Calculate chunk dimensions using even subdivision
    // If grid dimensions are odd, we use the largest even subdivision
    const chunkWidth = Math.floor(this.grid.width / 2);
    const chunkHeight = Math.floor(this.grid.height / 2);
    
    if (chunkWidth === 0 || chunkHeight === 0) {
      throw new Error('Grid is too small to divide into chunks (minimum 2x2)');
    }
    
    console.log(`ChunkManager: Dividing ${this.grid.width}x${this.grid.height} grid into 2x2 chunks of ${chunkWidth}x${chunkHeight}`);
    
    // Create 4 chunks in 2x2 pattern
    this.chunks = [
      // Chunk 0: Top-left
      {
        id: 0,
        x: 0,
        y: 0,
        width: chunkWidth,
        height: chunkHeight,
        isAnchored: false,
        anchorTurnsRemaining: 0
      },
      // Chunk 1: Top-right
      {
        id: 1,
        x: chunkWidth,
        y: 0,
        width: chunkWidth,
        height: chunkHeight,
        isAnchored: false,
        anchorTurnsRemaining: 0
      },
      // Chunk 2: Bottom-left
      {
        id: 2,
        x: 0,
        y: chunkHeight,
        width: chunkWidth,
        height: chunkHeight,
        isAnchored: false,
        anchorTurnsRemaining: 0
      },
      // Chunk 3: Bottom-right
      {
        id: 3,
        x: chunkWidth,
        y: chunkHeight,
        width: chunkWidth,
        height: chunkHeight,
        isAnchored: false,
        anchorTurnsRemaining: 0
      }
    ];
  }

  /**
   * Get the chunk at the specified grid coordinates
   * @param {number} x - Grid X coordinate
   * @param {number} y - Grid Y coordinate
   * @returns {Chunk|null} The chunk containing the coordinates, or null if not in any chunk
   */
  getChunkAt(x, y) {
    for (const chunk of this.chunks) {
      if (x >= chunk.x && x < chunk.x + chunk.width &&
          y >= chunk.y && y < chunk.y + chunk.height) {
        return chunk;
      }
    }
    return null;
  }

  /**
   * Get chunk by ID
   * @param {number} chunkId - Chunk ID (0-3 for FOUR_QUADRANTS)
   * @returns {Chunk|null} The chunk with the specified ID, or null if not found
   */
  getChunkById(chunkId) {
    return this.chunks.find(chunk => chunk.id === chunkId) || null;
  }

  /**
   * Anchor a chunk to prevent it from shifting
   * @param {number} chunkId - ID of chunk to anchor
   * @param {number} duration - Number of turns to anchor (default: 2)
   */
  anchorChunk(chunkId, duration = 2) {
    const chunk = this.getChunkById(chunkId);
    if (!chunk) {
      console.warn(`ChunkManager: Cannot anchor chunk ${chunkId} - not found`);
      return;
    }
    
    chunk.isAnchored = true;
    chunk.anchorTurnsRemaining = duration;
    console.log(`ChunkManager: Anchored chunk ${chunkId} for ${duration} turns`);
  }

  /**
   * Update anchor durations (call at end of each turn)
   * Decrements anchor timers and removes anchors when they expire
   */
  updateAnchors() {
    for (const chunk of this.chunks) {
      if (chunk.isAnchored) {
        chunk.anchorTurnsRemaining--;
        if (chunk.anchorTurnsRemaining <= 0) {
          chunk.isAnchored = false;
          chunk.anchorTurnsRemaining = 0;
          console.log(`ChunkManager: Anchor expired on chunk ${chunk.id}`);
        }
      }
    }
  }

  /**
   * Check if a chunk can be shifted (not anchored)
   * @param {number} chunkId - ID of chunk to check
   * @returns {boolean} True if chunk can be shifted
   */
  canShiftChunk(chunkId) {
    const chunk = this.getChunkById(chunkId);
    return chunk && !chunk.isAnchored;
  }

  /**
   * Get all chunks
   * @returns {Chunk[]} Array of all chunks
   */
  getChunks() {
    return this.chunks;
  }

  /**
   * Get tiles within a chunk
   * @param {number} chunkId - ID of chunk
   * @returns {Array} 2D array of tiles in the chunk
   */
  getChunkTiles(chunkId) {
    const chunk = this.getChunkById(chunkId);
    if (!chunk) {
      return [];
    }
    
    const tiles = [];
    for (let y = chunk.y; y < chunk.y + chunk.height; y++) {
      const row = [];
      for (let x = chunk.x; x < chunk.x + chunk.width; x++) {
        row.push(this.grid.getTile(x, y));
      }
      tiles.push(row);
    }
    return tiles;
  }
}
