import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TILE_SIZE } from '../constants.js';

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

describe('Player', () => {
  let mockScene;
  let player;
  let Player;

  beforeEach(async () => {
    // Dynamically import Player after mocking Phaser
    const module = await import('./Player.js');
    Player = module.default;

    // Mock Phaser scene
    mockScene = {
      add: {
        sprite: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          play: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          once: vi.fn(),
          destroy: vi.fn(),
          anims: {
            isPlaying: false,
            currentAnim: { key: 'player_idle_down' }
          }
        })
      }
    };

    player = new Player(mockScene, 2, 2);
  });

  describe('initialization', () => {
    it('should create player at specified grid position', () => {
      expect(player.gridX).toBe(2);
      expect(player.gridY).toBe(2);
    });

    it('should initialize with 3 HP', () => {
      expect(player.hp).toBe(3);
      expect(player.maxHp).toBe(3);
    });

    it('should initialize with no keys collected', () => {
      expect(player.keysCollected).toBe(0);
    });

    it('should initialize facing down', () => {
      expect(player.facing).toBe('down');
    });

    it('should create sprite at correct pixel position', () => {
      const expectedX = 2 * TILE_SIZE + TILE_SIZE / 2;
      const expectedY = 2 * TILE_SIZE + TILE_SIZE / 2;
      
      expect(mockScene.add.sprite).toHaveBeenCalledWith(
        expectedX,
        expectedY,
        'player',
        0
      );
    });
  });

  describe('getGridPosition', () => {
    it('should return current grid position', () => {
      const pos = player.getGridPosition();
      expect(pos).toEqual({ x: 2, y: 2 });
    });
  });

  describe('moveTo', () => {
    it('should update grid position', () => {
      player.moveTo(3, 4);
      expect(player.gridX).toBe(3);
      expect(player.gridY).toBe(4);
    });

    it('should update sprite pixel position', () => {
      player.moveTo(3, 4);
      const expectedX = 3 * TILE_SIZE + TILE_SIZE / 2;
      const expectedY = 4 * TILE_SIZE + TILE_SIZE / 2;
      
      expect(player.sprite.setPosition).toHaveBeenCalledWith(expectedX, expectedY);
    });

    it('should play walk animation by default', () => {
      player.setFacing('right');
      player.moveTo(3, 2);
      expect(player.sprite.play).toHaveBeenCalledWith('player_walk_right');
    });

    it('should not play animation when animate is false', () => {
      const playCallCount = player.sprite.play.mock.calls.length;
      player.moveTo(3, 2, false);
      // Should not have additional play calls
      expect(player.sprite.play.mock.calls.length).toBe(playCallCount);
    });
  });

  describe('setFacing', () => {
    it('should update facing direction', () => {
      player.setFacing('up');
      expect(player.facing).toBe('up');
    });

    it('should play idle animation in new direction', () => {
      player.setFacing('left');
      expect(player.sprite.play).toHaveBeenCalledWith('player_idle_left');
    });
  });

  describe('destroy', () => {
    it('should destroy sprite', () => {
      const destroySpy = vi.spyOn(player.sprite, 'destroy');
      player.destroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(player.sprite).toBeNull();
    });
  });

  describe('takeDamage', () => {
    it('should reduce HP by damage amount', () => {
      const result = player.takeDamage(1);
      expect(player.hp).toBe(2);
      expect(result).toBe(true);
    });

    it('should not reduce HP below 0', () => {
      player.takeDamage(5);
      expect(player.hp).toBe(0);
    });

    it('should return false when player dies', () => {
      const result = player.takeDamage(3);
      expect(result).toBe(false);
      expect(player.hp).toBe(0);
    });

    it('should block damage when shield is active', () => {
      player.activeShield = true;
      const result = player.takeDamage(1);
      expect(player.hp).toBe(3);
      expect(player.activeShield).toBe(false);
      expect(result).toBe(true);
    });

    it('should handle multiple damage instances', () => {
      player.takeDamage(1);
      player.takeDamage(1);
      expect(player.hp).toBe(1);
    });
  });

  describe('heal', () => {
    it('should restore HP', () => {
      player.hp = 1;
      player.heal(1);
      expect(player.hp).toBe(2);
    });

    it('should not exceed maxHp', () => {
      player.heal(5);
      expect(player.hp).toBe(3);
    });
  });

  describe('isAlive', () => {
    it('should return true when player has HP', () => {
      expect(player.isAlive()).toBe(true);
    });

    it('should return false when player has no HP', () => {
      player.hp = 0;
      expect(player.isAlive()).toBe(false);
    });
  });
});
