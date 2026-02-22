import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

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
