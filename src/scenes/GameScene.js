
import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT } from '../constants.js';
import InputManager, { Direction } from '../utils/InputManager.js';
import { Grid, TileType } from '../core/Grid.js';
import { TileRenderer } from '../core/TileRenderer.js';
import Player from '../entities/Player.js';
import Patroller from '../entities/Patroller.js';
import { TurnManager } from '../core/TurnManager.js';
import { LevelLoader } from '../core/LevelLoader.js';
import { ChunkManager } from '../core/ChunkManager.js';
import { ShiftSystem } from '../core/ShiftSystem.js';
import AudioManager from '../utils/AudioManager.js';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';

/**
 * UI Style Configuration
 * Consistent styling for all UI elements
 */
const UI_STYLES = {
  colors: {
    background: 0x000000,
    backgroundAlpha: 0.8,
    border: 0x888888,
    borderHighlight: 0xffffff,
    text: '#ffffff',
    textStroke: '#000000',
    textSecondary: '#aaaaaa',
    textDim: '#666666',
    warning: '#ffaa00',
    danger: '#ff0000',
    success: '#00ff00',
    info: '#00ffff',
    key: '#ffff00',
    hp: '#ff0000',
    anchor: 0x00aaff,
    anchorHighlight: 0x00ffff,
    buttonNormal: 0x444444,
    buttonHover: 0x666666,
    buttonActive: 0x222222
  },
  fonts: {
    title: 'bold 32px monospace',
    heading: 'bold 16px monospace',
    body: '14px monospace',
    bodyBold: 'bold 14px monospace',
    small: '12px monospace',
    smallBold: 'bold 12px monospace',
    tiny: '10px monospace',
    tinyBold: 'bold 10px monospace'
  },
  stroke: {
    thick: 4,
    medium: 2,
    thin: 1
  },
  spacing: {
    small: 5,
    medium: 10,
    large: 20
  }
};

/**
 * GameScene - Main gameplay scene
 * Responsibilities:
 * - Render the dungeon grid and entities
 * - Handle player input and movement
 * - Manage game state (turn processing, win/loss conditions)
 * - Display HUD (HP, collapse meter, keys, shift indicator)
 * - Coordinate with game systems (shift, traps, enemies)
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.inputManager = null;
    this.grid = null;
    this.tileRenderer = null;
    this.player = null;
    this.turnManager = null;
    this.gameState = null;
    this.isProcessingTurn = false;
    this.isGameOver = false; // Track game over state
    this.hudElements = {};
    this.levelLoader = new LevelLoader(this);
    this.currentLevelData = null;
    this.chunkManager = null;
    this.shiftSystem = null;
    this.collapseMeterPulseTween = null;
    this.audioManager = null;
    
    // Performance monitoring
    this.fpsCounter = null;
    this.enablePerformanceMonitoring = false;
  }

  init(data) {
    // Initialize with level data passed from Menu scene
    this.levelId = data.levelId || 1;
    this.isGameOver = false; // Reset game over flag
    this.isProcessingTurn = false; // Reset turn processing flag
    console.log(`GameScene: Initializing level ${this.levelId}`);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    console.log('GameScene: AudioManager initialized');

    // Initialize input manager
    this.inputManager = new InputManager(this);
    this.inputManager.enable(); // Explicitly enable input
    console.log('GameScene: InputManager initialized');

    // Load level data
    // Initialize level loader with cached data
    this.levelLoader.init();

    const levelResult = this.levelLoader.loadLevel(this.levelId);
    this.grid = levelResult.grid;

    this.currentLevelData = levelResult.levelData;
    console.log(`GameScene: Loaded level ${this.levelId} - ${this.currentLevelData.name}`);

    // Initialize tile renderer
    this.tileRenderer = new TileRenderer(this, this.grid);
    this.tileRenderer.create();
    console.log('GameScene: TileRenderer initialized');

    // Create player at level's starting position
    const playerStart = this.currentLevelData.playerStart;
    this.player = new Player(this, playerStart.x, playerStart.y);
    console.log(`GameScene: Player created at (${playerStart.x}, ${playerStart.y})`);

    // Create enemies from level data
    const enemies = this.createEnemies(levelResult.entities.enemies);
    console.log(`GameScene: Created ${enemies.length} enemies`);

    // Initialize chunk manager and shift system
    this.chunkManager = new ChunkManager(this.grid);
    this.shiftSystem = ShiftSystem.createRoomSwapPattern();
    const shiftSystemInstance = new ShiftSystem(this.shiftSystem, this.chunkManager);
    console.log('GameScene: Shift system initialized');

    // Initialize game state from level data
    this.gameState = {
      keysRequired: this.currentLevelData.keysRequired,
      exitUnlocked: false,
      enemies: enemies,
      items: [],
      shiftSystem: shiftSystemInstance,
      chunkManager: this.chunkManager
    };

    // Initialize turn manager with level's collapse meter
    this.turnManager = new TurnManager(this.currentLevelData.collapseMeter);
    console.log(`GameScene: TurnManager initialized with ${this.currentLevelData.collapseMeter} moves`);

    // Create HUD
    this.createHUD();

    // Track exit glow sprite
    this.exitGlowSprite = null;

    // Initialize anchor selection mode
    this.anchorSelectionMode = false;
    this.anchorInventoryIndex = -1;
    this.chunkOverlay = null;

    // Initialize pause state
    this.isPaused = false;
    this.pauseMenu = null;

    // Set up ESC key for pause menu
    this.input.keyboard.on('keydown-ESC', () => {
      this.togglePauseMenu();
    });

    // Start background music
    if (this.audioManager) {
      this.audioManager.startBackgroundMusic();
    }
  }

  /**
   * Create enemy entities from level data
   * @param {Array} enemyData - Array of enemy definitions from level
   * @returns {Array} Array of instantiated enemy objects
   */
  createEnemies(enemyData) {
    const enemies = [];

    if (!enemyData || !Array.isArray(enemyData)) {
      return enemies;
    }

    for (const data of enemyData) {
      if (data.type === 'PATROLLER') {
        const patroller = new Patroller(
          this,
          data.position.x,
          data.position.y,
          data.patrolPath || []
        );
        enemies.push(patroller);
      }
      // TODO: Add other enemy types (Chaser, Guard) in future tasks
    }

    return enemies;
  }

  /**
   * Create HUD elements
   */
  /**
     * Create HUD elements
     */
    createHUD() {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      // Create HUD background panel (top bar)
      const hudHeight = 70;
      this.hudElements.hudBackground = this.add.rectangle(0, 0, width, hudHeight, UI_STYLES.colors.background, UI_STYLES.colors.backgroundAlpha);
      this.hudElements.hudBackground.setOrigin(0, 0);
      this.hudElements.hudBackground.setDepth(1000);
      this.hudElements.hudBackground.setScrollFactor(0);

      // Left section - Game stats
      const leftX = 15;
      const topY = 10;

      // Collapse meter with icon
      this.hudElements.collapseMeterText = this.add.text(leftX, topY, '', {
        font: UI_STYLES.fonts.heading,
        fill: UI_STYLES.colors.text,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.collapseMeterText.setDepth(1001);
      this.hudElements.collapseMeterText.setScrollFactor(0);

      // HP hearts with label
      this.hudElements.hpLabel = this.add.text(leftX, topY + 22, 'HP:', {
        font: UI_STYLES.fonts.bodyBold,
        fill: UI_STYLES.colors.textSecondary,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.hpLabel.setDepth(1001);
      this.hudElements.hpLabel.setScrollFactor(0);

      this.hudElements.hpText = this.add.text(leftX + 35, topY + 22, '', {
        font: UI_STYLES.fonts.heading,
        fill: UI_STYLES.colors.hp,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.hpText.setDepth(1001);
      this.hudElements.hpText.setScrollFactor(0);

      // Keys collected with icon
      this.hudElements.keysText = this.add.text(leftX + 150, topY, '', {
        font: UI_STYLES.fonts.heading,
        fill: UI_STYLES.colors.key,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.keysText.setDepth(1001);
      this.hudElements.keysText.setScrollFactor(0);

      // Turn counter
      this.hudElements.turnText = this.add.text(leftX + 150, topY + 22, '', {
        font: UI_STYLES.fonts.bodyBold,
        fill: UI_STYLES.colors.textSecondary,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.turnText.setDepth(1001);
      this.hudElements.turnText.setScrollFactor(0);

      // Inventory display (bottom of HUD)
      this.hudElements.inventoryText = this.add.text(leftX, topY + 44, '', {
        font: UI_STYLES.fonts.small,
        fill: UI_STYLES.colors.textSecondary,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.inventoryText.setDepth(1001);
      this.hudElements.inventoryText.setScrollFactor(0);

      // Shift indicator (right side)
      this.createShiftIndicator();

      // Objective tracker (center-bottom)
      this.createObjectiveTracker();

      // Pause button hint (top-right corner)
      this.hudElements.pauseHint = this.add.text(width - 15, topY, '[ESC] Pause', {
        font: UI_STYLES.fonts.small,
        fill: UI_STYLES.colors.textDim,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.pauseHint.setOrigin(1, 0);
      this.hudElements.pauseHint.setDepth(1001);
      this.hudElements.pauseHint.setScrollFactor(0);

      // Mute button hint (below pause hint)
      this.hudElements.muteHint = this.add.text(width - 15, topY + 20, '[M] Mute', {
        font: UI_STYLES.fonts.small,
        fill: UI_STYLES.colors.textDim,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      this.hudElements.muteHint.setOrigin(1, 0);
      this.hudElements.muteHint.setDepth(1001);
      this.hudElements.muteHint.setScrollFactor(0);
      this.hudElements.muteHint.setInteractive({ useHandCursor: true });
      this.hudElements.muteHint.on('pointerdown', () => {
        this.toggleMute();
      });

      // Set up M key for mute toggle
      this.input.keyboard.on('keydown-M', () => {
        this.toggleMute();
      });

      // Performance monitoring FPS counter (development only)
      if (this.enablePerformanceMonitoring) {
        performanceMonitor.enable();
        this.fpsCounter = performanceMonitor.createFPSCounter(this);
      }

      this.updateHUD();
    }

  /**
   * Create shift indicator display
   * Shows the next shift operation with visual diagram
   */
  createShiftIndicator() {
    const width = this.cameras.main.width;
    const indicatorX = width - 160;
    const indicatorY = 80;

    // Create container for shift indicator
    this.hudElements.shiftIndicator = this.add.container(indicatorX, indicatorY);
    this.hudElements.shiftIndicator.setDepth(1001);
    this.hudElements.shiftIndicator.setScrollFactor(0);

    // Background panel
    const panelBg = this.add.rectangle(0, 0, 150, 120, UI_STYLES.colors.background, UI_STYLES.colors.backgroundAlpha);
    panelBg.setOrigin(0, 0);
    this.hudElements.shiftIndicator.add(panelBg);

    // Border
    const border = this.add.rectangle(0, 0, 150, 120);
    border.setOrigin(0, 0);
    border.setStrokeStyle(UI_STYLES.stroke.medium, UI_STYLES.colors.border);
    this.hudElements.shiftIndicator.add(border);

    // Title text
    const titleText = this.add.text(75, 8, 'Next Shift:', {
      font: UI_STYLES.fonts.smallBold,
      fill: UI_STYLES.colors.text,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.medium
    });
    titleText.setOrigin(0.5, 0);
    this.hudElements.shiftIndicator.add(titleText);

    // Pattern description text
    this.hudElements.shiftPatternText = this.add.text(75, 25, '', {
      font: UI_STYLES.fonts.tiny,
      fill: UI_STYLES.colors.warning,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.thin,
      align: 'center',
      wordWrap: { width: 140 }
    });
    this.hudElements.shiftPatternText.setOrigin(0.5, 0);
    this.hudElements.shiftIndicator.add(this.hudElements.shiftPatternText);

    // Visual diagram container (will be populated dynamically)
    this.hudElements.shiftDiagram = this.add.container(75, 60);
    this.hudElements.shiftIndicator.add(this.hudElements.shiftDiagram);

    console.log('GameScene: Shift indicator created');
  }

  /**
   * Create objective tracker display
   * Shows current objectives and progress
   */
  createObjectiveTracker() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const trackerX = width / 2;
    const trackerY = height - 60;

    // Create container for objective tracker
    this.hudElements.objectiveTracker = this.add.container(trackerX, trackerY);
    this.hudElements.objectiveTracker.setDepth(1001);
    this.hudElements.objectiveTracker.setScrollFactor(0);

    // Background panel
    const panelBg = this.add.rectangle(0, 0, 300, 50, UI_STYLES.colors.background, UI_STYLES.colors.backgroundAlpha);
    panelBg.setOrigin(0.5, 0.5);
    this.hudElements.objectiveTracker.add(panelBg);

    // Border
    const border = this.add.rectangle(0, 0, 300, 50);
    border.setOrigin(0.5, 0.5);
    border.setStrokeStyle(UI_STYLES.stroke.medium, UI_STYLES.colors.border);
    this.hudElements.objectiveTracker.add(border);

    // Objective text
    this.hudElements.objectiveText = this.add.text(0, -10, '', {
      font: UI_STYLES.fonts.bodyBold,
      fill: UI_STYLES.colors.text,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.medium,
      align: 'center'
    });
    this.hudElements.objectiveText.setOrigin(0.5, 0);
    this.hudElements.objectiveTracker.add(this.hudElements.objectiveText);

    // Progress text
    this.hudElements.progressText = this.add.text(0, 10, '', {
      font: UI_STYLES.fonts.small,
      fill: UI_STYLES.colors.textSecondary,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.medium,
      align: 'center'
    });
    this.hudElements.progressText.setOrigin(0.5, 0);
    this.hudElements.objectiveTracker.add(this.hudElements.progressText);

    console.log('GameScene: Objective tracker created');
  }

  /**
   * Toggle pause menu on/off
   */
  togglePauseMenu() {
    // Don't allow pausing during game over
    if (this.isGameOver) {
      return;
    }
    
    if (this.isPaused) {
      this.hidePauseMenu();
    } else {
      this.showPauseMenu();
    }
  }

  /**
   * Toggle mute on/off
   */
  toggleMute() {
    if (!this.audioManager) return;

    const isMuted = this.audioManager.toggleMute();
    
    // Update mute hint text
    if (this.hudElements.muteHint) {
      this.hudElements.muteHint.setText(isMuted ? '[M] Unmute' : '[M] Mute');
    }
    
    console.log(`GameScene: Audio ${isMuted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Show pause menu
   */
  showPauseMenu() {
    if (this.isPaused) return;

    this.isPaused = true;
    // Don't pause the scene - just set the flag to stop game logic
    // this.scene.pause(); // REMOVED - this prevents UI from being created

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create pause menu container
    this.pauseMenu = this.add.container(0, 0);
    this.pauseMenu.setDepth(2000);
    this.pauseMenu.setScrollFactor(0);

    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, UI_STYLES.colors.background, 0.8);
    overlay.setOrigin(0, 0);
    this.pauseMenu.add(overlay);

    // Menu background panel
    const menuWidth = 400;
    const menuHeight = 350;
    const menuX = width / 2;
    const menuY = height / 2;

    const menuBg = this.add.rectangle(menuX, menuY, menuWidth, menuHeight, 0x222222);
    menuBg.setStrokeStyle(UI_STYLES.stroke.thick, UI_STYLES.colors.border);
    this.pauseMenu.add(menuBg);

    // Title
    const title = this.add.text(menuX, menuY - 140, 'PAUSED', {
      font: UI_STYLES.fonts.title,
      fill: UI_STYLES.colors.text,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.thick
    });
    title.setOrigin(0.5);
    this.pauseMenu.add(title);

    // Level info
    const levelInfo = this.add.text(menuX, menuY - 90, `Level ${this.levelId}: ${this.currentLevelData.name}`, {
      font: UI_STYLES.fonts.heading,
      fill: UI_STYLES.colors.textSecondary,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.medium
    });
    levelInfo.setOrigin(0.5);
    this.pauseMenu.add(levelInfo);

    // Stats
    const statsY = menuY - 50;
    const stats = [
      `Turn: ${this.turnManager.getTurnNumber()}`,
      `Moves Left: ${this.turnManager.getCollapseMeter()}`,
      `HP: ${this.player.hp}/${this.player.maxHp}`,
      `Keys: ${this.player.keysCollected}/${this.gameState.keysRequired}`
    ];

    stats.forEach((stat, index) => {
      const statText = this.add.text(menuX, statsY + (index * 22), stat, {
        font: UI_STYLES.fonts.body,
        fill: UI_STYLES.colors.text,
        stroke: UI_STYLES.colors.textStroke,
        strokeThickness: UI_STYLES.stroke.medium
      });
      statText.setOrigin(0.5);
      this.pauseMenu.add(statText);
    });

    // Menu buttons
    const buttonY = menuY + 50;
    const buttonSpacing = 50;

    // Resume button
    const resumeButton = this.createMenuButton(menuX, buttonY, 'Resume [ESC]', () => {
      this.hidePauseMenu();
    });
    this.pauseMenu.add(resumeButton);

    // Restart button
    const restartButton = this.createMenuButton(menuX, buttonY + buttonSpacing, 'Restart Level [R]', () => {
      this.hidePauseMenu();
      this.restartLevel();
    });
    this.pauseMenu.add(restartButton);

    // Main menu button
    const menuButton = this.createMenuButton(menuX, buttonY + buttonSpacing * 2, 'Main Menu [Q]', () => {
      this.hidePauseMenu();
      this.scene.stop();
      this.scene.start('MenuScene');
    });
    this.pauseMenu.add(menuButton);

    // Set up keyboard shortcuts (Q for quit to menu, R for restart)
    this.pauseMenuKeys = {
      r: this.input.keyboard.addKey('R'),
      q: this.input.keyboard.addKey('Q')
    };

    this.pauseMenuKeys.r.on('down', () => {
      if (this.isPaused) {
        this.hidePauseMenu();
        this.restartLevel();
      }
    });

    this.pauseMenuKeys.q.on('down', () => {
      if (this.isPaused) {
        this.hidePauseMenu();
        this.scene.stop();
        this.scene.start('MenuScene');
      }
    });

    this.pauseMenuKeys.r.on('down', () => {
      if (this.isPaused) {
        this.hidePauseMenu();
        this.restartLevel();
      }
    });

    console.log('GameScene: Pause menu shown');
  }

  /**
   * Hide pause menu
   */
  hidePauseMenu() {
    if (!this.isPaused) return;

    this.isPaused = false;
    // Don't resume the scene - we never paused it
    // this.scene.resume(); // REMOVED

    if (this.pauseMenu) {
      this.pauseMenu.destroy();
      this.pauseMenu = null;
    }

    // Clean up keyboard shortcuts
    if (this.pauseMenuKeys) {
      this.pauseMenuKeys.r.destroy();
      this.pauseMenuKeys.q.destroy();
      this.pauseMenuKeys = null;
    }

    console.log('GameScene: Pause menu hidden');
  }

  /**
   * Create a menu button with hover effects
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} text - Button text
   * @param {Function} callback - Click callback
   * @returns {Phaser.GameObjects.Container} Button container
   */
  createMenuButton(x, y, text, callback) {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 300, 40, UI_STYLES.colors.buttonNormal);
    bg.setStrokeStyle(UI_STYLES.stroke.medium, UI_STYLES.colors.border);
    container.add(bg);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      font: UI_STYLES.fonts.heading,
      fill: UI_STYLES.colors.text,
      stroke: UI_STYLES.colors.textStroke,
      strokeThickness: UI_STYLES.stroke.medium
    });
    buttonText.setOrigin(0.5);
    container.add(buttonText);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(UI_STYLES.colors.buttonHover);
      bg.setStrokeStyle(UI_STYLES.stroke.medium, UI_STYLES.colors.borderHighlight);
      buttonText.setColor(UI_STYLES.colors.key);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(UI_STYLES.colors.buttonNormal);
      bg.setStrokeStyle(UI_STYLES.stroke.medium, UI_STYLES.colors.border);
      buttonText.setColor(UI_STYLES.colors.text);
    });

    bg.on('pointerdown', () => {
      bg.setFillStyle(UI_STYLES.colors.buttonActive);
    });

    bg.on('pointerup', () => {
      bg.setFillStyle(UI_STYLES.colors.buttonHover);
      callback();
    });

    return container;
  }

  /**
   * Update HUD display
   */
  /**
     * Update HUD display
     */
    updateHUD() {
      if (!this.turnManager || !this.player) return;

      // Update collapse meter with color coding
      const collapseMeter = this.turnManager.getCollapseMeter();
      const maxMoves = this.turnManager.initialCollapseMeter;
      const percentage = collapseMeter / maxMoves;

      // Color code based on percentage (red when below 25%)
      let color = '#ffffff'; // White (normal)
      if (percentage <= 0.25) {
        color = '#ff0000'; // Red (warning)
      } else if (percentage <= 0.5) {
        color = '#ffaa00'; // Orange (caution)
      }

      this.hudElements.collapseMeterText.setText(`Moves: ${collapseMeter}/${maxMoves}`);
      this.hudElements.collapseMeterText.setColor(color);

      // Add pulsing animation when critically low (below 25%)
      if (percentage <= 0.25) {
        // Create or update pulsing tween
        if (!this.collapseMeterPulseTween || !this.collapseMeterPulseTween.isPlaying()) {
          this.collapseMeterPulseTween = this.tweens.add({
            targets: this.hudElements.collapseMeterText,
            alpha: { from: 1, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else {
        // Stop pulsing animation if meter is not critically low
        if (this.collapseMeterPulseTween && this.collapseMeterPulseTween.isPlaying()) {
          this.collapseMeterPulseTween.stop();
          this.hudElements.collapseMeterText.setAlpha(1);
        }
      }

      // Update HP
      const hearts = '♥'.repeat(this.player.hp) + '♡'.repeat(this.player.maxHp - this.player.hp);
      this.hudElements.hpText.setText(hearts);

      // Update keys
      this.hudElements.keysText.setText(`🔑 Keys: ${this.player.keysCollected}/${this.gameState.keysRequired}`);

      // Update turn counter
      this.hudElements.turnText.setText(`Turn: ${this.turnManager.getTurnNumber()}`);

      // Update inventory display
      this.updateInventoryDisplay();

      // Update shift indicator
      this.updateShiftIndicator();

      // Update objective tracker
      this.updateObjectiveTracker();
    }
    /**
     * Update inventory display in HUD
     * Shows available power-ups with their hotkeys
     */
    updateInventoryDisplay() {
      if (!this.player || !this.hudElements.inventoryText) return;

      const inventory = this.player.inventory || [];

      // Count power-ups by type
      const powerUpCounts = {
        ANCHOR: 0,
        PHASE_STEP: 0,
        UNDO: 0,
        SHIELD: 0
      };

      for (const item of inventory) {
        if (powerUpCounts[item.type] !== undefined) {
          powerUpCounts[item.type]++;
        }
      }

      // Build inventory display string
      const inventoryParts = [];

      if (powerUpCounts.ANCHOR > 0) {
        inventoryParts.push(`[1] Anchor: ${powerUpCounts.ANCHOR}`);
      }
      if (powerUpCounts.PHASE_STEP > 0) {
        inventoryParts.push(`[2] Phase: ${powerUpCounts.PHASE_STEP}`);
      }
      if (powerUpCounts.UNDO > 0) {
        inventoryParts.push(`[3] Undo: ${powerUpCounts.UNDO}`);
      }
      if (powerUpCounts.SHIELD > 0) {
        inventoryParts.push(`[4] Shield: ${powerUpCounts.SHIELD}`);
      }

      // Add active shield indicator
      if (this.player.activeShield) {
        inventoryParts.push('🛡️ ACTIVE');
      }

      const inventoryText = inventoryParts.length > 0
        ? 'Inventory: ' + inventoryParts.join(' | ')
        : 'Inventory: Empty';

      this.hudElements.inventoryText.setText(inventoryText);
    }

  /**
   * Update objective tracker display
   * Shows current objectives and progress toward completion
   */
  updateObjectiveTracker() {
    if (!this.hudElements.objectiveText || !this.hudElements.progressText) return;
    if (!this.gameState || !this.player) return;

    // Determine current objective
    let objectiveText = '';
    let progressText = '';
    let objectiveColor = '#ffffff';

    const keysCollected = this.player.keysCollected;
    const keysRequired = this.gameState.keysRequired;
    const exitUnlocked = this.gameState.exitUnlocked;

    if (keysCollected < keysRequired) {
      // Need to collect keys
      objectiveText = '🔑 Collect Keys';
      progressText = `${keysCollected}/${keysRequired} keys collected`;
      objectiveColor = '#ffff00';
    } else if (!exitUnlocked) {
      // Keys collected but exit not yet unlocked (shouldn't happen but handle it)
      objectiveText = '🚪 Exit Unlocking...';
      progressText = 'All keys collected!';
      objectiveColor = '#00ff00';
    } else {
      // Exit is unlocked, reach it
      objectiveText = '🚪 Reach the Exit!';
      progressText = 'Exit is unlocked';
      objectiveColor = '#00ff00';
    }

    this.hudElements.objectiveText.setText(objectiveText);
    this.hudElements.objectiveText.setColor(objectiveColor);
    this.hudElements.progressText.setText(progressText);
  }


  /**
   * Update shift indicator to show next shift operation
   */
  updateShiftIndicator() {
    if (!this.gameState || !this.gameState.shiftSystem) return;

    const nextOperation = this.gameState.shiftSystem.getNextOperation();
    if (!nextOperation) return;

    // Format the shift description
    const description = this.formatShiftDescription(nextOperation);
    this.hudElements.shiftPatternText.setText(description);

    // Update visual diagram
    this.updateShiftDiagram(nextOperation);
  }

  /**
   * Update visual diagram showing chunks and shift operation
   * @param {Object} operation - Shift operation
   */
  updateShiftDiagram(operation) {
    // Clear existing diagram
    this.hudElements.shiftDiagram.removeAll(true);

    const chunkSize = 20; // Size of each chunk square in pixels
    const gap = 5; // Gap between chunks

    // Get chunk manager to check for anchored chunks
    const chunkManager = this.chunkManager;

    // Draw 2x2 grid of chunks
    const chunks = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const chunkId = row * 2 + col;
        const x = col * (chunkSize + gap);
        const y = row * (chunkSize + gap);

        // Check if chunk is anchored
        const chunk = chunkManager ? chunkManager.getChunkById(chunkId) : null;
        const isAnchored = chunk && chunk.isAnchored;
        const anchorTurns = chunk ? chunk.anchorTurnsRemaining : 0;

        // Create chunk rectangle with different color if anchored
        const color = isAnchored ? UI_STYLES.colors.anchor : 0x444444;
        const rect = this.add.rectangle(x, y, chunkSize, chunkSize, color);
        rect.setStrokeStyle(UI_STYLES.stroke.medium, isAnchored ? UI_STYLES.colors.anchorHighlight : UI_STYLES.colors.border);
        rect.setOrigin(0, 0);

        // Add chunk label
        const labelText = isAnchored ? `${chunkId}\n⚓${anchorTurns}` : chunkId.toString();
        const label = this.add.text(x + chunkSize / 2, y + chunkSize / 2, labelText, {
          font: UI_STYLES.fonts.tinyBold,
          fill: UI_STYLES.colors.text,
          align: 'center'
        });
        label.setOrigin(0.5, 0.5);

        this.hudElements.shiftDiagram.add(rect);
        this.hudElements.shiftDiagram.add(label);

        chunks.push({ id: chunkId, x: x + chunkSize / 2, y: y + chunkSize / 2 });
      }
    }

    // Draw arrows or indicators based on operation type
    if (operation.type === 'ROOM_SWAP') {
      this.drawSwapArrows(chunks, operation.params.chunkA, operation.params.chunkB);
    } else if (operation.type === 'ROOM_ROTATE') {
      this.drawRotateIndicator(chunks, operation.params.chunkId);
    } else if (operation.type === 'ROW_COLUMN_SLIDE') {
      this.drawSlideIndicator(chunks, operation.params);
    }
  }

  /**
   * Draw arrows showing chunk swap
   * @param {Array} chunks - Array of chunk positions
   * @param {number} chunkA - First chunk ID
   * @param {number} chunkB - Second chunk ID
   */
  drawSwapArrows(chunks, chunkA, chunkB) {
    const chunkAPos = chunks.find(c => c.id === chunkA);
    const chunkBPos = chunks.find(c => c.id === chunkB);

    if (!chunkAPos || !chunkBPos) return;

    // Draw double-headed arrow between chunks
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffaa00, 1);

    // Draw line
    graphics.beginPath();
    graphics.moveTo(chunkAPos.x, chunkAPos.y);
    graphics.lineTo(chunkBPos.x, chunkBPos.y);
    graphics.strokePath();

    // Draw arrowheads
    const angle = Math.atan2(chunkBPos.y - chunkAPos.y, chunkBPos.x - chunkAPos.x);
    const arrowSize = 5;

    // Arrowhead at B
    graphics.fillStyle(0xffaa00, 1);
    graphics.beginPath();
    graphics.moveTo(chunkBPos.x, chunkBPos.y);
    graphics.lineTo(
      chunkBPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
      chunkBPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    graphics.lineTo(
      chunkBPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
      chunkBPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    graphics.closePath();
    graphics.fillPath();

    // Arrowhead at A
    graphics.beginPath();
    graphics.moveTo(chunkAPos.x, chunkAPos.y);
    graphics.lineTo(
      chunkAPos.x + arrowSize * Math.cos(angle - Math.PI / 6),
      chunkAPos.y + arrowSize * Math.sin(angle - Math.PI / 6)
    );
    graphics.lineTo(
      chunkAPos.x + arrowSize * Math.cos(angle + Math.PI / 6),
      chunkAPos.y + arrowSize * Math.sin(angle + Math.PI / 6)
    );
    graphics.closePath();
    graphics.fillPath();

    this.hudElements.shiftDiagram.add(graphics);
  }

  /**
   * Draw rotation indicator on chunk
   * @param {Array} chunks - Array of chunk positions
   * @param {number} chunkId - Chunk to rotate
   */
  drawRotateIndicator(chunks, chunkId) {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    // Draw circular arrow indicating rotation
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffaa00, 1);

    const radius = 8;
    graphics.beginPath();
    graphics.arc(chunk.x, chunk.y, radius, 0, Math.PI * 1.5, false);
    graphics.strokePath();

    // Draw arrowhead
    const arrowX = chunk.x;
    const arrowY = chunk.y - radius;
    graphics.fillStyle(0xffaa00, 1);
    graphics.beginPath();
    graphics.moveTo(arrowX, arrowY);
    graphics.lineTo(arrowX - 3, arrowY + 5);
    graphics.lineTo(arrowX + 3, arrowY + 5);
    graphics.closePath();
    graphics.fillPath();

    this.hudElements.shiftDiagram.add(graphics);
  }

  /**
   * Draw slide indicator
   * @param {Array} chunks - Array of chunk positions
   * @param {Object} params - Slide parameters
   */
  drawSlideIndicator(chunks, params) {
    // For row/column slide, highlight the affected row or column
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffaa00, 1);

    if (params.axis === 'row') {
      const y = params.index * 25; // Approximate row position
      graphics.beginPath();
      graphics.moveTo(0, y + 10);
      graphics.lineTo(45, y + 10);
      graphics.strokePath();

      // Draw arrow
      const arrowX = params.direction === 'right' ? 45 : 0;
      const arrowDir = params.direction === 'right' ? 1 : -1;
      graphics.fillStyle(0xffaa00, 1);
      graphics.beginPath();
      graphics.moveTo(arrowX, y + 10);
      graphics.lineTo(arrowX - arrowDir * 5, y + 7);
      graphics.lineTo(arrowX - arrowDir * 5, y + 13);
      graphics.closePath();
      graphics.fillPath();
    } else {
      const x = params.index * 25; // Approximate column position
      graphics.beginPath();
      graphics.moveTo(x + 10, 0);
      graphics.lineTo(x + 10, 45);
      graphics.strokePath();

      // Draw arrow
      const arrowY = params.direction === 'down' ? 45 : 0;
      const arrowDir = params.direction === 'down' ? 1 : -1;
      graphics.fillStyle(0xffaa00, 1);
      graphics.beginPath();
      graphics.moveTo(x + 10, arrowY);
      graphics.lineTo(x + 7, arrowY - arrowDir * 5);
      graphics.lineTo(x + 13, arrowY - arrowDir * 5);
      graphics.closePath();
      graphics.fillPath();
    }

    this.hudElements.shiftDiagram.add(graphics);
  }

  /**
   * Format shift operation into readable description
   * @param {Object} operation - Shift operation
   * @returns {string} Formatted description
   */
  formatShiftDescription(operation) {
    if (operation.type === 'ROOM_SWAP') {
      const chunkNames = ['TL', 'TR', 'BL', 'BR']; // Top-Left, Top-Right, Bottom-Left, Bottom-Right
      const chunkA = chunkNames[operation.params.chunkA] || operation.params.chunkA;
      const chunkB = chunkNames[operation.params.chunkB] || operation.params.chunkB;
      return `Swap ${chunkA} ↔ ${chunkB}`;
    } else if (operation.type === 'ROOM_ROTATE') {
      const chunkNames = ['TL', 'TR', 'BL', 'BR'];
      const chunk = chunkNames[operation.params.chunkId] || operation.params.chunkId;
      return `Rotate ${chunk} ↻`;
    } else if (operation.type === 'ROW_COLUMN_SLIDE') {
      const axis = operation.params.axis === 'row' ? 'Row' : 'Col';
      const direction = operation.params.direction === 'right' || operation.params.direction === 'down' ? '→' : '←';
      return `${axis} ${operation.params.index} ${direction}`;
    }
    return 'Unknown';
  }

  /**
   * Creates a test level with various tile types to demonstrate rendering
   * This will be replaced with actual level loading in future tasks
   */
  createTestLevel() {
    // Create walls around the perimeter
    for (let x = 0; x < this.grid.width; x++) {
      this.grid.setTile(x, 0, { type: TileType.WALL, x, y: 0 });
      this.grid.setTile(x, this.grid.height - 1, { type: TileType.WALL, x, y: this.grid.height - 1 });
    }
    for (let y = 0; y < this.grid.height; y++) {
      this.grid.setTile(0, y, { type: TileType.WALL, x: 0, y });
      this.grid.setTile(this.grid.width - 1, y, { type: TileType.WALL, x: this.grid.width - 1, y });
    }

    // Add some interior walls
    this.grid.setTile(5, 5, { type: TileType.WALL, x: 5, y: 5 });
    this.grid.setTile(6, 5, { type: TileType.WALL, x: 6, y: 5 });
    this.grid.setTile(7, 5, { type: TileType.WALL, x: 7, y: 5 });

    // Add a spike trap
    this.grid.setTile(3, 3, { type: TileType.SPIKE_TRAP, x: 3, y: 3, state: { active: false } });

    // Add a cracked floor
    this.grid.setTile(8, 3, { type: TileType.CRACKED_FLOOR, x: 8, y: 3, state: { crackLevel: 1 } });

    // Add slime tile
    this.grid.setTile(4, 7, { type: TileType.SLIME, x: 4, y: 7 });

    // Add a key
    this.grid.setTile(2, 2, { type: TileType.KEY, x: 2, y: 2 });

    // Add exit portal (locked)
    this.grid.setTile(10, 10, { type: TileType.EXIT, x: 10, y: 10, state: { unlocked: false } });

    console.log('GameScene: Test level created');
  }

  update(time, delta) {
    // Performance monitoring
    if (this.enablePerformanceMonitoring) {
      performanceMonitor.update();
    }
    
    // Update sprite depths based on Y position for proper layering
    this.updateSpriteDepths();

    // Don't process input if we're already processing a turn or game is over
    if (this.isProcessingTurn || this.isGameOver) {
      return;
    }

    // Handle anchor selection mode
    if (this.anchorSelectionMode) {
      const powerUpKey = this.inputManager.getPowerUpInput();
      if (powerUpKey) {
        // Map power-up keys to chunk IDs (1->0, 2->1, 3->2, 4->3)
        const chunkId = parseInt(powerUpKey) - 1;
        this.selectChunkForAnchor(chunkId);
      }
      return; // Don't process other input during anchor selection
    }

    // Check for directional input
    if (this.inputManager && this.inputManager.isEnabled()) {
      const direction = this.inputManager.getDirectionInput();
      if (direction !== Direction.NONE) {
        this.handlePlayerMove(direction);
      }

      // Check for power-up input
      const powerUpKey = this.inputManager.getPowerUpInput();
      if (powerUpKey) {
        this.handlePowerUpActivation(powerUpKey);
      }
    }
  }

  /**
   * Update sprite depths based on Y position for proper layering
   * Sprites further down (higher Y) should render on top
   * This creates the illusion of depth in a top-down view
   * Also ensures sprites stay at their correct grid positions
   */
  updateSpriteDepths() {
    // Base depth for entities (between floor and walls)
    const baseDepth = 10;
    
    // Update player depth and force correct position
    if (this.player && this.player.sprite && this.tileRenderer) {
      // Set depth based on grid Y
      this.player.sprite.setDepth(baseDepth + this.player.gridY);
      
      // FORCE correct position every frame to prevent drift
      const correctPos = this.tileRenderer.getScreenPosition(this.player.gridX, this.player.gridY);
      const currentX = this.player.sprite.x;
      const currentY = this.player.sprite.y;
      
      // If position has drifted more than 1 pixel, snap back
      if (Math.abs(currentX - correctPos.x) > 1 || Math.abs(currentY - correctPos.y) > 1) {
        console.warn(`Player position drift detected: current=(${currentX}, ${currentY}), correct=(${correctPos.x}, ${correctPos.y}), snapping back`);
        this.player.sprite.setPosition(correctPos.x, correctPos.y);
      }
    }
    
    // Update enemy depths and force correct positions
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite && this.tileRenderer) {
          // Set depth based on grid Y
          enemy.sprite.setDepth(baseDepth + enemy.gridY);
          
          // FORCE correct position every frame
          const correctPos = this.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
          const currentX = enemy.sprite.x;
          const currentY = enemy.sprite.y;
          
          // If position has drifted more than 1 pixel, snap back
          if (Math.abs(currentX - correctPos.x) > 1 || Math.abs(currentY - correctPos.y) > 1) {
            console.warn(`Enemy position drift detected: current=(${currentX}, ${currentY}), correct=(${correctPos.x}, ${correctPos.y}), snapping back`);
            enemy.sprite.setPosition(correctPos.x, correctPos.y);
          }
        }
      }
    }
  }

  /**
   * Handles player movement input
   * Uses TurnManager to process the complete turn sequence
   * @param {string} direction - Direction constant from InputManager
   */
  async handlePlayerMove(direction) {
    if (!this.player || !this.turnManager) return;

    // Prevent multiple turns from being processed simultaneously
    this.isProcessingTurn = true;

    const delta = InputManager.directionToDelta(direction);
    const currentPos = this.player.getGridPosition();

    console.log(`GameScene: Player move requested - Direction: ${direction}, From: (${currentPos.x}, ${currentPos.y})`);

    // Update player facing direction
    const facingMap = {
      [Direction.UP]: 'up',
      [Direction.DOWN]: 'down',
      [Direction.LEFT]: 'left',
      [Direction.RIGHT]: 'right'
    };
    this.player.setFacing(facingMap[direction]);

    // Check if exit was locked before turn
    const wasExitLocked = !this.gameState.exitUnlocked;

    // Process turn through TurnManager
    const turnResult = await this.turnManager.processTurn(
      this.player,
      delta,
      this.grid,
      this.gameState
    );

    // Play movement sound if move was successful
    if (turnResult.success && this.audioManager) {
      this.audioManager.playMovementSound();
    }

    // Animate slide if player slid on slime tiles
    if (turnResult.slidePositions && turnResult.slidePositions.length > 0) {
      await this.animateSlide(turnResult.slidePositions);
    }

    // Show particle effects for collected items
    if (turnResult.collectedItems && turnResult.collectedItems.length > 0) {
      for (const item of turnResult.collectedItems) {
        if (item.type === 'DOOR_UNLOCKED') {
          // Show door unlock animation
          this.showDoorUnlockAnimation(item.position.x, item.position.y);
          // Play door unlock sound
          if (this.audioManager) {
            this.audioManager.playDoorUnlockSound();
          }
        } else {
          // Show collection particle effect
          this.showCollectionEffect(item.position.x, item.position.y, item.type);
          // Play collection sound based on item type
          if (this.audioManager) {
            if (item.type === 'KEY') {
              this.audioManager.playKeyCollectSound();
            } else {
              this.audioManager.playPowerUpCollectSound();
            }
          }
        }
      }
    }

    // Refresh tile renderer to show any tile changes (key collection, spike activation, etc.)
    if (this.tileRenderer) {
      this.tileRenderer.refreshGrid();
    }

    // Handle hazard results (damage effects)
    if (turnResult.hazardResults && turnResult.hazardResults.length > 0) {
      for (const hazard of turnResult.hazardResults) {
        if (hazard.damage > 0) {
          this.showDamageEffect();
          // Play damage sound
          if (this.audioManager) {
            this.audioManager.playDamageSound();
          }
        }
        // Show spike animation for spike traps
        if (hazard.type === 'trap' && hazard.description.includes('Spike')) {
          this.showSpikeAnimation(hazard.position.x, hazard.position.y);
          // Play spike sound
          if (this.audioManager) {
            this.audioManager.playSpikeSound();
          }
        }
        // Play arrow sound for arrow traps
        if (hazard.type === 'trap' && hazard.description.includes('Arrow')) {
          if (this.audioManager) {
            this.audioManager.playArrowSound();
          }
        }
      }
    }

    // Check if exit was just unlocked and create glow animation
    if (wasExitLocked && this.gameState.exitUnlocked) {
      const exitPos = this.currentLevelData.exitPosition;
      this.createExitGlow(exitPos.x, exitPos.y);
    }

    // If shift was executed, animate it
    if (turnResult.shiftExecuted) {
      // Play shift sound
      if (this.audioManager) {
        this.audioManager.playShiftSound();
      }
      await this.animateShift();
    }

    // Update HUD
    this.updateHUD();

    // Handle turn result
    if (turnResult.success) {
      console.log('GameScene: Turn processed successfully');

      // Check for game over
      if (turnResult.gameOver) {
        console.log(`GameScene: Game over detected - Victory: ${turnResult.victory}`);
        this.handleGameOver(turnResult.victory);
        return; // Stop processing after game over
      }
    } else {
      console.log('GameScene: Turn failed -', turnResult.message);
    }

    // Re-enable input
    this.isProcessingTurn = false;
  }

  /**
   * Animate the shift operation
   * Creates a visual effect showing chunks moving
   * @returns {Promise} Resolves when animation completes
   */
  async animateShift() {
    console.log('GameScene: Animating shift');
    
    // Get the previous shift operation to determine animation type
    const shiftSystem = this.gameState?.shiftSystem;
    if (!shiftSystem) {
      return Promise.resolve();
    }
    
    // Get the operation that just executed (currentIndex was already advanced)
    const pattern = shiftSystem.pattern;
    const prevIndex = (pattern.currentIndex - 1 + pattern.sequence.length) % pattern.sequence.length;
    const operation = pattern.sequence[prevIndex];
    
    // Refresh tile renderer to show new tile positions
    if (this.tileRenderer) {
      this.tileRenderer.render();
    }
    
    // Animate based on operation type
    if (operation && operation.type === 'ROOM_ROTATE') {
      return this.animateRotation(operation);
    } else if (operation && operation.type === 'ROW_COLUMN_SLIDE') {
      return this.animateRowColumnSlide(operation);
    } else {
      return this.animateSwap();
    }
  }
  
  /**
   * Animate rotation shift
   * Creates a rotation effect for the player and enemies
   * @param {Object} operation - Rotation operation
   * @returns {Promise} Resolves when animation completes
   */
  async animateRotation(operation) {
    console.log('GameScene: Animating rotation');
    
    const promises = [];
    
    // Animate player sprite to new position with rotation
    if (this.player && this.player.sprite) {
      const pos = this.tileRenderer.getScreenPosition(this.player.gridX, this.player.gridY);
      
      promises.push(new Promise((resolve) => {
        this.tweens.add({
          targets: this.player.sprite,
          x: pos.x,
          y: pos.y,
          angle: this.player.sprite.angle + 360, // Full rotation for visual effect
          duration: 500, // 500ms animation
          ease: 'Power2',
          onComplete: () => {
            // Reset angle to 0 after animation
            this.player.sprite.angle = 0;
            resolve();
          }
        });
      }));
    }
    
    // Animate enemy sprites to new positions with rotation
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite) {
          const pos = this.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
          
          promises.push(new Promise((resolve) => {
            this.tweens.add({
              targets: enemy.sprite,
              x: pos.x,
              y: pos.y,
              angle: enemy.sprite.angle + 360, // Full rotation for visual effect
              duration: 500, // 500ms animation
              ease: 'Power2',
              onComplete: () => {
                // Reset angle to 0 after animation
                enemy.sprite.angle = 0;
                resolve();
              }
            });
          }));
        }
      }
    }
    
    // Wait for all animations to complete
    await Promise.all(promises);
    console.log('GameScene: Rotation animation complete');
  }
  
  /**
   * Animate swap shift
   * Creates a movement effect for the player and enemies
   * @returns {Promise} Resolves when animation completes
   */
  async animateSwap() {
    console.log('GameScene: Animating swap');
    
    const promises = [];
    
    // Animate player sprite to new position
    if (this.player && this.player.sprite) {
      const pos = this.tileRenderer.getScreenPosition(this.player.gridX, this.player.gridY);
      
      promises.push(new Promise((resolve) => {
        this.tweens.add({
          targets: this.player.sprite,
          x: pos.x,
          y: pos.y,
          duration: 400, // 400ms animation
          ease: 'Power2',
          onComplete: () => {
            resolve();
          }
        });
      }));
    }
    
    // Animate enemy sprites to new positions
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite) {
          const pos = this.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
          
          promises.push(new Promise((resolve) => {
            this.tweens.add({
              targets: enemy.sprite,
              x: pos.x,
              y: pos.y,
              duration: 400, // 400ms animation
              ease: 'Power2',
              onComplete: () => {
                resolve();
              }
            });
          }));
        }
      }
    }
    
    // Wait for all animations to complete
    await Promise.all(promises);
    console.log('GameScene: Swap animation complete');
  }

  /**
   * Animate row/column slide shift
   * Creates a sliding effect for the player and enemies
   * @param {Object} operation - Slide operation
   * @returns {Promise} Resolves when animation completes
   */
  async animateRowColumnSlide(operation) {
    console.log('GameScene: Animating row/column slide');
    
    const promises = [];
    
    // Animate player sprite to new position with slide effect
    if (this.player && this.player.sprite) {
      const pos = this.tileRenderer.getScreenPosition(this.player.gridX, this.player.gridY);
      
      promises.push(new Promise((resolve) => {
        this.tweens.add({
          targets: this.player.sprite,
          x: pos.x,
          y: pos.y,
          duration: 350, // 350ms animation (slightly faster than swap)
          ease: 'Sine.easeInOut', // Smooth slide effect
          onComplete: () => {
            resolve();
          }
        });
      }));
    }
    
    // Animate enemy sprites to new positions
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite) {
          const pos = this.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
          
          promises.push(new Promise((resolve) => {
            this.tweens.add({
              targets: enemy.sprite,
              x: pos.x,
              y: pos.y,
              duration: 350, // 350ms animation
              ease: 'Sine.easeInOut', // Smooth slide effect
              onComplete: () => {
                resolve();
              }
            });
          }));
        }
      }
    }
    
    // Wait for all animations to complete
    await Promise.all(promises);
    console.log('GameScene: Row/column slide animation complete');
  }

  /**
   * Animate player sliding on slime tiles
   * Creates smooth tween animations for each slide position
   * @param {Array<{x: number, y: number}>} slidePositions - Positions player slid through
   * @returns {Promise} Resolves when all slide animations complete
   */
  async animateSlide(slidePositions) {
    console.log(`GameScene: Animating slide through ${slidePositions.length} position(s)`);

    // Animate each slide position sequentially
    for (const pos of slidePositions) {
      await this.player.slideTo(pos.x, pos.y, 200);
    }

    console.log('GameScene: Slide animation complete');
  }

  /**
   * Handle game over state
   * @param {boolean} victory - True if player won, false if lost
   */
  handleGameOver(victory) {
    console.log(`GameScene: Game over - Victory: ${victory}`);

    // Set game over flag to prevent input processing
    this.isGameOver = true;
    
    console.log('GameScene: isGameOver flag set to true');

    // Hide player sprite during game over screen
    if (this.player && this.player.sprite) {
      this.player.sprite.setVisible(false);
    }

    // Hide all enemy sprites during game over screen
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite) {
          enemy.sprite.setVisible(false);
        }
      }
    }

    // Disable input
    if (this.inputManager) {
      this.inputManager.disable();
      console.log('GameScene: InputManager disabled');
    }

    // Display game over message
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    try {
      if (victory) {
        console.log('GameScene: Showing victory screen');
        this.handleVictory();
      } else {
        console.log('GameScene: Showing defeat screen');
        this.handleDefeat();
      }
    } catch (error) {
      console.error('GameScene: Error showing game over screen:', error);
    }
  }

  /**
   * Handle victory state
   */
  handleVictory() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Play victory sound
    if (this.audioManager) {
      this.audioManager.playVictorySound();
    }

    // Check if this is the final level (level 10)
    const isFinalLevel = this.levelId === 10;

    if (isFinalLevel) {
      // Epic final level victory sequence
      this.showFinalVictorySequence(width, height);
    } else {
      // Standard victory for other levels
      this.showStandardVictory(width, height);
    }
  }

  showStandardVictory(width, height) {
    // Save level progress
    this.saveLevelProgress();

    // Create semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7);
    overlay.setOrigin(0);

    // Victory text with animation
    const victoryText = this.add.text(width / 2, height / 2 - 100, 'VICTORY!', {
      font: 'bold 48px monospace',
      fill: '#00ff00',
      stroke: '#008800',
      strokeThickness: 4
    });
    victoryText.setOrigin(0.5);
    victoryText.setAlpha(0);
    victoryText.setScale(0.5);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Level complete text
    const levelText = this.add.text(width / 2, height / 2 - 50, `Level ${this.levelId} Complete!`, {
      font: 'bold 24px monospace',
      fill: '#ffffff'
    });
    levelText.setOrigin(0.5);
    levelText.setAlpha(0);

    this.tweens.add({
      targets: levelText,
      alpha: 1,
      duration: 600,
      delay: 300
    });

    // Stats display
    const movesUsed = this.turnManager.initialCollapseMeter - this.turnManager.collapseMeter;
    const maxMoves = this.turnManager.initialCollapseMeter || 0;
    const statsText = this.add.text(width / 2, height / 2 + 10, 
      `Moves: ${movesUsed}/${maxMoves}\n` +
      `HP Remaining: ${this.player.hp}/3\n` +
      `Turn: ${this.turnManager.turnNumber}`, {
      font: '18px monospace',
      fill: '#cccccc',
      align: 'center'
    });
    statsText.setOrigin(0.5);
    statsText.setAlpha(0);

    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 600,
      delay: 600
    });

    // Check if there's a next level
    const nextLevelId = this.levelId + 1;
    const hasNextLevel = this.levelLoader.levelExists(nextLevelId);

    if (hasNextLevel) {
      const nextLevelText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE for next level', {
        font: 'bold 18px monospace',
        fill: '#ffff00'
      });
      nextLevelText.setOrigin(0.5);
      nextLevelText.setAlpha(0);

      this.tweens.add({
        targets: nextLevelText,
        alpha: 1,
        duration: 600,
        delay: 900
      });

      // Enable space key for next level
      this.input.keyboard.once('keydown-SPACE', () => {
        this.transitionToLevel(nextLevelId);
      });
    }

    const menuText = this.add.text(width / 2, height / 2 + 110, 'Press ESC to return to menu', {
      font: '16px monospace',
      fill: '#888888'
    });
    menuText.setOrigin(0.5);
    menuText.setAlpha(0);

    this.tweens.add({
      targets: menuText,
      alpha: 1,
      duration: 600,
      delay: 1200
    });

    // Enable ESC key to return to menu
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  showFinalVictorySequence(width, height) {
    // Save level progress
    this.saveLevelProgress();

    // Create semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7);
    overlay.setOrigin(0);

    // Screen flash effect
    const flash = this.add.rectangle(0, 0, width * 2, height * 2, 0xffffff, 0.8);
    flash.setOrigin(0);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });

    // Camera shake for impact
    this.cameras.main.shake(500, 0.01);

    // Main victory text with animation
    const victoryText = this.add.text(width / 2, height / 2 - 100, 'DUNGEON CONQUERED!', {
      font: 'bold 48px monospace',
      fill: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 4
    });
    victoryText.setOrigin(0.5);
    victoryText.setAlpha(0);
    victoryText.setScale(0.5);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 500
    });

    // Stats display
    const movesUsed = this.turnManager.maxCollapseMeter - this.turnManager.collapseMeter;
    const statsText = this.add.text(width / 2, height / 2 - 30, 
      `Final Level Stats:\n` +
      `Moves: ${movesUsed}/${this.turnManager.maxCollapseMeter}\n` +
      `HP Remaining: ${this.player.hp}/3\n` +
      `Turn: ${this.turnManager.turnNumber}`, {
      font: '18px monospace',
      fill: '#ffffff',
      align: 'center'
    });
    statsText.setOrigin(0.5);
    statsText.setAlpha(0);

    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 600,
      delay: 1300
    });

    // Congratulations message
    const congratsText = this.add.text(width / 2, height / 2 + 50, 
      'You have mastered the shifting dungeon!', {
      font: '20px monospace',
      fill: '#00ff88'
    });
    congratsText.setOrigin(0.5);
    congratsText.setAlpha(0);

    this.tweens.add({
      targets: congratsText,
      alpha: 1,
      duration: 600,
      delay: 1800
    });

    // Completion message
    const completeText = this.add.text(width / 2, height / 2 + 90, 'All levels complete!', {
      font: 'bold 24px monospace',
      fill: '#ffaa00'
    });
    completeText.setOrigin(0.5);
    completeText.setAlpha(0);

    this.tweens.add({
      targets: completeText,
      alpha: 1,
      duration: 600,
      delay: 2300
    });

    // Menu instruction
    const menuText = this.add.text(width / 2, height / 2 + 130, 'Press ESC to return to menu', {
      font: '16px monospace',
      fill: '#888888'
    });
    menuText.setOrigin(0.5);
    menuText.setAlpha(0);

    this.tweens.add({
      targets: menuText,
      alpha: 1,
      duration: 600,
      delay: 2800
    });

    // Enable ESC key to return to menu
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // Particle effects for celebration
    if (this.player && this.player.sprite) {
      const particles = this.add.particles(this.player.sprite.x, this.player.sprite.y, 'tileset', {
        frame: 0,
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        frequency: 50,
        quantity: 2,
        tint: [0xffff00, 0xff8800, 0x00ff88]
      });

      this.time.delayedCall(3000, () => {
        particles.stop();
      });
    }
  }

  /**
   * Handle defeat state
   */
  handleDefeat() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Play defeat sound
    if (this.audioManager) {
      this.audioManager.playDefeatSound();
    }

    // Create semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7);
    overlay.setOrigin(0);

    // Game over text with animation
    const gameOverText = this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      font: 'bold 48px monospace',
      fill: '#ff0000',
      stroke: '#880000',
      strokeThickness: 4
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setAlpha(0);
    gameOverText.setScale(0.5);

    this.tweens.add({
      targets: gameOverText,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Determine failure reason
    let failureReason = '';
    if (this.player.hp <= 0) {
      failureReason = 'HP depleted';
    } else if (this.turnManager.collapseMeter <= 0) {
      failureReason = 'Dungeon collapsed';
    } else {
      failureReason = 'Unknown';
    }

    const reasonText = this.add.text(width / 2, height / 2 - 30, failureReason, {
      font: 'bold 20px monospace',
      fill: '#ffaaaa'
    });
    reasonText.setOrigin(0.5);
    reasonText.setAlpha(0);

    this.tweens.add({
      targets: reasonText,
      alpha: 1,
      duration: 600,
      delay: 300
    });

    // Stats display
    const movesUsed = this.turnManager.initialCollapseMeter - this.turnManager.collapseMeter;
    const maxMoves = this.turnManager.initialCollapseMeter || 0;
    const statsText = this.add.text(width / 2, height / 2 + 10, 
      `Moves: ${movesUsed}/${maxMoves}\n` +
      `HP: ${this.player.hp}/3\n` +
      `Turn: ${this.turnManager.turnNumber}`, {
      font: '16px monospace',
      fill: '#cccccc',
      align: 'center'
    });
    statsText.setOrigin(0.5);
    statsText.setAlpha(0);

    this.tweens.add({
      targets: statsText,
      alpha: 1,
      duration: 600,
      delay: 600
    });

    // Retry button
    const retryText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to retry', {
      font: 'bold 18px monospace',
      fill: '#ffff00'
    });
    retryText.setOrigin(0.5);
    retryText.setAlpha(0);

    this.tweens.add({
      targets: retryText,
      alpha: 1,
      duration: 600,
      delay: 900
    });

    // Menu button
    const menuText = this.add.text(width / 2, height / 2 + 110, 'Press ESC to return to menu', {
      font: '16px monospace',
      fill: '#888888'
    });
    menuText.setOrigin(0.5);
    menuText.setAlpha(0);

    this.tweens.add({
      targets: menuText,
      alpha: 1,
      duration: 600,
      delay: 1200
    });

    // Enable space key for retry
    this.input.keyboard.once('keydown-SPACE', () => {
      this.restartLevel();
    });

    // Enable ESC key to return to menu
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  /**
   * Transition to a new level
   * @param {number} levelId - The level ID to transition to
   */
  transitionToLevel(levelId) {
    console.log(`GameScene: Transitioning to level ${levelId}`);
    this.scene.restart({ levelId });
  }

  /**
   * Restart the current level
   */
  restartLevel() {
    console.log(`GameScene: Restarting level ${this.levelId}`);
    this.scene.restart({ levelId: this.levelId });
  }

  /**
   * Save level progress to localStorage
   * Unlocks the next level when current level is completed
   */
  saveLevelProgress() {
    try {
      // Load existing progress
      let progress = { maxLevel: 1 };
      const saved = localStorage.getItem('dungeonShiftProgress');
      if (saved) {
        progress = JSON.parse(saved);
      }

      // Update max level if current level is higher
      const nextLevel = this.levelId + 1;
      if (nextLevel > progress.maxLevel) {
        progress.maxLevel = nextLevel;
      }

      // Save back to localStorage
      localStorage.setItem('dungeonShiftProgress', JSON.stringify(progress));
      console.log(`GameScene: Progress saved - Max level: ${progress.maxLevel}`);
    } catch (e) {
      console.error('GameScene: Error saving progress', e);
    }
  }

  /**
   * Validates if a move to the given grid position is allowed
   * @param {number} x - Target grid X coordinate
   * @param {number} y - Target grid Y coordinate
   * @returns {boolean} - True if move is valid
   */
  isValidMove(x, y) {
    // Check bounds
    if (x < 0 || x >= this.grid.width || y < 0 || y >= this.grid.height) {
      return false;
    }

    // Check if tile is walkable
    return this.grid.isWalkable(x, y);
  }

  /**
   * Handles power-up activation input
   * This is a placeholder that will be replaced with actual power-up logic
   * @param {string} powerUpKey - PowerUpKey constant from InputManager
   */
  /**
     * Handles power-up activation input
     * @param {string} powerUpKey - PowerUpKey constant from InputManager
     */
    handlePowerUpActivation(powerUpKey) {
      console.log(`GameScene: Power-up activation requested - Key: ${powerUpKey}`);

      const PowerUpKey = {
        ANCHOR: '1',
        PHASE_STEP: '2',
        UNDO: '3',
        SHIELD: '4'
      };

      // Handle undo power-up
      if (powerUpKey === PowerUpKey.UNDO) {
        this.activateUndo();
        return;
      }

      // Handle anchor power-up
      if (powerUpKey === PowerUpKey.ANCHOR) {
        this.activateAnchor();
        return;
      }

      // Handle phase step power-up
      if (powerUpKey === PowerUpKey.PHASE_STEP) {
        this.activatePhaseStep();
        return;
      }

      // Handle shield power-up
      if (powerUpKey === PowerUpKey.SHIELD) {
        this.activateShield();
        return;
      }

      // TODO: Implement other power-ups in future tasks
      console.log(`GameScene: Power-up ${powerUpKey} not yet implemented`);
    }
    /**
     * Activate undo power-up
     * Restores the game state to before the last move
     */
    activateUndo() {
      // Check if player has undo in inventory
      const undoIndex = this.player.inventory.findIndex(item => item.type === 'UNDO');

      if (undoIndex === -1) {
        console.log('GameScene: No undo power-up available');
        // Show feedback to player
        this.showMessage('No Undo available!', '#ff0000');
        return;
      }

      // Check if there's a saved state to restore
      if (!this.turnManager.savedState) {
        console.log('GameScene: No saved state available for undo');
        this.showMessage('Nothing to undo!', '#ff0000');
        return;
      }

      console.log('GameScene: Activating undo power-up');

      // Restore the previous game state
      const restored = this.turnManager.restoreState(this.player, this.grid, this.gameState);

      if (restored) {
        // Remove undo from inventory
        this.player.inventory.splice(undoIndex, 1);
        console.log('GameScene: Undo consumed from inventory');

        // Refresh the tile renderer to show restored grid
        if (this.tileRenderer) {
          this.tileRenderer.refreshGrid();
        }

        // Refresh enemies to show restored positions
        this.refreshEnemySprites();

        // Update HUD
        this.updateHUD();

        // Show feedback
        this.showMessage('Undo activated!', '#00ff00');

        console.log('GameScene: Undo successful');
      } else {
        console.log('GameScene: Undo failed');
        this.showMessage('Undo failed!', '#ff0000');
      }
    }

    /**
     * Activate anchor power-up
     * Allows player to select a chunk to anchor (prevent from shifting)
     */
    activateAnchor() {
      // Check if player has anchor in inventory
      const anchorIndex = this.player.inventory.findIndex(item => item.type === 'ANCHOR');

      if (anchorIndex === -1) {
        console.log('GameScene: No anchor power-up available');
        this.showMessage('No Anchor available!', '#ff0000');
        return;
      }

      console.log('GameScene: Activating anchor power-up - select a chunk');
      
      // Enter anchor selection mode
      this.anchorSelectionMode = true;
      this.anchorInventoryIndex = anchorIndex;
      
      // Show instruction message
      this.showMessage('Press 1-4 to anchor a chunk', '#00ffff');
      
      // Highlight chunks for selection
      this.showChunkSelectionOverlay();
    }

    /**
     * Show visual overlay for chunk selection
     */
    showChunkSelectionOverlay() {
      // Remove existing overlay if any
      if (this.chunkOverlay) {
        this.chunkOverlay.destroy();
      }

      // Create container for chunk overlays
      this.chunkOverlay = this.add.container(0, 0);
      
      const chunks = this.chunkManager.getChunks();
      
      chunks.forEach((chunk, index) => {
        // Calculate pixel position
        const pixelX = chunk.x * TILE_SIZE;
        const pixelY = chunk.y * TILE_SIZE;
        const pixelWidth = chunk.width * TILE_SIZE;
        const pixelHeight = chunk.height * TILE_SIZE;
        
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(
          pixelX + pixelWidth / 2,
          pixelY + pixelHeight / 2,
          pixelWidth,
          pixelHeight,
          0x00ffff,
          0.2
        );
        
        // Add border
        const border = this.add.rectangle(
          pixelX + pixelWidth / 2,
          pixelY + pixelHeight / 2,
          pixelWidth,
          pixelHeight
        );
        border.setStrokeStyle(2, 0x00ffff);
        
        // Add chunk number label
        const label = this.add.text(
          pixelX + pixelWidth / 2,
          pixelY + pixelHeight / 2,
          `${index + 1}`,
          {
            fontSize: '24px',
            color: '#00ffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
          }
        );
        label.setOrigin(0.5);
        
        // Add to container
        this.chunkOverlay.add([overlay, border, label]);
      });
    }

    /**
     * Handle chunk selection for anchor placement
     * @param {number} chunkId - Chunk ID (0-3)
     */
    selectChunkForAnchor(chunkId) {
      if (!this.anchorSelectionMode) {
        return;
      }

      // Validate chunk ID
      if (chunkId < 0 || chunkId > 3) {
        console.warn(`GameScene: Invalid chunk ID: ${chunkId}`);
        return;
      }

      console.log(`GameScene: Anchoring chunk ${chunkId}`);
      
      // Apply anchor to chunk (2 turns duration)
      this.chunkManager.anchorChunk(chunkId, 2);
      
      // Remove anchor from inventory
      this.player.inventory.splice(this.anchorInventoryIndex, 1);
      console.log('GameScene: Anchor consumed from inventory');
      
      // Exit anchor selection mode
      this.anchorSelectionMode = false;
      this.anchorInventoryIndex = -1;
      
      // Remove chunk overlay
      if (this.chunkOverlay) {
        this.chunkOverlay.destroy();
        this.chunkOverlay = null;
      }
      
      // Update HUD
      this.updateHUD();
      
      // Update shift indicator to show anchored chunk
      this.updateShiftIndicator();
      
      // Show feedback
      this.showMessage(`Chunk ${chunkId + 1} anchored for 2 turns!`, '#00ff00');
      
      console.log('GameScene: Anchor activated successfully');
    }

    /**
     * Activate shield power-up
     * Activates a shield that will absorb the next damage instance
     */
    activateShield() {
      // Check if player has shield in inventory
      const shieldIndex = this.player.inventory.findIndex(item => item.type === 'SHIELD');

      if (shieldIndex === -1) {
        console.log('GameScene: No shield power-up available');
        this.showMessage('No Shield available!', '#ff0000');
        return;
      }

      // Check if shield is already active
      if (this.player.activeShield) {
        console.log('GameScene: Shield already active');
        this.showMessage('Shield already active!', '#ffaa00');
        return;
      }

      console.log('GameScene: Activating shield power-up');

      // Activate shield
      this.player.activeShield = true;

      // Remove shield from inventory
      this.player.inventory.splice(shieldIndex, 1);
      console.log('GameScene: Shield consumed from inventory');

      // Update HUD
      this.updateHUD();

      // Show feedback with shield icon
      this.showMessage('Shield activated! 🛡️', '#00aaff');

      console.log('GameScene: Shield activated successfully');
    }

    /**
     * Activate phase step power-up
     * Allows the next move to pass through one wall tile
     */
    activatePhaseStep() {
      // Check if player has phase step in inventory
      const phaseStepIndex = this.player.inventory.findIndex(item => item.type === 'PHASE_STEP');

      if (phaseStepIndex === -1) {
        console.log('GameScene: No phase step power-up available');
        this.showMessage('No Phase Step available!', '#ff0000');
        return;
      }

      // Check if phase step is already active
      if (this.player.phaseStepActive) {
        console.log('GameScene: Phase step already active');
        this.showMessage('Phase Step already active!', '#ffaa00');
        return;
      }

      console.log('GameScene: Activating phase step power-up');

      // Activate phase step
      this.player.phaseStepActive = true;

      // Remove phase step from inventory
      this.player.inventory.splice(phaseStepIndex, 1);
      console.log('GameScene: Phase step consumed from inventory');

      // Update HUD
      this.updateHUD();

      // Show feedback
      this.showMessage('Phase Step activated! 👻', '#aa00ff');

      console.log('GameScene: Phase step activated successfully');
    }

    /**
     * Refresh enemy sprite positions after undo
     */
    refreshEnemySprites() {
      if (!this.gameState || !this.gameState.enemies) {
        return;
      }

      for (const enemy of this.gameState.enemies) {
        if (enemy.sprite && this.tileRenderer) {
          const pos = this.tileRenderer.getScreenPosition(enemy.gridX, enemy.gridY);
          enemy.sprite.setPosition(pos.x, pos.y);
        }
      }
    }

    /**
     * Show a temporary message to the player
     * @param {string} text - Message text
     * @param {string} color - Text color
     */
    showMessage(text, color = '#ffffff') {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      const message = this.add.text(width / 2, height / 2, text, {
        font: 'bold 20px monospace',
        fill: color
      });
      message.setOrigin(0.5);
      message.setDepth(1000); // Ensure it's on top

      // Fade out and destroy after 1 second
      this.tweens.add({
        targets: message,
        alpha: { from: 1, to: 0 },
        duration: 1000,
        delay: 500,
        onComplete: () => {
          message.destroy();
        }
      });
    }



  /**
   * Clean up when scene is shut down
   */
  shutdown() {
    // Stop collapse meter pulse tween if active
    if (this.collapseMeterPulseTween) {
      this.collapseMeterPulseTween.stop();
      this.collapseMeterPulseTween = null;
    }
    
    // Clean up audio manager
    if (this.audioManager) {
      this.audioManager.destroy();
      this.audioManager = null;
    }
    
    if (this.inputManager) {
      this.inputManager.destroy();
      this.inputManager = null;
    }
    
    // Remove ALL keyboard listeners including once() listeners
    if (this.input && this.input.keyboard) {
      // Remove all keys to clear once() listeners
      this.input.keyboard.removeAllKeys(true);
    }
    
    if (this.tileRenderer) {
      this.tileRenderer.destroy();
      this.tileRenderer = null;
    }
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    if (this.exitGlowSprite) {
      this.exitGlowSprite.destroy();
      this.exitGlowSprite = null;
    }
    
    // Clean up enemies
    if (this.gameState && this.gameState.enemies) {
      for (const enemy of this.gameState.enemies) {
        if (enemy.destroy) {
          enemy.destroy();
        }
      }
    }
    
    this.grid = null;
    this.turnManager = null;
    this.gameState = null;
    this.hudElements = {};
  }

    /**
     * Create glow animation for unlocked exit portal
     * @param {number} x - Grid X coordinate of exit
     * @param {number} y - Grid Y coordinate of exit
     */
    createExitGlow(x, y) {
      // Remove existing glow if any
      if (this.exitGlowSprite) {
        this.exitGlowSprite.destroy();
        this.exitGlowSprite = null;
      }

      // Get screen position from tile renderer
      const pos = this.tileRenderer.getScreenPosition(x, y);

      // Create graphics for glow effect
      const graphics = this.add.graphics();
      graphics.fillStyle(0x00ff00, 0.3); // Green glow with transparency
      graphics.fillCircle(0, 0, TILE_SIZE);

      // Generate texture from graphics
      graphics.generateTexture('exitGlow', TILE_SIZE * 2, TILE_SIZE * 2);
      graphics.destroy();

      // Create sprite from texture
      this.exitGlowSprite = this.add.sprite(pos.x, pos.y, 'exitGlow');
      this.exitGlowSprite.setDepth(-1); // Behind other sprites
      this.exitGlowSprite.setAlpha(0.5);

      // Add pulsing animation
      this.tweens.add({
        targets: this.exitGlowSprite,
        alpha: { from: 0.3, to: 0.7 },
        scale: { from: 0.8, to: 1.2 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      console.log(`GameScene: Exit glow animation created at (${x}, ${y})`);
    }

    /**
     * Show spike activation animation
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    showSpikeAnimation(x, y) {
      // Get screen position from tile renderer
      const pos = this.tileRenderer.getScreenPosition(x, y);

      // Get the tile from the tilemap layer
      if (this.tileRenderer && this.tileRenderer.layer) {
        const tile = this.tileRenderer.layer.getTileAt(x, y);
        if (tile) {
          // Quick scale animation to show spike extending
          this.tweens.add({
            targets: tile,
            scaleY: { from: 0.5, to: 1.0 },
            duration: 150,
            ease: 'Back.easeOut'
          });
        }
      }

      console.log(`GameScene: Spike animation at (${x}, ${y})`);
    }

    /**
     * Show damage effect on player
     * Creates a red flash and screen shake
     */
    showDamageEffect() {
      // Flash player sprite red
      if (this.player && this.player.sprite) {
        this.player.sprite.setTint(0xff0000);
        this.time.delayedCall(200, () => {
          if (this.player && this.player.sprite) {
            this.player.sprite.clearTint();
          }
        });
      }

      // Screen shake
      this.cameras.main.shake(200, 0.005);

      console.log('GameScene: Damage effect displayed');
    }

    /**
     * Show particle effect for item collection
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @param {string} itemType - Type of item collected (KEY, UNDO, ANCHOR, etc.)
     */
    showCollectionEffect(x, y, itemType) {
      // Get screen position from tile renderer
      const pos = this.tileRenderer.getScreenPosition(x, y);

      // Choose color based on item type
      const colorMap = {
        'KEY': 0xffff00,      // Yellow for keys
        'UNDO': 0x00ffff,     // Cyan for undo
        'ANCHOR': 0xff00ff,   // Magenta for anchor
        'PHASE_STEP': 0x00ff00, // Green for phase step
        'SHIELD': 0x0088ff    // Blue for shield
      };
      const color = colorMap[itemType] || 0xffffff;

      // Create particle emitter
      const particles = this.add.particles(pos.x, pos.y, 'environment_tileset', {
        frame: 0,
        lifespan: 600,
        speed: { min: 50, max: 100 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 1, end: 0 },
        angle: { min: 0, max: 360 },
        quantity: 8,
        tint: color,
        blendMode: 'ADD'
      });

      // Stop emitting after one burst
      particles.explode();

      // Clean up after animation
      this.time.delayedCall(700, () => {
        particles.destroy();
      });

      console.log(`GameScene: Collection effect for ${itemType} at (${x}, ${y})`);
    }

    /**
     * Show door unlock animation
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     */
    showDoorUnlockAnimation(x, y) {
      // Get screen position from tile renderer
      const pos = this.tileRenderer.getScreenPosition(x, y);

      // Get the tile from the tilemap layer
      if (this.tileRenderer && this.tileRenderer.layer) {
        const tile = this.tileRenderer.layer.getTileAt(x, y);
        if (tile) {
          // Flash animation - scale pulse
          this.tweens.add({
            targets: tile,
            scaleX: { from: 1.0, to: 1.3 },
            scaleY: { from: 1.0, to: 1.3 },
            alpha: { from: 1.0, to: 0.5 },
            duration: 200,
            yoyo: true,
            repeat: 1,
            ease: 'Sine.easeInOut'
          });
        }
      }

      // Add particle burst effect
      const particles = this.add.particles(pos.x, pos.y, 'environment_tileset', {
        frame: 0,
        lifespan: 500,
        speed: { min: 30, max: 80 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 1, end: 0 },
        angle: { min: 0, max: 360 },
        quantity: 12,
        tint: 0x00ff00, // Green for unlocked
        blendMode: 'ADD'
      });

      particles.explode();

      // Clean up after animation
      this.time.delayedCall(600, () => {
        particles.destroy();
      });

      console.log(`GameScene: Door unlock animation at (${x}, ${y})`);
    }
}
