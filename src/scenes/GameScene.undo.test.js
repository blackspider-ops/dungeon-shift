import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnManager } from '../core/TurnManager.js';
import { Grid, TileType } from '../core/Grid.js';

describe('Undo Mechanic - Integration', () => {
  let gameScene;

  beforeEach(() => {
    // Create mock game scene with undo methods
    gameScene = {
      player: null,
      grid: null,
      gameState: null,
      turnManager: null,
      tileRenderer: null,
      hudElements: {},
      
      // Mock methods
      showMessage: vi.fn(),
      updateHUD: vi.fn(),
      refreshEnemySprites: vi.fn(),
      
      // Undo activation method (simplified from GameScene)
      activateUndo: function() {
        const undoIndex = this.player.inventory.findIndex(item => item.type === 'UNDO');
        
        if (undoIndex === -1) {
          this.showMessage('No Undo available!', '#ff0000');
          return;
        }

        if (!this.turnManager.savedState) {
          this.showMessage('Nothing to undo!', '#ff0000');
          return;
        }

        const restored = this.turnManager.restoreState(this.player, this.grid, this.gameState);

        if (restored) {
          this.player.inventory.splice(undoIndex, 1);
          
          if (this.tileRenderer) {
            this.tileRenderer.refreshGrid();
          }

          this.refreshEnemySprites();
          this.updateHUD();
          this.showMessage('Undo activated!', '#00ff00');
        } else {
          this.showMessage('Undo failed!', '#ff0000');
        }
      },
      
      // Inventory display method (simplified from GameScene)
      updateInventoryDisplay: function() {
        if (!this.player || !this.hudElements.inventoryText) return;

        const inventory = this.player.inventory || [];
        
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

        const inventoryText = inventoryParts.length > 0 
          ? 'Inventory: ' + inventoryParts.join(' | ')
          : 'Inventory: Empty';

        this.hudElements.inventoryText.setText(inventoryText);
      }
    };
  });

  describe('Undo Activation', () => {
    it('should show message when no undo available', () => {
      // Setup
      gameScene.player = {
        inventory: [] // No undo
      };
      gameScene.showMessage = vi.fn();

      // Execute
      gameScene.activateUndo();

      // Verify
      expect(gameScene.showMessage).toHaveBeenCalledWith('No Undo available!', '#ff0000');
    });

    it('should show message when no saved state exists', () => {
      // Setup
      gameScene.player = {
        inventory: [{ type: 'UNDO', quantity: 1 }]
      };
      gameScene.turnManager = new TurnManager(10);
      gameScene.turnManager.savedState = null;
      gameScene.showMessage = vi.fn();

      // Execute
      gameScene.activateUndo();

      // Verify
      expect(gameScene.showMessage).toHaveBeenCalledWith('Nothing to undo!', '#ff0000');
    });

    it('should consume undo from inventory when activated', () => {
      // Setup
      const grid = new Grid(5, 5);
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          grid.setTile(x, y, { type: TileType.FLOOR, x, y });
        }
      }

      const player = {
        gridX: 2,
        gridY: 2,
        hp: 3,
        maxHp: 3,
        keysCollected: 0,
        inventory: [{ type: 'UNDO', quantity: 1 }],
        activeShield: false,
        facing: 'down',
        sprite: null,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        },
        takeDamage: function(amount) {
          this.hp = Math.max(0, this.hp - amount);
          return this.hp > 0;
        },
        getGridPosition: function() {
          return { x: this.gridX, y: this.gridY };
        }
      };

      const gameState = {
        keysRequired: 1,
        exitUnlocked: false,
        enemies: [],
        items: [],
        shiftSystem: null
      };

      const turnManager = new TurnManager(10);

      // Save state
      turnManager.saveState(player, grid, gameState);

      // Setup game scene
      gameScene.player = player;
      gameScene.grid = grid;
      gameScene.gameState = gameState;
      gameScene.turnManager = turnManager;
      gameScene.tileRenderer = { refreshGrid: vi.fn() };
      gameScene.showMessage = vi.fn();
      gameScene.updateHUD = vi.fn();

      // Verify undo is in inventory
      expect(player.inventory).toHaveLength(1);
      expect(player.inventory[0].type).toBe('UNDO');

      // Execute
      gameScene.activateUndo();

      // Verify undo was consumed
      expect(player.inventory).toHaveLength(0);
      expect(gameScene.showMessage).toHaveBeenCalledWith('Undo activated!', '#00ff00');
    });

    it('should restore game state when undo is activated', () => {
      // Setup
      const grid = new Grid(5, 5);
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          grid.setTile(x, y, { type: TileType.FLOOR, x, y });
        }
      }

      const player = {
        gridX: 2,
        gridY: 2,
        hp: 3,
        maxHp: 3,
        keysCollected: 0,
        inventory: [{ type: 'UNDO', quantity: 1 }],
        activeShield: false,
        facing: 'down',
        sprite: null,
        moveTo: function(x, y) {
          this.gridX = x;
          this.gridY = y;
        },
        takeDamage: function(amount) {
          this.hp = Math.max(0, this.hp - amount);
          return this.hp > 0;
        },
        getGridPosition: function() {
          return { x: this.gridX, y: this.gridY };
        }
      };

      const gameState = {
        keysRequired: 1,
        exitUnlocked: false,
        enemies: [],
        items: [],
        shiftSystem: null
      };

      const turnManager = new TurnManager(10);

      // Save initial state
      turnManager.saveState(player, grid, gameState);

      // Modify state
      player.gridX = 3;
      player.hp = 2;
      turnManager.collapseMeter = 8;

      // Setup game scene
      gameScene.player = player;
      gameScene.grid = grid;
      gameScene.gameState = gameState;
      gameScene.turnManager = turnManager;
      gameScene.tileRenderer = { refreshGrid: vi.fn() };
      gameScene.showMessage = vi.fn();
      gameScene.updateHUD = vi.fn();

      // Execute undo
      gameScene.activateUndo();

      // Verify state was restored
      expect(player.gridX).toBe(2);
      expect(player.hp).toBe(3);
      expect(turnManager.collapseMeter).toBe(10);
      expect(gameScene.tileRenderer.refreshGrid).toHaveBeenCalled();
      expect(gameScene.updateHUD).toHaveBeenCalled();
    });
  });

  describe('Inventory Display', () => {
    it('should show undo in inventory display', () => {
      gameScene.player = {
        inventory: [{ type: 'UNDO', quantity: 1 }]
      };
      gameScene.hudElements = {
        inventoryText: {
          setText: vi.fn()
        }
      };

      gameScene.updateInventoryDisplay();

      expect(gameScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        expect.stringContaining('[3] Undo: 1')
      );
    });

    it('should show multiple power-ups in inventory', () => {
      gameScene.player = {
        inventory: [
          { type: 'UNDO', quantity: 1 },
          { type: 'SHIELD', quantity: 1 },
          { type: 'ANCHOR', quantity: 1 }
        ]
      };
      gameScene.hudElements = {
        inventoryText: {
          setText: vi.fn()
        }
      };

      gameScene.updateInventoryDisplay();

      const setText = gameScene.hudElements.inventoryText.setText;
      expect(setText).toHaveBeenCalled();
      const displayText = setText.mock.calls[0][0];
      expect(displayText).toContain('[1] Anchor: 1');
      expect(displayText).toContain('[3] Undo: 1');
      expect(displayText).toContain('[4] Shield: 1');
    });

    it('should show empty inventory when no power-ups', () => {
      gameScene.player = {
        inventory: []
      };
      gameScene.hudElements = {
        inventoryText: {
          setText: vi.fn()
        }
      };

      gameScene.updateInventoryDisplay();

      expect(gameScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        'Inventory: Empty'
      );
    });
  });
});
