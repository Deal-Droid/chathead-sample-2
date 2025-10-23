// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.mathOps = 0;
    this.startTime = performance.now();
  }

  startFrame() {
    this.mathOps = 0;
    return performance.now();
  }

  endFrame(frameStart) {
    this.frameCount++;
    const frameEnd = performance.now();
    this.frameTime = frameEnd - frameStart;

    if (frameEnd - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = frameEnd;
    }
  }

  incrementMathOps() {
    this.mathOps++;
  }

  getStats(activeWaveCount, poolUtilization) {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      mathOps: this.mathOps,
      activeWaves: activeWaveCount,
      poolUtilization: (poolUtilization * 100).toFixed(1) + "%",
      runtime: ((performance.now() - this.startTime) / 1000).toFixed(1) + "s",
    };
  }
}
