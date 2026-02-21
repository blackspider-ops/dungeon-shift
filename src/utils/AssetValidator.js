/**
 * AssetValidator - Utility to validate that all assets are loaded correctly
 * Used for testing and debugging asset loading
 */
export class AssetValidator {
  /**
   * Validates that all required spritesheets are loaded
   * @param {Phaser.Scene} scene - The scene to check
   * @returns {Object} Validation results
   */
  static validateSpritesheets(scene) {
    const results = {
      success: true,
      errors: [],
      warnings: [],
      assets: {}
    };

    // Check environment tileset
    const tileset = scene.textures.get('environment_tileset');
    if (tileset.key === '__MISSING') {
      results.success = false;
      results.errors.push('Environment tileset not loaded');
    } else {
      results.assets.environment_tileset = {
        loaded: true,
        frameWidth: 16,
        frameHeight: 16,
        expectedFrames: 32, // 8x4 grid
        actualFrames: tileset.frameTotal
      };
    }

    // Check player spritesheet
    const player = scene.textures.get('player');
    if (player.key === '__MISSING') {
      results.success = false;
      results.errors.push('Player spritesheet not loaded');
    } else {
      results.assets.player = {
        loaded: true,
        frameWidth: 32,
        frameHeight: 32,
        expectedFrames: 20, // 5x4 grid
        actualFrames: player.frameTotal
      };
    }

    // Check patroller spritesheet
    const patroller = scene.textures.get('patroller');
    if (patroller.key === '__MISSING') {
      results.success = false;
      results.errors.push('Patroller spritesheet not loaded');
    } else {
      results.assets.patroller = {
        loaded: true,
        frameWidth: 32,
        frameHeight: 32,
        expectedFrames: 7, // 7x1 grid
        actualFrames: patroller.frameTotal
      };
    }

    // Check UI icons
    const uiIcons16 = scene.textures.get('ui_icons_16');
    if (uiIcons16.key === '__MISSING') {
      results.success = false;
      results.errors.push('UI icons 16x16 not loaded');
    } else {
      results.assets.ui_icons_16 = {
        loaded: true,
        frameWidth: 16,
        frameHeight: 16,
        expectedFrames: 6, // 6x1 grid
        actualFrames: uiIcons16.frameTotal
      };
    }

    const uiIcons32 = scene.textures.get('ui_icons_32');
    if (uiIcons32.key === '__MISSING') {
      results.success = false;
      results.errors.push('UI icons 32x32 not loaded');
    } else {
      results.assets.ui_icons_32 = {
        loaded: true,
        frameWidth: 32,
        frameHeight: 32,
        expectedFrames: 6, // 6x1 grid
        actualFrames: uiIcons32.frameTotal
      };
    }

    return results;
  }

  /**
   * Validates that all required animations are created
   * @param {Phaser.Scene} scene - The scene to check
   * @returns {Object} Validation results
   */
  static validateAnimations(scene) {
    const results = {
      success: true,
      errors: [],
      animations: {}
    };

    const requiredAnimations = [
      // Player animations
      'player_walk_down', 'player_idle_down',
      'player_walk_up', 'player_idle_up',
      'player_walk_left', 'player_idle_left',
      'player_walk_right', 'player_idle_right',
      // Enemy animations
      'patroller_idle',
      'patroller_move_down', 'patroller_move_up',
      'patroller_move_left', 'patroller_move_right',
      'patroller_alert'
    ];

    for (const animKey of requiredAnimations) {
      const exists = scene.anims.exists(animKey);
      results.animations[animKey] = exists;
      
      if (!exists) {
        results.success = false;
        results.errors.push(`Animation '${animKey}' not found`);
      }
    }

    return results;
  }

  /**
   * Logs validation results to console
   * @param {Object} results - Validation results
   * @param {string} label - Label for the validation
   */
  static logResults(results, label) {
    console.log(`\n=== ${label} ===`);
    
    if (results.success) {
      console.log('✓ All checks passed');
    } else {
      console.log('✗ Validation failed');
      results.errors.forEach(error => console.error(`  - ${error}`));
    }

    if (results.warnings && results.warnings.length > 0) {
      results.warnings.forEach(warning => console.warn(`  ⚠ ${warning}`));
    }

    if (results.assets) {
      console.log('\nAssets:');
      Object.entries(results.assets).forEach(([key, info]) => {
        console.log(`  ${key}: ${info.loaded ? '✓' : '✗'} (${info.actualFrames} frames)`);
      });
    }

    if (results.animations) {
      const animCount = Object.values(results.animations).filter(v => v).length;
      const totalCount = Object.keys(results.animations).length;
      console.log(`\nAnimations: ${animCount}/${totalCount} created`);
    }
  }
}
