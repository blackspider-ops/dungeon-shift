/**
 * LevelLoader - Loads and parses level data
 * Handles level definitions and creates Grid instances
 */

import { Grid, TileType } from './Grid.js';

export class LevelLoader {
  constructor(scene) {
    this.scene = scene;
    this.levels = null;
  }

  /**
   * Initialize with preloaded data from Phaser cache
   */
  init() {
    if (this.scene && this.scene.cache && this.scene.cache.json) {
      this.levels = this.scene.cache.json.get('levelsData');
    }
    
    if (!this.levels) {
      console.error('LevelLoader: Failed to load levels data from cache');
    }
  }

  /**
   * Load a level by ID
   * @param {number} levelId - Level ID (1-10)
   * @returns {Object} Level data with grid and entities
   */
  loadLevel(levelId) {
    if (!this.levels || !this.levels.levels) {
      console.error('LevelLoader: Levels data not available');
      return this.createEmptyLevel();
    }

    const levelData = this.levels.levels.find(l => l.id === levelId);
    
    if (!levelData) {
      console.error(`LevelLoader: Level ${levelId} not found`);
      return this.createEmptyLevel();
    }

    // Create grid from level data
    const grid = new Grid(levelData.gridWidth, levelData.gridHeight);
    
    // Populate grid with tiles
    for (let y = 0; y < levelData.gridHeight; y++) {
      for (let x = 0; x < levelData.gridWidth; x++) {
        const tileData = levelData.tiles[y][x];
        // Handle both string format ("WALL") and object format ({type: "WALL"})
        const tileType = typeof tileData === 'string' ? tileData : (tileData && tileData.type);
        const tileState = typeof tileData === 'object' ? (tileData.state || {}) : {};
        
        if (tileType) {
          grid.setTile(x, y, {
            type: TileType[tileType],
            x: x,
            y: y,
            state: tileState
          });
        }
      }
    }

    // Place items on the grid (keys, power-ups, etc.)
    if (levelData.items && Array.isArray(levelData.items)) {
      for (const item of levelData.items) {
        if (item.position) {
          grid.setTile(item.position.x, item.position.y, {
            type: TileType[item.type],
            x: item.position.x,
            y: item.position.y,
            state: item.state || {}
          });
        }
      }
    }

    // Place exit on the grid
    if (levelData.exitPosition) {
      grid.setTile(levelData.exitPosition.x, levelData.exitPosition.y, {
        type: TileType.EXIT,
        x: levelData.exitPosition.x,
        y: levelData.exitPosition.y,
        state: { unlocked: false }
      });
    }

    // Extract entities
    const entities = {
      enemies: levelData.enemies || []
    };

    console.log(`LevelLoader: Loaded level ${levelId} - ${levelData.name}`);
    
    return {
      grid,
      levelData,
      entities
    };
  }

  /**
   * Create an empty fallback level
   */
  createEmptyLevel() {
    const grid = new Grid(12, 12);
    
    // Create basic walls around the perimeter
    for (let x = 0; x < 12; x++) {
      grid.setTile(x, 0, { type: TileType.WALL, x, y: 0 });
      grid.setTile(x, 11, { type: TileType.WALL, x, y: 11 });
    }
    for (let y = 0; y < 12; y++) {
      grid.setTile(0, y, { type: TileType.WALL, x: 0, y });
      grid.setTile(11, y, { type: TileType.WALL, x: 11, y });
    }

    return {
      grid,
      levelData: {
        id: 1,
        name: 'Empty Level',
        gridWidth: 12,
        gridHeight: 12,
        collapseMeter: 30,
        keysRequired: 0,
        playerStart: { x: 1, y: 1 },
        exitPosition: { x: 10, y: 10 }
      },
      entities: { enemies: [] }
    };
  }

  /**
   * Check if a level exists
   * @param {number} levelId - Level ID to check
   * @returns {boolean} True if level exists
   */
  levelExists(levelId) {
    if (!this.levels || !this.levels.levels) return false;
    return this.levels.levels.some(l => l.id === levelId);
  }
}
