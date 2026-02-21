import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GameScene - Shield Power-up Integration', () => {
  let mockScene;
  let mockPlayer;

  beforeEach(() => {
    // Create mock player
    mockPlayer = {
      inventory: [],
      activeShield: false,
      hp: 3,
      maxHp: 3
    };

    // Create mock scene with methods
    mockScene = {
      player: mockPlayer,
      showMessage: vi.fn(),
      updateHUD: vi.fn(),
      hudElements: {
        inventoryText: {
          setText: vi.fn()
        }
      }
    };
  });

  describe('activateShield logic', () => {
    // Simulate the activateShield method logic
    const activateShield = function() {
      const shieldIndex = this.player.inventory.findIndex(item => item.type === 'SHIELD');

      if (shieldIndex === -1) {
        this.showMessage('No Shield available!', '#ff0000');
        return;
      }

      if (this.player.activeShield) {
        this.showMessage('Shield already active!', '#ffaa00');
        return;
      }

      this.player.activeShield = true;
      this.player.inventory.splice(shieldIndex, 1);
      this.updateHUD();
      this.showMessage('Shield activated! 🛡️', '#00aaff');
    };

    it('should activate shield when player has shield in inventory', () => {
      // Add shield to inventory
      mockPlayer.inventory.push({ type: 'SHIELD', quantity: 1 });

      // Call activateShield
      activateShield.call(mockScene);

      // Check that shield was activated
      expect(mockPlayer.activeShield).toBe(true);

      // Check that shield was removed from inventory
      expect(mockPlayer.inventory).toHaveLength(0);

      // Check that feedback was shown
      expect(mockScene.showMessage).toHaveBeenCalledWith('Shield activated! 🛡️', '#00aaff');
      expect(mockScene.updateHUD).toHaveBeenCalled();
    });

    it('should show error message when no shield in inventory', () => {
      // No shield in inventory
      mockPlayer.inventory = [];

      // Call activateShield
      activateShield.call(mockScene);

      // Check that shield was not activated
      expect(mockPlayer.activeShield).toBe(false);

      // Check that error message was shown
      expect(mockScene.showMessage).toHaveBeenCalledWith('No Shield available!', '#ff0000');
    });

    it('should show warning when shield is already active', () => {
      // Add shield to inventory and activate it
      mockPlayer.inventory.push({ type: 'SHIELD', quantity: 1 });
      mockPlayer.activeShield = true;

      // Try to activate another shield
      activateShield.call(mockScene);

      // Check that shield is still active
      expect(mockPlayer.activeShield).toBe(true);

      // Check that inventory was not modified
      expect(mockPlayer.inventory).toHaveLength(1);

      // Check that warning message was shown
      expect(mockScene.showMessage).toHaveBeenCalledWith('Shield already active!', '#ffaa00');
    });

    it('should allow activating multiple shields sequentially', () => {
      // Add two shields to inventory
      mockPlayer.inventory.push({ type: 'SHIELD', quantity: 1 });
      mockPlayer.inventory.push({ type: 'SHIELD', quantity: 1 });

      // Activate first shield
      activateShield.call(mockScene);
      expect(mockPlayer.activeShield).toBe(true);
      expect(mockPlayer.inventory).toHaveLength(1);

      // Simulate shield being consumed by damage
      mockPlayer.activeShield = false;

      // Activate second shield
      activateShield.call(mockScene);
      expect(mockPlayer.activeShield).toBe(true);
      expect(mockPlayer.inventory).toHaveLength(0);
    });
  });

  describe('updateInventoryDisplay logic', () => {
    // Simulate the updateInventoryDisplay method logic
    const updateInventoryDisplay = function() {
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

      if (this.player.activeShield) {
        inventoryParts.push('🛡️ ACTIVE');
      }

      const inventoryText = inventoryParts.length > 0
        ? 'Inventory: ' + inventoryParts.join(' | ')
        : 'Inventory: Empty';

      this.hudElements.inventoryText.setText(inventoryText);
    };

    it('should show shield count in inventory', () => {
      // Add shields to inventory
      mockPlayer.inventory = [
        { type: 'SHIELD', quantity: 1 },
        { type: 'SHIELD', quantity: 1 }
      ];

      // Call updateInventoryDisplay
      updateInventoryDisplay.call(mockScene);

      // Check that inventory text was updated
      expect(mockScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        'Inventory: [4] Shield: 2'
      );
    });

    it('should show active shield indicator when shield is active', () => {
      // Activate shield
      mockPlayer.activeShield = true;
      mockPlayer.inventory = [];

      // Call updateInventoryDisplay
      updateInventoryDisplay.call(mockScene);

      // Check that active shield indicator is shown
      expect(mockScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        'Inventory: 🛡️ ACTIVE'
      );
    });

    it('should show both shield count and active indicator', () => {
      // Add shield to inventory and activate one
      mockPlayer.inventory = [{ type: 'SHIELD', quantity: 1 }];
      mockPlayer.activeShield = true;

      // Call updateInventoryDisplay
      updateInventoryDisplay.call(mockScene);

      // Check that both are shown
      expect(mockScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        'Inventory: [4] Shield: 1 | 🛡️ ACTIVE'
      );
    });

    it('should show empty inventory when no shields', () => {
      // No shields
      mockPlayer.inventory = [];
      mockPlayer.activeShield = false;

      // Call updateInventoryDisplay
      updateInventoryDisplay.call(mockScene);

      // Check that empty message is shown
      expect(mockScene.hudElements.inventoryText.setText).toHaveBeenCalledWith(
        'Inventory: Empty'
      );
    });
  });
});
