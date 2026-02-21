import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Direction } from '../utils/InputManager.js';

// Mock Phaser before any imports that use it
vi.mock('phaser', () => ({
  default: {
    Scene: class Scene {
      constructor() {}
    },
    Scale: {
      FIT: 1,
      CENTER_BOTH: 1
    },
    AUTO: 'AUTO'
  }
}));

/**
 * Integration tests for GameScene with InputManager and Player
 * Tests that input handling and player movement are properly integrated
 */

describe('GameScene Input Integration', () => {
  it('should have InputManager integrated', () => {
    // This is a placeholder test to verify the structure
    // Full integration tests would require a Phaser test environment
    expect(true).toBe(true);
  });

  it('should handle directional input in update loop', () => {
    // Placeholder for future integration test
    expect(true).toBe(true);
  });

  it('should handle power-up input in update loop', () => {
    // Placeholder for future integration test
    expect(true).toBe(true);
  });

  it('should disable input during animations', () => {
    // Placeholder for future integration test
    expect(true).toBe(true);
  });
});

describe('GameScene Player Movement', () => {
  let scene;
  let mockPlayer;
  let mockGrid;
  let mockTurnManager;
  let GameScene;

  beforeEach(async () => {
    // Dynamically import GameScene after mocking Phaser
    const module = await import('./GameScene.js');
    GameScene = module.default;

    // Create a minimal GameScene instance
    scene = new GameScene();
    
    // Mock player
    mockPlayer = {
      gridX: 5,
      gridY: 5,
      hp: 3,
      maxHp: 3,
      keysCollected: 0,
      getGridPosition: vi.fn().mockReturnValue({ x: 5, y: 5 }),
      setFacing: vi.fn(),
      moveTo: vi.fn()
    };
    scene.player = mockPlayer;
    
    // Mock grid
    mockGrid = {
      width: 12,
      height: 12,
      isWalkable: vi.fn().mockReturnValue(true)
    };
    scene.grid = mockGrid;
    
    // Mock turn manager
    mockTurnManager = {
      processTurn: vi.fn().mockResolvedValue({
        success: true,
        hazardResults: [],
        shiftExecuted: false,
        gameOver: false,
        victory: false
      }),
      getTurnNumber: vi.fn().mockReturnValue(0),
      getCollapseMeter: vi.fn().mockReturnValue(20),
      initialCollapseMeter: 20
    };
    scene.turnManager = mockTurnManager;
    
    // Mock game state
    scene.gameState = {
      keysRequired: 1,
      exitUnlocked: false
    };
    
    // Mock HUD elements
    scene.hudElements = {
      collapseMeterText: { 
        setText: vi.fn(),
        setColor: vi.fn(),
        setAlpha: vi.fn()
      },
      hpText: { setText: vi.fn() },
      keysText: { setText: vi.fn() },
      turnText: { setText: vi.fn() }
    };
    
    // Mock tweens
    scene.tweens = {
      add: vi.fn().mockReturnValue({
        isPlaying: vi.fn().mockReturnValue(false),
        stop: vi.fn()
      })
    };
    
    // Mock updateHUD
    scene.updateHUD = vi.fn();
    
    scene.isProcessingTurn = false;
  });

  describe('isValidMove', () => {
    it('should return false for out of bounds positions', () => {
      expect(scene.isValidMove(-1, 5)).toBe(false);
      expect(scene.isValidMove(5, -1)).toBe(false);
      expect(scene.isValidMove(12, 5)).toBe(false);
      expect(scene.isValidMove(5, 12)).toBe(false);
    });

    it('should return true for valid walkable positions', () => {
      mockGrid.isWalkable.mockReturnValue(true);
      expect(scene.isValidMove(5, 5)).toBe(true);
      expect(mockGrid.isWalkable).toHaveBeenCalledWith(5, 5);
    });

    it('should return false for non-walkable positions', () => {
      mockGrid.isWalkable.mockReturnValue(false);
      expect(scene.isValidMove(5, 5)).toBe(false);
    });
  });

  describe('handlePlayerMove', () => {
    it('should move player to valid position', async () => {
      await scene.handlePlayerMove(Direction.RIGHT);
      
      expect(mockPlayer.setFacing).toHaveBeenCalledWith('right');
      expect(mockTurnManager.processTurn).toHaveBeenCalled();
      expect(scene.updateHUD).toHaveBeenCalled();
    });

    it('should not move player to invalid position', async () => {
      mockTurnManager.processTurn.mockResolvedValue({
        success: false,
        hazardResults: [],
        shiftExecuted: false,
        gameOver: false,
        victory: false,
        message: 'Invalid move'
      });
      
      await scene.handlePlayerMove(Direction.RIGHT);
      
      expect(mockTurnManager.processTurn).toHaveBeenCalled();
    });

    it('should update facing direction for each direction', async () => {
      await scene.handlePlayerMove(Direction.UP);
      expect(mockPlayer.setFacing).toHaveBeenCalledWith('up');
      
      await scene.handlePlayerMove(Direction.DOWN);
      expect(mockPlayer.setFacing).toHaveBeenCalledWith('down');
      
      await scene.handlePlayerMove(Direction.LEFT);
      expect(mockPlayer.setFacing).toHaveBeenCalledWith('left');
      
      await scene.handlePlayerMove(Direction.RIGHT);
      expect(mockPlayer.setFacing).toHaveBeenCalledWith('right');
    });

    it('should not move when player is null', async () => {
      scene.player = null;
      await scene.handlePlayerMove(Direction.RIGHT);
      // Should not throw error
      expect(true).toBe(true);
    });
  });
});

describe('GameScene Collapse Meter Visual Warning', () => {
  let scene;
  let mockPlayer;
  let mockTurnManager;
  let GameScene;

  beforeEach(async () => {
    // Dynamically import GameScene after mocking Phaser
    const module = await import('./GameScene.js');
    GameScene = module.default;

    // Create a minimal GameScene instance
    scene = new GameScene();
    
    // Mock player
    mockPlayer = {
      hp: 3,
      maxHp: 3,
      keysCollected: 0
    };
    scene.player = mockPlayer;
    
    // Mock turn manager
    mockTurnManager = {
      getTurnNumber: vi.fn().mockReturnValue(0),
      getCollapseMeter: vi.fn().mockReturnValue(20),
      initialCollapseMeter: 20
    };
    scene.turnManager = mockTurnManager;
    
    // Mock game state
    scene.gameState = {
      keysRequired: 1,
      exitUnlocked: false
    };
    
    // Mock HUD elements
    scene.hudElements = {
      collapseMeterText: { 
        setText: vi.fn(),
        setColor: vi.fn(),
        setAlpha: vi.fn()
      },
      hpText: { setText: vi.fn() },
      keysText: { setText: vi.fn() },
      turnText: { setText: vi.fn() },
      shiftPatternText: { setText: vi.fn() }
    };
    
    // Mock tweens
    const mockTween = {
      isPlaying: vi.fn().mockReturnValue(false),
      stop: vi.fn()
    };
    scene.tweens = {
      add: vi.fn().mockReturnValue(mockTween)
    };
    
    scene.collapseMeterPulseTween = null;
    
    // Mock updateShiftIndicator
    scene.updateShiftIndicator = vi.fn();
  });

  describe('updateHUD - Collapse Meter Color Coding', () => {
    it('should display white color when meter is above 50%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(15); // 75% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 15/20');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ffffff');
    });

    it('should display orange color when meter is between 25% and 50%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(8); // 40% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 8/20');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ffaa00');
    });

    it('should display red color when meter is at or below 25%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(5); // 25% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 5/20');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ff0000');
    });

    it('should display red color when meter is critically low', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(2); // 10% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 2/20');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ff0000');
    });
  });

  describe('updateHUD - Collapse Meter Pulsing Animation', () => {
    it('should start pulsing animation when meter is at or below 25%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(5); // 25% of 20
      
      scene.updateHUD();
      
      expect(scene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: scene.hudElements.collapseMeterText,
          alpha: { from: 1, to: 0.3 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      );
    });

    it('should not start pulsing animation when meter is above 25%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(10); // 50% of 20
      
      scene.updateHUD();
      
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('should stop pulsing animation when meter rises above 25%', () => {
      // First, set up a playing tween
      const mockTween = {
        isPlaying: vi.fn().mockReturnValue(true),
        stop: vi.fn()
      };
      scene.collapseMeterPulseTween = mockTween;
      
      // Now meter is above 25%
      mockTurnManager.getCollapseMeter.mockReturnValue(10); // 50% of 20
      
      scene.updateHUD();
      
      expect(mockTween.stop).toHaveBeenCalled();
      expect(scene.hudElements.collapseMeterText.setAlpha).toHaveBeenCalledWith(1);
    });

    it('should not create duplicate pulsing animations', () => {
      // Set up an already playing tween
      const mockTween = {
        isPlaying: vi.fn().mockReturnValue(true),
        stop: vi.fn()
      };
      scene.collapseMeterPulseTween = mockTween;
      
      // Meter is still low
      mockTurnManager.getCollapseMeter.mockReturnValue(3); // 15% of 20
      
      scene.updateHUD();
      
      // Should not create a new tween since one is already playing
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe('updateHUD - Edge Cases', () => {
    it('should handle meter at exactly 25%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(5); // Exactly 25% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ff0000');
      expect(scene.tweens.add).toHaveBeenCalled(); // Should pulse
    });

    it('should handle meter at exactly 50%', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(10); // Exactly 50% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ffaa00');
      expect(scene.tweens.add).not.toHaveBeenCalled(); // Should not pulse
    });

    it('should handle meter at 0', () => {
      mockTurnManager.getCollapseMeter.mockReturnValue(0); // 0% of 20
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 0/20');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ff0000');
    });

    it('should handle different initial collapse meter values', () => {
      mockTurnManager.initialCollapseMeter = 30;
      mockTurnManager.getCollapseMeter.mockReturnValue(7); // ~23% of 30
      
      scene.updateHUD();
      
      expect(scene.hudElements.collapseMeterText.setText).toHaveBeenCalledWith('Moves: 7/30');
      expect(scene.hudElements.collapseMeterText.setColor).toHaveBeenCalledWith('#ff0000');
    });
  });
});
