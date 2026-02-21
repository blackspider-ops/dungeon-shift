/**
 * Tests for Switch-Controlled Shift Patterns in TurnManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';
import { ShiftSystem, ShiftType } from './ShiftSystem.js';
import { ChunkManager } from './ChunkManager.js';

describe('TurnManager - Switch-Controlled Shift Patterns', () => {
  let turnManager;
  let player;
  let grid;
  let gameState;
  let chunkManager;
  let defaultPattern;
  let alternatePattern;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(12, 12);
    
    // Create mock player
    player = {
      gridX: 2,
      gridY: 2,
      hp: 3,
      maxHp: 3,
      keysCollected: 0,
      inventory: [],
      activeShield: false,
      moveTo: function(x, y) {
        this.gridX = x;
        this.gridY = y;
      }
    };
    
    // Create chunk manager
    chunkManager = new ChunkManager(grid);
    
    // Create default shift pattern (Room Swap)
    defaultPattern = ShiftSystem.createRoomSwapPattern();
    
    // Create alternate shift pattern (Room Rotate)
    alternatePattern = ShiftSystem.createRoomRotatePattern();
    
    // Create shift system with default pattern
    const shiftSystem = new ShiftSystem(defaultPattern, chunkManager);
    
    gameState = {
      keysRequired: 1,
      enemies: [],
      shiftSystem: shiftSystem,
      switchStates: new Map(),
      shiftPatterns: {
        default: defaultPattern,
        alternate: alternatePattern
      }
    };
  });

  it('should use default pattern when no switches are active', () => {
    turnManager.updateShiftPattern(gameState);
    
    expect(gameState.shiftSystem.pattern).toBe(defaultPattern);
    expect(gameState.shiftSystem.pattern.type).toBe(ShiftType.ROOM_SWAP);
  });

  it('should switch to alternate pattern when switches are active', () => {
    // Activate a switch
    gameState.switchStates.set('2,2', true);
    
    turnManager.updateShiftPattern(gameState);
    
    expect(gameState.shiftSystem.pattern).toBe(alternatePattern);
    expect(gameState.shiftSystem.pattern.type).toBe(ShiftType.ROOM_ROTATE);
  });

  it('should switch back to default pattern when switches are deactivated', () => {
    // Activate then deactivate a switch
    gameState.switchStates.set('2,2', true);
    turnManager.updateShiftPattern(gameState);
    expect(gameState.shiftSystem.pattern).toBe(alternatePattern);
    
    // Deactivate switch
    gameState.switchStates.set('2,2', false);
    turnManager.updateShiftPattern(gameState);
    
    expect(gameState.shiftSystem.pattern).toBe(defaultPattern);
  });

  it('should handle multiple switches', () => {
    // Activate multiple switches
    gameState.switchStates.set('2,2', true);
    gameState.switchStates.set('3,3', true);
    
    turnManager.updateShiftPattern(gameState);
    
    expect(gameState.shiftSystem.pattern).toBe(alternatePattern);
  });

  it('should initialize shiftPatterns if not present', () => {
    // Remove shiftPatterns from gameState
    delete gameState.shiftPatterns;
    
    turnManager.updateShiftPattern(gameState);
    
    expect(gameState.shiftPatterns).toBeDefined();
    expect(gameState.shiftPatterns.default).toBe(defaultPattern);
  });

  it('should not crash if shiftSystem is missing', () => {
    gameState.shiftSystem = null;
    
    expect(() => {
      turnManager.updateShiftPattern(gameState);
    }).not.toThrow();
  });

  it('should not crash if switchStates is missing', () => {
    gameState.switchStates = null;
    
    expect(() => {
      turnManager.updateShiftPattern(gameState);
    }).not.toThrow();
  });

  it('should integrate with toggleSwitch to update patterns', () => {
    // Place a switch at player position
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2,
      state: { active: false }
    });

    // Toggle switch (should trigger pattern update)
    turnManager.toggleSwitch(player, grid, gameState);

    // Pattern should have switched to alternate
    expect(gameState.shiftSystem.pattern).toBe(alternatePattern);
  });
});
