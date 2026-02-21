/**
 * TileRenderer - Handles rendering of the dungeon grid using Phaser tilemaps
 * Manages the visual representation of tiles using the environment tileset
 */

import { TileType } from './Grid.js';
import { TILE_SIZE } from '../constants.js';

/**
 * Mapping of TileType to tileset frame indices
 * Based on the environment_tileset.png layout (8 columns × 4 rows)
 * Frame index = row * 8 + column
 */
export const TileFrames = {
  [TileType.FLOOR]: 0,           // [0,0] Floor variant 1
  [TileType.WALL]: 2,            // [2,0] Wall variant 1
  [TileType.SPIKE_TRAP]: 16,     // [0,2] Spikes retracted (row 2, col 0)
  [TileType.SPIKE_TRAP_ACTIVE]: 17, // [1,2] Spikes extended (row 2, col 1)
  [TileType.CRACKED_FLOOR]: 18,  // [2,2] Cracked floor stage 1 (row 2, col 2)
  [TileType.CRACKED_FLOOR_2]: 19, // [3,2] Cracked floor stage 2 (row 2, col 3)
  [TileType.ARROW_TRAP]: 25,     // [1,3] Arrow trap up (row 3, col 1)
  [TileType.SLIME]: 24,          // [0,3] Slime tile (row 3, col 0)
  [TileType.EXIT]: 10,           // [2,1] Portal locked (row 1, col 2)
  [TileType.EXIT_UNLOCKED]: 11,  // [3,1] Portal unlocked (row 1, col 3)
  [TileType.PIT]: 20,            // [4,2] Hole/void (row 2, col 4)
  [TileType.KEY]: 12,            // [4,1] Key tile (row 1, col 4)
  [TileType.DOOR_LOCKED]: 8,     // [0,1] Door locked (row 1, col 0)
  [TileType.DOOR_UNLOCKED]: 9,   // [1,1] Door unlocked (row 1, col 1)
  [TileType.ANCHOR]: 29,         // [5,3] Anchor tile (row 3, col 5)
  [TileType.PHASE_STEP]: 32,     // [0,4] Phase step token (row 4, col 0)
  [TileType.SHIELD]: 34,         // [2,4] Shield token (row 4, col 2)
  [TileType.UNDO]: 33,           // [1,4] Undo token (row 4, col 1)
  [TileType.SWITCH]: 27          // [3,3] Switch off (row 3, col 3)
};

/**
 * Arrow trap directional frames
 * Based on tileset layout: row 3, columns 1-4
 */
export const ArrowTrapFrames = {
  'UP': 25,    // [1,3] Arrow pointing up
  'RIGHT': 26, // [2,3] Arrow pointing right
  'DOWN': 27,  // [3,3] Arrow pointing down
  'LEFT': 28   // [4,3] Arrow pointing left
};

/**
 * Arrow trap telegraph (warning) frames
 * Based on tileset layout: row 3, columns 5-8 (assuming warning variants)
 * Using same frames with visual indicator overlay in game
 */
export const ArrowTrapTelegraphFrames = {
  'UP': 29,    // [5,3] Arrow pointing up (warning)
  'RIGHT': 30, // [6,3] Arrow pointing right (warning)
  'DOWN': 31,  // [7,3] Arrow pointing down (warning)
  'LEFT': 25   // Fallback to base frame if no telegraph frame available
};

/**
 * Switch tile frames
 * Based on tileset layout: row 3, columns 3-4
 */
export const SwitchFrames = {
  'OFF': 27,   // [3,3] Switch off (gray button)
  'ON': 28     // [4,3] Switch on (green glowing button)
};

/**
 * TileRenderer class - manages Phaser tilemap rendering
 * Optimized with object pooling and efficient rendering
 */
export class TileRenderer {
  /**
   * Create a new TileRenderer
   * @param {Phaser.Scene} scene - The Phaser scene
   * @param {Grid} grid - The grid to render
   */
  constructor(scene, grid) {
    this.scene = scene;
    this.grid = grid;
    this.tilemap = null;
    this.layer = null;
    this.tileSprites = []; // Store individual tile sprites for dynamic updates
    
    // Performance optimization: Cache frequently accessed tiles
    this.tileCache = new Map();
    this.dirtyTiles = new Set(); // Track tiles that need updating
  }

  /**
   * Initialize the tilemap and render the grid
   */
  create() {
    // Calculate centered position for the grid
    const scene = this.scene;
    const canvasWidth = scene.cameras.main.width;
    const canvasHeight = scene.cameras.main.height;
    
    // Calculate grid dimensions in pixels (at scale)
    const gridPixelWidth = this.grid.width * TILE_SIZE;
    const gridPixelHeight = this.grid.height * TILE_SIZE;
    
    // Center the grid with space for HUD
    const hudTop = 80;
    const offsetX = (canvasWidth - gridPixelWidth) / 2;
    const offsetY = hudTop + (canvasHeight - hudTop - 100 - gridPixelHeight) / 2;
    
    // Store offset for entity positioning
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    
    console.log(`TileRenderer: Grid ${this.grid.width}x${this.grid.height} = ${gridPixelWidth}x${gridPixelHeight}px`);
    console.log(`TileRenderer: Canvas ${canvasWidth}x${canvasHeight}, offset (${offsetX}, ${offsetY})`);

    // Create a blank tilemap
    this.tilemap = this.scene.make.tilemap({
      tileWidth: 16,  // Source tile size
      tileHeight: 16,
      width: this.grid.width,
      height: this.grid.height
    });

    // Add the environment tileset to the tilemap
    const tileset = this.tilemap.addTilesetImage('environment_tileset', 'environment_tileset', 16, 16);

    // Create a layer for the tiles at centered position
    this.layer = this.tilemap.createBlankLayer('ground', tileset, offsetX, offsetY);
    
    // Scale up the tiles to match TILE_SIZE
    this.layer.setScale(TILE_SIZE / 16);
    
    // Set depth to 0 so it renders below entities
    // Entities will have dynamic depth (10 + gridY) so they render properly
    this.layer.setDepth(0);

    // Render all tiles from the grid
    this.renderGrid();

    console.log(`TileRenderer: Tilemap created at (${offsetX}, ${offsetY}) with scale ${TILE_SIZE / 16}`);
  }
  
  /**
   * Get the screen position for a grid coordinate
   * Uses the EXACT same calculation as the grid offset
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {{x: number, y: number}} Screen position
   */
  getScreenPosition(gridX, gridY) {
    // Safety check
    if (this.offsetX === undefined || this.offsetY === undefined) {
      console.error('TileRenderer.getScreenPosition: offsets not initialized!');
      // Fallback: calculate on the fly
      const canvasWidth = this.scene.cameras.main.width;
      const canvasHeight = this.scene.cameras.main.height;
      const gridPixelWidth = this.grid.width * TILE_SIZE;
      const gridPixelHeight = this.grid.height * TILE_SIZE;
      const hudTop = 80;
      this.offsetX = (canvasWidth - gridPixelWidth) / 2;
      this.offsetY = hudTop + (canvasHeight - hudTop - 100 - gridPixelHeight) / 2;
      console.log(`TileRenderer: Calculated fallback offsets: (${this.offsetX}, ${this.offsetY})`);
    }
    
    // Use the stored offset values that were calculated in create()
    // These offsets position the grid centered on screen
    // TILE_SIZE is 32, which is the rendered size of each tile
    const x = this.offsetX + (gridX * TILE_SIZE) + (TILE_SIZE / 2);
    const y = this.offsetY + (gridY * TILE_SIZE) + (TILE_SIZE / 2);
    
    console.log(`getScreenPosition(${gridX}, ${gridY}) = (${x}, ${y}), offset=(${this.offsetX}, ${this.offsetY}), TILE_SIZE=${TILE_SIZE}`);
    return { x, y };
  }

  /**
   * Render all tiles from the grid to the tilemap
   */
  renderGrid() {
    let tileTypeCounts = {};
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const tile = this.grid.getTile(x, y);
        tileTypeCounts[tile.type] = (tileTypeCounts[tile.type] || 0) + 1;
        this.updateTile(x, y, tile);
      }
    }
    console.log('TileRenderer: Tile type counts:', tileTypeCounts);
  }

  /**
   * Update a single tile's visual representation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Tile} tile - The tile data
   */
  updateTile(x, y, tile) {
    if (!this.layer) {
      console.warn('TileRenderer: Cannot update tile, layer not initialized');
      return;
    }

    // Determine the frame index based on tile type and state
    let frameIndex = this.getTileFrame(tile);
    
    // Performance optimization: Check cache to avoid redundant updates
    const cacheKey = `${x},${y}`;
    const cachedFrame = this.tileCache.get(cacheKey);
    
    if (cachedFrame === frameIndex) {
      return; // No change needed
    }
    
    // Update cache
    this.tileCache.set(cacheKey, frameIndex);

    // Set the tile in the layer
    this.layer.putTileAt(frameIndex, x, y);

    // Set collision for walls
    if (tile.type === TileType.WALL) {
      const phaserTile = this.layer.getTileAt(x, y);
      if (phaserTile) {
        phaserTile.setCollision(true);
      }
    }
  }

  /**
   * Get the appropriate frame index for a tile based on its type and state
   * @param {Tile} tile - The tile data
   * @returns {number} The frame index in the tileset
   */
  getTileFrame(tile) {
    // Handle spike traps with state
    if (tile.type === TileType.SPIKE_TRAP) {
      return tile.state?.active ? TileFrames[TileType.SPIKE_TRAP_ACTIVE] : TileFrames[TileType.SPIKE_TRAP];
    }

    // Handle switch tiles with on/off state
    if (tile.type === TileType.SWITCH) {
      return tile.state?.active ? SwitchFrames['ON'] : SwitchFrames['OFF'];
    }

    // Handle arrow traps with direction
    if (tile.type === TileType.ARROW_TRAP) {
      const direction = tile.state?.arrowDirection || 'UP';
      const timer = tile.state?.arrowTimer;
      
      // Show telegraph (warning) visual when timer is 1
      if (timer === 1) {
        return ArrowTrapTelegraphFrames[direction] || ArrowTrapFrames[direction];
      }
      
      return ArrowTrapFrames[direction] || ArrowTrapFrames['UP'];
    }

    // Handle cracked floors with crack level
    if (tile.type === TileType.CRACKED_FLOOR) {
      const crackLevel = tile.state?.crackLevel || 0;
      if (crackLevel === 1) {
        return TileFrames[TileType.CRACKED_FLOOR];
      } else if (crackLevel === 2) {
        return TileFrames[TileType.CRACKED_FLOOR_2];
      }
      return TileFrames[TileType.FLOOR]; // Intact
    }

    // Handle exit with locked/unlocked state
    if (tile.type === TileType.EXIT) {
      return tile.state?.unlocked ? TileFrames[TileType.EXIT_UNLOCKED] : TileFrames[TileType.EXIT];
    }

    // Default: use the tile type mapping
    return TileFrames[tile.type] || TileFrames[TileType.FLOOR];
  }

  /**
   * Update the visual representation of a specific tile
   * Call this when a tile's state changes (e.g., spike activates, floor cracks)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  refreshTile(x, y) {
    const tile = this.grid.getTile(x, y);
    if (tile) {
      this.updateTile(x, y, tile);
    }
  }

  /**
   * Refresh the entire grid rendering
   * Call this after major changes like shifts
   */
  refreshGrid() {
    this.renderGrid();
  }
  /**
   * Alias for refreshGrid - renders the entire grid
   */
  render() {
    this.refreshGrid();
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.layer) {
      this.layer.destroy();
      this.layer = null;
    }
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
    }
    this.tileSprites = [];
    
    // Clear caches
    this.tileCache.clear();
    this.dirtyTiles.clear();
  }
}
