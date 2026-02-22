
import { AssetValidator } from '../utils/AssetValidator.js';

/**
 * MenuScene - Main menu and level selection
 * Responsibilities:
 * - Display game title and menu options
 * - Handle level selection
 * - Track and display level progression
 * - Transition to Game scene when level is selected
 */
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Validate assets loaded correctly
    const spritesheetResults = AssetValidator.validateSpritesheets(this);
    const animationResults = AssetValidator.validateAnimations(this);
    
    AssetValidator.logResults(spritesheetResults, 'Spritesheet Validation');
    AssetValidator.logResults(animationResults, 'Animation Validation');

    // Show title screen
    this.showTitleScreen();
  }

  /**
   * Display the main title screen
   */
  showTitleScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Game title with animation - scaled up for larger canvas
    const title = this.add.text(width / 2, height / 4, 'DUNGEON SHIFT', {
      font: 'bold 64px monospace',
      fill: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 8
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    title.setScale(0.8);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut'
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 4 + 70, 'A Grid-Based Puzzle Dungeon', {
      font: '20px monospace',
      fill: '#cccccc'
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 400
    });

    // Start button
    const startButton = this.add.text(width / 2, height / 2, 'START GAME', {
      font: 'bold 32px monospace',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 40, y: 20 }
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });
    startButton.setAlpha(0);

    this.tweens.add({
      targets: startButton,
      alpha: 1,
      duration: 600,
      delay: 800
    });

    // Button hover effect
    startButton.on('pointerover', () => {
      startButton.setStyle({ fill: '#ffff00', backgroundColor: '#444444' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
    });

    // Button click - start game
    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Level select button
    const levelSelectButton = this.add.text(width / 2, height / 2 + 80, 'LEVEL SELECT', {
      font: 'bold 26px monospace',
      fill: '#aaaaaa',
      backgroundColor: '#222222',
      padding: { x: 35, y: 16 }
    });
    levelSelectButton.setOrigin(0.5);
    levelSelectButton.setInteractive({ useHandCursor: true });
    levelSelectButton.setAlpha(0);

    this.tweens.add({
      targets: levelSelectButton,
      alpha: 1,
      duration: 600,
      delay: 1000
    });

    // Button hover effect
    levelSelectButton.on('pointerover', () => {
      levelSelectButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
    });

    levelSelectButton.on('pointerout', () => {
      levelSelectButton.setStyle({ fill: '#aaaaaa', backgroundColor: '#222222' });
    });

    // Button click - show level select
    levelSelectButton.on('pointerdown', () => {
      this.showLevelSelect();
    });

    // Tutorial button
    const tutorialButton = this.add.text(width / 2, height / 2 + 160, 'TUTORIAL', {
      font: 'bold 22px monospace',
      fill: '#888888',
      backgroundColor: '#1a1a1a',
      padding: { x: 30, y: 14 }
    });
    tutorialButton.setOrigin(0.5);
    tutorialButton.setInteractive({ useHandCursor: true });
    tutorialButton.setAlpha(0);

    this.tweens.add({
      targets: tutorialButton,
      alpha: 1,
      duration: 600,
      delay: 1100
    });

    // Button hover effect
    tutorialButton.on('pointerover', () => {
      tutorialButton.setStyle({ fill: '#ffaa00', backgroundColor: '#2a2a2a' });
    });

    tutorialButton.on('pointerout', () => {
      tutorialButton.setStyle({ fill: '#888888', backgroundColor: '#1a1a1a' });
    });

    // Button click - start tutorial
    tutorialButton.on('pointerdown', () => {
      console.log('MenuScene: Tutorial button clicked - starting level 0');
      this.scene.start('GameScene', { levelId: 0 });
    });

    // Instructions
    const instructions = this.add.text(width / 2, height - 100, 'Arrow Keys or WASD to Move', {
      font: '18px monospace',
      fill: '#888888'
    });
    instructions.setOrigin(0.5);
    instructions.setAlpha(0);

    this.tweens.add({
      targets: instructions,
      alpha: 1,
      duration: 600,
      delay: 1200
    });

    // Credits
    const credits = this.add.text(width / 2, height - 65, 'Collect keys, avoid traps, reach the exit!', {
      font: '18px monospace',
      fill: '#888888'
    });
    credits.setOrigin(0.5);
    credits.setAlpha(0);

    this.tweens.add({
      targets: credits,
      alpha: 1,
      duration: 600,
      delay: 1400
    });

    // Keyboard shortcut - press SPACE to start
    this.input.keyboard.on('keydown-SPACE', () => {
      this.startGame();
    });
  }

  /**
   * Creates a preview of loaded assets for testing
   */
  createAssetPreview() {
    const previewX = 10;
    const previewY = 10;

    // Label
    this.add.text(previewX, previewY, 'Asset Preview:', {
      font: '10px monospace',
      fill: '#666666'
    });

    // Player sprite with idle animation
    const playerSprite = this.add.sprite(previewX + 20, previewY + 30, 'player', 0);
    playerSprite.play('player_idle_down');
    playerSprite.setScale(1);

    // Patroller sprite with idle animation
    const patrollerSprite = this.add.sprite(previewX + 60, previewY + 30, 'patroller', 0);
    patrollerSprite.play('patroller_idle');
    patrollerSprite.setScale(1);

    // Environment tiles
    const tileSprite1 = this.add.sprite(previewX + 100, previewY + 30, 'environment_tileset', 0); // Floor
    const tileSprite2 = this.add.sprite(previewX + 120, previewY + 30, 'environment_tileset', 2); // Wall
    const tileSprite3 = this.add.sprite(previewX + 140, previewY + 30, 'environment_tileset', 4); // Key

    // UI icons
    const heartIcon = this.add.sprite(previewX + 20, previewY + 60, 'ui_icons_16', 0); // Heart full
    const keyIcon = this.add.sprite(previewX + 40, previewY + 60, 'ui_icons_16', 2); // Key
  }

  /**
   * Starts the game by transitioning to the Game scene
   * Starts with tutorial (level 0) for new players, or level 1 if tutorial completed
   */
  startGame() {
    // Check if player has completed tutorial
    const hasCompletedTutorial = this.hasCompletedTutorial();
    const startLevel = hasCompletedTutorial ? 1 : 0;
    
    console.log(`MenuScene: Starting game at level ${startLevel} (tutorial ${hasCompletedTutorial ? 'completed' : 'not completed'})`);
    this.scene.start('GameScene', { levelId: startLevel });
  }

  /**
   * Check if player has completed the tutorial
   * @returns {boolean} True if tutorial has been completed
   */
  hasCompletedTutorial() {
    try {
      const saved = localStorage.getItem('dungeonShiftProgress');
      if (saved) {
        const progress = JSON.parse(saved);
        // If player has unlocked level 2 or higher, they've completed tutorial and level 1
        return progress.maxLevel >= 2;
      }
    } catch (e) {
      console.error('MenuScene: Error checking tutorial completion', e);
    }
    return false;
  }

  /**
   * Show level select screen
   */
  showLevelSelect() {
    // Clear current screen
    this.children.removeAll();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title - scaled up
    const title = this.add.text(width / 2, 80, 'SELECT LEVEL', {
      font: 'bold 48px monospace',
      fill: '#ffff00',
      stroke: '#ff8800',
      strokeThickness: 6
    });
    title.setOrigin(0.5);

    // Get level progress from localStorage
    const maxLevel = this.getMaxUnlockedLevel();

    // Create level buttons in a grid (2 columns, 5 rows for 10 levels) - adjusted for better fit
    const cols = 2;
    const rows = 5;
    const buttonWidth = 160;
    const buttonHeight = 70;
    const spacing = 25;
    const startX = width / 2 - (cols * buttonWidth + (cols - 1) * spacing) / 2;
    const startY = 150;

    for (let i = 1; i <= 10; i++) {
      const col = (i - 1) % cols;
      const row = Math.floor((i - 1) / cols);
      const x = startX + col * (buttonWidth + spacing) + buttonWidth / 2;
      const y = startY + row * (buttonHeight + spacing) + buttonHeight / 2;

      const isUnlocked = i <= maxLevel;
      const buttonColor = isUnlocked ? '#333333' : '#111111';
      const textColor = isUnlocked ? '#ffffff' : '#555555';

      const levelButton = this.add.text(x, y, `LEVEL ${i}`, {
        font: 'bold 24px monospace',
        fill: textColor,
        backgroundColor: buttonColor,
        padding: { x: 30, y: 20 }
      });
      levelButton.setOrigin(0.5);

      if (isUnlocked) {
        levelButton.setInteractive({ useHandCursor: true });

        levelButton.on('pointerover', () => {
          levelButton.setStyle({ fill: '#ffff00', backgroundColor: '#444444' });
        });

        levelButton.on('pointerout', () => {
          levelButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
        });

        levelButton.on('pointerdown', () => {
          this.scene.start('GameScene', { levelId: i });
        });
      }
    }

    // Back button - positioned at bottom with more margin
    const backButton = this.add.text(width / 2, height - 60, 'BACK TO MENU', {
      font: 'bold 24px monospace',
      fill: '#aaaaaa',
      backgroundColor: '#222222',
      padding: { x: 30, y: 15 }
    });
    backButton.setOrigin(0.5);
    backButton.setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => {
      backButton.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({ fill: '#aaaaaa', backgroundColor: '#222222' });
    });

    backButton.on('pointerdown', () => {
      this.scene.restart();
    });

    // ESC key to go back
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.restart();
    });
  }

  /**
   * Get the maximum unlocked level from localStorage
   * @returns {number} Maximum unlocked level (1-10)
   */
  getMaxUnlockedLevel() {
    // DEV MODE: Unlock all levels for testing
    const DEV_MODE = true;
    if (DEV_MODE) {
      return 10; // All levels unlocked
    }
    
    try {
      const saved = localStorage.getItem('dungeonShiftProgress');
      if (saved) {
        const progress = JSON.parse(saved);
        return progress.maxLevel || 1;
      }
    } catch (e) {
      console.error('MenuScene: Error loading progress', e);
    }
    return 1; // Default to level 1 unlocked
  }
}
