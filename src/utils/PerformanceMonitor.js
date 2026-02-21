/**
 * PerformanceMonitor - Tracks and reports game performance metrics
 * Helps identify performance bottlenecks and ensure smooth 60 FPS
 */

export class PerformanceMonitor {
  constructor() {
    this.enabled = false;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.frameTimes = [];
    this.maxFrameTimeHistory = 60; // Track last 60 frames
    
    // Performance thresholds
    this.targetFPS = 60;
    this.warningFPS = 55;
    this.criticalFPS = 45;
    
    // Metrics
    this.metrics = {
      avgFPS: 60,
      minFPS: 60,
      maxFPS: 60,
      frameTimeAvg: 16.67,
      frameTimeMax: 16.67,
      memoryUsage: 0
    };
  }

  /**
   * Enable performance monitoring
   */
  enable() {
    this.enabled = true;
    this.lastTime = performance.now();
    console.log('PerformanceMonitor: Enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable() {
    this.enabled = false;
    console.log('PerformanceMonitor: Disabled');
  }

  /**
   * Update performance metrics (call once per frame)
   */
  update() {
    if (!this.enabled) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    
    // Track frame times
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
    
    this.frameCount++;
    this.lastTime = currentTime;
    
    // Calculate FPS every second
    if (this.frameCount >= 60) {
      this.calculateMetrics();
      this.frameCount = 0;
      
      // Check for performance issues
      if (this.metrics.avgFPS < this.criticalFPS) {
        console.error(`Critical FPS: ${this.metrics.avgFPS.toFixed(1)}`);
      } else if (this.metrics.avgFPS < this.warningFPS) {
        console.warn(`Low FPS: ${this.metrics.avgFPS.toFixed(1)}`);
      }
    }
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics() {
    if (this.frameTimes.length === 0) return;
    
    // Calculate average frame time
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    this.metrics.frameTimeAvg = sum / this.frameTimes.length;
    
    // Calculate FPS from frame time
    this.metrics.avgFPS = 1000 / this.metrics.frameTimeAvg;
    
    // Find min/max FPS
    this.metrics.frameTimeMax = Math.max(...this.frameTimes);
    this.metrics.minFPS = 1000 / this.metrics.frameTimeMax;
    
    const frameTimeMin = Math.min(...this.frameTimes);
    this.metrics.maxFPS = 1000 / frameTimeMin;
    
    // Get memory usage if available
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(
        performance.memory.usedJSHeapSize / 1048576
      ); // Convert to MB
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.metrics.avgFPS;
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood() {
    return this.metrics.avgFPS >= this.warningFPS;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    return {
      fps: {
        current: this.metrics.avgFPS.toFixed(1),
        min: this.metrics.minFPS.toFixed(1),
        max: this.metrics.maxFPS.toFixed(1),
        target: this.targetFPS
      },
      frameTime: {
        avg: this.metrics.frameTimeAvg.toFixed(2) + 'ms',
        max: this.metrics.frameTimeMax.toFixed(2) + 'ms',
        target: '16.67ms'
      },
      memory: {
        used: this.metrics.memoryUsage + 'MB'
      },
      status: this.getPerformanceStatus()
    };
  }

  /**
   * Get performance status
   */
  getPerformanceStatus() {
    if (this.metrics.avgFPS >= this.targetFPS) {
      return 'Excellent';
    } else if (this.metrics.avgFPS >= this.warningFPS) {
      return 'Good';
    } else if (this.metrics.avgFPS >= this.criticalFPS) {
      return 'Warning';
    } else {
      return 'Critical';
    }
  }

  /**
   * Log performance report to console
   */
  logReport() {
    const report = this.generateReport();
    console.log('=== Performance Report ===');
    console.log(`FPS: ${report.fps.current} (min: ${report.fps.min}, max: ${report.fps.max})`);
    console.log(`Frame Time: ${report.frameTime.avg} (max: ${report.frameTime.max})`);
    console.log(`Memory: ${report.memory.used}`);
    console.log(`Status: ${report.status}`);
    console.log('========================');
  }

  /**
   * Create visual FPS counter overlay
   */
  createFPSCounter(scene) {
    const fpsText = scene.add.text(10, 80, 'FPS: 60', {
      font: '12px monospace',
      fill: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    fpsText.setScrollFactor(0);
    fpsText.setDepth(10000);
    
    // Update FPS counter every second
    scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const fps = this.metrics.avgFPS.toFixed(1);
        const maxMoves = scene.turnManager?.initialCollapseMeter || 0;
        fpsText.setText(`FPS: ${fps} ${maxMoves > 0 ? '' : ''}`);
        
        // Color code based on performance
        if (this.metrics.avgFPS >= this.targetFPS) {
          fpsText.setFill('#00ff00'); // Green
        } else if (this.metrics.avgFPS >= this.warningFPS) {
          fpsText.setFill('#ffff00'); // Yellow
        } else {
          fpsText.setFill('#ff0000'); // Red
        }
      },
      loop: true
    });
    
    return fpsText;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
