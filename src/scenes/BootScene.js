

/**
 * BootScene - Initial scene for asset loading and initialization
 * Responsibilities:
 * - Load all game assets (spritesheets, tilesets, UI elements)
 * - Initialize game configuration
 * - Transition to Menu scene when loading completes
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create loading bar
    this.createLoadingBar();

    // Performance optimization: Set max parallel downloads
    this.load.maxParallelDownloads = 4;

    // Set base path for assets
    this.load.setPath('assets');

    // Load level data
    this.load.json('levelsData', '../src/data/levels.json');

    // Load environment tileset (16x16 tiles)
    // Grid: 8 columns × 4 rows
    this.load.spritesheet(
      'environment_tileset',
      'tileset/environment_tileset.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // Load player spritesheet (32x32 sprites with 4-direction walk animations)
    // Grid: 5 columns × 4 rows (idle + 4 walk frames per direction)
    // Row 0: Down, Row 1: Up, Row 2: Left, Row 3: Right
    this.load.spritesheet(
      'player',
      'player/player_spritesheet.png',
      { frameWidth: 32, frameHeight: 32 }
    );

    // Load enemy spritesheets
    // Patroller: 7 columns × 1 row (idle, bob, move directions, alert)
    this.load.spritesheet(
      'patroller',
      'enemies/patroller_spritesheet.png',
      { frameWidth: 32, frameHeight: 32 }
    );

    // Load UI icons (16x16 spritesheet)
    // Grid: 6 columns × 1 row (heart full, heart empty, key, move counter, shift icon)
    this.load.spritesheet(
      'ui_icons_16',
      'ui/ui_icons_16x16.png',
      { frameWidth: 16, frameHeight: 16 }
    );

    // Load UI icons (32x32 spritesheet)
    // Grid: 6 columns × 1 row (same as 16x16 but larger)
    this.load.spritesheet(
      'ui_icons_32',
      'ui/ui_icons_32x32.png',
      { frameWidth: 32, frameHeight: 32 }
    );
  }

  create() {
    console.log('BootScene: Assets loaded successfully');
    
    // Create player animations
    this.createPlayerAnimations();
    
    // Create enemy animations
    this.createEnemyAnimations();
    
    // Transition to Menu scene
    this.scene.start('MenuScene');
  }

  /**
   * Creates player walk animations for all four directions
   * Each direction has an idle frame and a 4-frame walk cycle
   */
  createPlayerAnimations() {
    // Player walk down (Row 0: frames 0-4)
    this.anims.create({
      key: 'player_walk_down',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_idle_down',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1
    });

    // Player walk up (Row 1: frames 5-9)
    this.anims.create({
      key: 'player_walk_up',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 9 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_idle_up',
      frames: [{ key: 'player', frame: 5 }],
      frameRate: 1
    });

    // Player walk left (Row 2: frames 10-14)
    this.anims.create({
      key: 'player_walk_left',
      frames: this.anims.generateFrameNumbers('player', { start: 11, end: 14 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_idle_left',
      frames: [{ key: 'player', frame: 10 }],
      frameRate: 1
    });

    // Player walk right (Row 3: frames 15-19)
    this.anims.create({
      key: 'player_walk_right',
      frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_idle_right',
      frames: [{ key: 'player', frame: 15 }],
      frameRate: 1
    });

    console.log('BootScene: Player animations created');
  }

  /**
   * Creates enemy animations
   * Patroller: idle bob, directional movement, alert state
   * Chaser: idle bob, directional movement, alert state
   */
  createEnemyAnimations() {
    // Patroller idle animation (frames 0-1: bob effect)
    this.anims.create({
      key: 'patroller_idle',
      frames: this.anims.generateFrameNumbers('patroller', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    });

    // Patroller movement animations (frames 2-5: directional stretches)
    this.anims.create({
      key: 'patroller_move_down',
      frames: [{ key: 'patroller', frame: 2 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'patroller_move_up',
      frames: [{ key: 'patroller', frame: 3 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'patroller_move_left',
      frames: [{ key: 'patroller', frame: 4 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'patroller_move_right',
      frames: [{ key: 'patroller', frame: 5 }],
      frameRate: 1
    });

    // Patroller alert state (frame 6: exclamation mark)
    this.anims.create({
      key: 'patroller_alert',
      frames: [{ key: 'patroller', frame: 6 }],
      frameRate: 1
    });

    // Chaser idle animation (frames 7-8: bob effect)
    this.anims.create({
      key: 'chaser_idle',
      frames: this.anims.generateFrameNumbers('patroller', { start: 7, end: 8 }),
      frameRate: 4,
      repeat: -1
    });

    // Chaser movement animations (frames 9-12: directional stretches)
    this.anims.create({
      key: 'chaser_move_down',
      frames: [{ key: 'patroller', frame: 9 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'chaser_move_up',
      frames: [{ key: 'patroller', frame: 10 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'chaser_move_left',
      frames: [{ key: 'patroller', frame: 11 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'chaser_move_right',
      frames: [{ key: 'patroller', frame: 12 }],
      frameRate: 1
    });

    // Chaser alert state (frame 13: double exclamation mark)
    this.anims.create({
      key: 'chaser_alert',
      frames: [{ key: 'patroller', frame: 13 }],
      frameRate: 1
    });

    // Guard idle animation (frames 14-15: bob effect)
    this.anims.create({
      key: 'guard_idle',
      frames: this.anims.generateFrameNumbers('patroller', { start: 14, end: 15 }),
      frameRate: 4,
      repeat: -1
    });

    // Guard telegraph animation (frame 16: warning indicator)
    this.anims.create({
      key: 'guard_telegraph',
      frames: [{ key: 'patroller', frame: 16 }],
      frameRate: 1
    });

    // Guard attack animation (frames 17-20: attack sequence)
    this.anims.create({
      key: 'guard_attack',
      frames: this.anims.generateFrameNumbers('patroller', { start: 17, end: 20 }),
      frameRate: 10,
      repeat: 0
    });

    console.log('BootScene: Enemy animations created');
  }

  /**
   * Creates a visual loading bar to show asset loading progress
   */
  createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      fill: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);

    // Progress bar background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Update progress bar as assets load
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // Clean up loading bar when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
}
