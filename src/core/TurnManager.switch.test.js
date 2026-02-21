/**
 * Tests for Switch Toggling in TurnManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TurnManager } from './TurnManager.js';
import { Grid, TileType } from './Grid.js';

describe('TurnManager - Switch Toggling', () => {
  let turnManager;
  let player;
  let grid;
  let gameState;

  beforeEach(() => {
    turnManager = new TurnManager(20);
    grid = new Grid(8, 8);
    
    // Create mock player at position (2, 2)
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
    
    gameState = {
      keysRequired: 1,
      enemies: [],
      shiftSystem: null,
      switchStates: new Map()
    };
  });

  it('should toggle switch from OFF to ON when player steps on it', () => {
    // Place a switch at player position
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2,
      state: { active: false }
    });

    turnManager.toggleSwitch(player, grid, gameState);

    const tile = grid.getTile(2, 2);
    expect(tile.state.active).toBe(true);
  });

  it('should toggle switch from ON to OFF when player steps on it again', () => {
    // Place a switch at player position (already ON)
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2,
      state: { active: true }
    });

    turnManager.toggleSwitch(player, grid, gameState);

    const tile = grid.getTile(2, 2);
    expect(tile.state.active).toBe(false);
  });

  it('should initialize switch state if undefined', () => {
    // Place a switch without state
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2
    });

    turnManager.toggleSwitch(player, grid, gameState);

    const tile = grid.getTile(2, 2);
    expect(tile.state).toBeDefined();
    expect(tile.state.active).toBe(true); // Should toggle from false (default) to true
  });

  it('should store switch state in gameState', () => {
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2,
      state: { active: false }
    });

    turnManager.toggleSwitch(player, grid, gameState);

    const switchKey = '2,2';
    expect(gameState.switchStates.has(switchKey)).toBe(true);
    expect(gameState.switchStates.get(switchKey)).toBe(true);
  });

  it('should not toggle anything if player is not on a switch', () => {
    // Place a floor tile at player position
    grid.setTile(2, 2, {
      type: TileType.FLOOR,
      x: 2,
      y: 2
    });

    turnManager.toggleSwitch(player, grid, gameState);

    const tile = grid.getTile(2, 2);
    expect(tile.state).toBeUndefined();
  });

  it('should track multiple switch states', () => {
    // Toggle first switch
    grid.setTile(2, 2, {
      type: TileType.SWITCH,
      x: 2,
      y: 2,
      state: { active: false }
    });
    turnManager.toggleSwitch(player, grid, gameState);

    // Move player and toggle second switch
    player.gridX = 3;
    player.gridY = 3;
    grid.setTile(3, 3, {
      type: TileType.SWITCH,
      x: 3,
      y: 3,
      state: { active: false }
    });
    turnManager.toggleSwitch(player, grid, gameState);

    expect(gameState.switchStates.size).toBe(2);
    expect(gameState.switchStates.get('2,2')).toBe(true);
    expect(gameState.switchStates.get('3,3')).toBe(true);
  });
});
