// Main application initialization
import { CONFIG, POWER, THROTTLE } from "./constants.js";
import { isDarkMode } from "./utils.js";
import { PerformanceMonitor } from "./performance.js";
import { ColorPalette } from "./colorPalette.js";
import { WavePool } from "./wavePool.js";
import { GridManager } from "./gridManager.js";
import { EventHandlers } from "./eventHandlers.js";
import { Renderer } from "./renderer.js";

class DotGridBackground {
  constructor() {
    this.canvas = document.getElementById("bgCanvas");
    if (!this.canvas) {
      console.error("Canvas element not found");
      return;
    }

    // Initialize components
    this.performanceMonitor = new PerformanceMonitor();
    this.colorPalette = new ColorPalette();
    this.wavePool = new WavePool();
    this.gridManager = new GridManager(this.canvas);
    this.renderer = new Renderer(
      this.gridManager,
      this.wavePool,
      this.colorPalette,
      this.performanceMonitor
    );

    // Bind wave creator for event handlers
    this.pushWave = this.pushWave.bind(this);

    // Initialize event handlers
    this.eventHandlers = new EventHandlers(this.canvas, this.pushWave);

    // Setup and start
    this._setupResizeHandler();
    this._setupThemeChangeHandler();
    this.gridManager.resize();
    this.renderer.start();

    // Expose public API
    this._exposeAPI();
  }

  pushWave(x, y, power = 1) {
    const clampedPower = Math.max(POWER.MIN, Math.min(POWER.MAX, power));
    const speed =
      CONFIG.WAVE_SPEED_BASE + Math.random() * CONFIG.WAVE_SPEED_VARIATION;
    const sigma = this.gridManager.getSpacing() * CONFIG.WAVE_SIGMA_MULTIPLIER;

    const wave = this.wavePool.getWave(x, y, clampedPower, speed, sigma);

    // Clean up old waves if too many
    const activeWaves = this.wavePool.getActiveWaves();
    if (activeWaves.length > CONFIG.MAX_ACTIVE_WAVES) {
      const oldWave = activeWaves[0];
      this.wavePool.returnWave(oldWave);
    }
  }

  _setupResizeHandler() {
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.gridManager.resize();
        this.colorPalette.initialize();
      }, THROTTLE.RESIZE);
    });
  }

  _setupThemeChangeHandler() {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    darkModeMediaQuery.addEventListener("change", () => {
      // Force redraw on theme change
      requestAnimationFrame(() => {});
    });
  }

  _exposeAPI() {
    window._dotGridBG = {
      pushWave: this.pushWave,
      setSpacing: (spacing) => this.gridManager.setSpacing(spacing),
      setDotRadius: (radius) => this.gridManager.setDotRadius(radius),
      isDarkMode: isDarkMode,
      getPerformance: () => {
        const activeWaves = this.wavePool.getActiveWaves();
        const utilization = this.wavePool.getUtilization();
        return this.performanceMonitor.getStats(
          activeWaves.length,
          utilization
        );
      },
      toggleDebug: () => {
        window.location.hash =
          window.location.hash === "#debug" ? "" : "#debug";
      },
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new DotGridBackground());
} else {
  new DotGridBackground();
}
