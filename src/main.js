import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

// Initialize dev mode flag (default: false)
window.DUNGEON_SHIFT_DEV_MODE = false;

// Global dev mode toggle function
window.turn_on_dev_mode = function() {
    window.DUNGEON_SHIFT_DEV_MODE = true;
    console.log('%c🔓 DEV MODE ENABLED', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    console.log('%cAll levels unlocked! Restart the menu to see changes.', 'color: #00ff00;');
    return 'Dev mode enabled! All levels unlocked.';
};

window.turn_off_dev_mode = function() {
    window.DUNGEON_SHIFT_DEV_MODE = false;
    console.log('%c🔒 DEV MODE DISABLED', 'color: #ff0000; font-size: 16px; font-weight: bold;');
    console.log('%cLevel progression restored. Restart the menu to see changes.', 'color: #ff0000;');
    return 'Dev mode disabled! Normal progression restored.';
};

// Global error handler to prevent page crashes
window.addEventListener('error', (event) => {
    console.error('GLOBAL ERROR:', event.error);
    console.error('Message:', event.message);
    console.error('Stack:', event.error?.stack);
    // Prevent default behavior (page reload)
    event.preventDefault();
    return false;
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('UNHANDLED PROMISE REJECTION:', event.reason);
    console.error('Promise:', event.promise);
    // Prevent default behavior
    event.preventDefault();
    return false;
});

// Phaser 3 game configuration for Dungeon Shift
const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 750,
    parent: 'game-container',
    backgroundColor: '#1a1a1a',
    pixelArt: true,
    render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1000,
        height: 750
    },
    input: {
        keyboard: {
            capture: [32, 37, 38, 39, 40] // Capture space and arrow keys
        }
    },
    scene: [
        BootScene,
        MenuScene,
        GameScene
    ]
};

new Phaser.Game(config);
