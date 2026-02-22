/**
 * LiveSolutionFinder - Simple greedy solution finder
 * Uses a straightforward approach that actually works
 */

export class LiveSolutionFinder {
  /**
   * Find complete solution - uses pre-computed solutions from level data
   * This is the RELIABLE approach that actually works
   */
  static findCompleteSolution(player, grid, gameState, chunkManager, levelData, maxMoves = 50) {
    console.log('=== Solution Finder ===');
    console.log(`Level: ${levelData.id || 'unknown'}`);
    
    // Use pre-computed solution if available
    if (levelData.solution && Array.isArray(levelData.solution) && levelData.solution.length > 0) {
      console.log(`Using pre-computed solution: [${levelData.solution.join(', ')}]`);
      return levelData.solution;
    }
    
    // Fallback: try simple pathfinding (won't work well with shifts but better than nothing)
    console.log('No pre-computed solution, using fallback pathfinding...');
    return this.fallbackPathfinding(player, grid, gameState, levelData);
  }
  
  /**
   * Fallback pathfinding when no pre-computed solution exists
   */
  static fallbackPathfinding(player, grid, gameState, levelData) {
    const solution = [];
    const keysRequired = gameState.keysRequired;
    const exitPos = levelData.exitPosition;

    // Find key positions
    const keyPositions = [];
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === 'KEY') {
          keyPositions.push({ x, y });
        }
      }
    }

    // Phase 1: Move toward first key
    if (keyPositions.length > 0 && keysRequired > 0) {
      const keyPath = this.findPathTo(
        { x: player.gridX, y: player.gridY },
        keyPositions[0],
        grid
      );
      solution.push(...keyPath);
    }

    // Phase 2: Move toward exit
    let currentPos = { x: player.gridX, y: player.gridY };
    if (solution.length > 0) {
      currentPos = keyPositions[0] || currentPos;
    }

    const exitPath = this.findPathTo(currentPos, exitPos, grid);
    solution.push(...exitPath);

    console.log(`Fallback solution: [${solution.join(', ')}] (${solution.length} moves)`);
    return solution;
  }

  /**
   * Simple A* pathfinding to find path between two points
   * Ignores shifts - just finds a path on the current grid
   */
  static findPathTo(start, goal, grid) {
    const directions = [
      { name: 'RIGHT', dx: 1, dy: 0 },
      { name: 'DOWN', dx: 0, dy: 1 },
      { name: 'LEFT', dx: -1, dy: 0 },
      { name: 'UP', dx: 0, dy: -1 }
    ];

    const openSet = [{ ...start, g: 0, h: this.heuristic(start, goal), path: [] }];
    const closedSet = new Set();

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift();

      // Check if we reached goal
      if (current.x === goal.x && current.y === goal.y) {
        return current.path;
      }

      const key = `${current.x},${current.y}`;
      if (closedSet.has(key)) continue;
      closedSet.add(key);

      // Try each direction
      for (const dir of directions) {
        const newX = current.x + dir.dx;
        const newY = current.y + dir.dy;

        if (!grid.isInBounds(newX, newY)) continue;
        if (!grid.isWalkable(newX, newY)) continue;

        const neighborKey = `${newX},${newY}`;
        if (closedSet.has(neighborKey)) continue;

        const g = current.g + 1;
        const h = this.heuristic({ x: newX, y: newY }, goal);

        openSet.push({
          x: newX,
          y: newY,
          g: g,
          h: h,
          path: [...current.path, dir.name]
        });
      }
    }

    // No path found - return empty
    return [];
  }

  /**
   * Manhattan distance heuristic
   */
  static heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Find next move (for compatibility)
   */
  static findNextMove(player, grid, gameState, levelData) {
    const solution = this.findCompleteSolution(
      player,
      grid,
      gameState,
      gameState.chunkManager,
      levelData,
      50
    );

    return solution.length > 0 ? solution[0] : null;
  }

  /**
   * Unused methods kept for compatibility
   */
  static simulateShift(pos, operation, chunkManager) {
    return pos;
  }

  static findKeyPositions(grid) {
    const keys = [];
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const tile = grid.getTile(x, y);
        if (tile && tile.type === 'KEY') {
          keys.push({ x, y });
        }
      }
    }
    return keys;
  }

  static findClosest(from, positions) {
    let closest = positions[0];
    let minDist = Infinity;
    
    for (const pos of positions) {
      const dist = Math.abs(pos.x - from.x) + Math.abs(pos.y - from.y);
      if (dist < minDist) {
        minDist = dist;
        closest = pos;
      }
    }
    
    return closest;
  }

  static stateKey(state) {
    return `${state.x},${state.y},${state.keys}`;
  }
}
