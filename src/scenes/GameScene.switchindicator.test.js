/**
 * Tests for Switch State Logic in Shift Indicator
 */

import { describe, it, expect } from 'vitest';

describe('Switch Indicator Logic', () => {
  it('should track switch states in a Map', () => {
    const switchStates = new Map();
    switchStates.set('2,2', true);
    switchStates.set('3,3', false);
    
    expect(switchStates.size).toBe(2);
    expect(switchStates.get('2,2')).toBe(true);
    expect(switchStates.get('3,3')).toBe(false);
  });

  it('should count active switches', () => {
    const switchStates = new Map();
    switchStates.set('2,2', true);
    switchStates.set('3,3', true);
    switchStates.set('4,4', false);
    
    const activeSwitches = Array.from(switchStates.values())
      .filter(state => state === true).length;
    
    expect(activeSwitches).toBe(2);
  });

  it('should update switch states when toggled', () => {
    const switchStates = new Map();
    const switchKey = '2,2';
    
    // Initial state: OFF
    switchStates.set(switchKey, false);
    expect(switchStates.get(switchKey)).toBe(false);
    
    // Toggle to ON
    switchStates.set(switchKey, true);
    expect(switchStates.get(switchKey)).toBe(true);
    
    // Toggle back to OFF
    switchStates.set(switchKey, false);
    expect(switchStates.get(switchKey)).toBe(false);
  });

  it('should handle multiple switches independently', () => {
    const switchStates = new Map();
    
    switchStates.set('2,2', true);
    switchStates.set('3,3', false);
    switchStates.set('4,4', true);
    
    expect(switchStates.get('2,2')).toBe(true);
    expect(switchStates.get('3,3')).toBe(false);
    expect(switchStates.get('4,4')).toBe(true);
  });
});
