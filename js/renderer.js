// Rendering engine
import { fastExp, isDarkMode } from "./utils.js";
import { CONFIG } from "./constants.js";

export class Renderer {
  constructor(gridManager, wavePool, colorPalette, performanceMonitor) {
    this.gridManager = gridManager;
    this.wavePool = wavePool;
    this.colorPalette = colorPalette;
    this.performanceMonitor = performanceMonitor;
    this.ctx = gridManager.ctx;
    this.animationId = null;
  }

  start() {
    this.animationId = requestAnimationFrame(() => this._draw());
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  _draw() {
    const frameStart = this.performanceMonitor.startFrame();

    this.gridManager.clearCanvas();
    const tNow = performance.now();
    const points = this.gridManager.getPoints();
    const activeWaves = this.wavePool.getActiveWaves();

    // Check if we have active waves
    if (activeWaves.length === 0) {
      this._drawStaticDots(points);
    } else {
      this._drawAnimatedDots(points, activeWaves, tNow);
    }

    // Cleanup old waves
    this.wavePool.cleanup(tNow);

    this.performanceMonitor.endFrame(frameStart);
    this.animationId = requestAnimationFrame(() => this._draw());
  }

  _drawStaticDots(points) {
    const darkMode = isDarkMode();
    const staticColor = darkMode
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.08)";
    const radius = this.gridManager.getDotRadius();

    // Batch all static dots into a single path
    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      this.ctx.moveTo(p.ox + radius, p.oy);
      this.ctx.arc(p.ox, p.oy, radius, 0, Math.PI * 2);
    }
    this.ctx.fillStyle = staticColor;
    this.ctx.fill();
  }

  _drawAnimatedDots(points, activeWaves, tNow) {
    const dotData = [];
    const darkMode = isDarkMode();
    const baseRadius = this.gridManager.getDotRadius();
    const spacing = this.gridManager.getSpacing();

    // Calculate dot positions and colors
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const { dx, dy } = this._calculateWaveInfluence(
        p,
        activeWaves,
        tNow,
        spacing
      );

      // Smooth position interpolation
      if (p.prevX === undefined) {
        p.prevX = p.ox;
        p.prevY = p.oy;
      }

      const targetX = p.ox + dx;
      const targetY = p.oy + dy;
      const smoothFactor = 0.7;
      p.prevX += (targetX - p.prevX) * smoothFactor;
      p.prevY += (targetY - p.prevY) * smoothFactor;

      // Calculate influence and get color
      const influence = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.16667);
      const radius = baseRadius + influence * 2;
      const colorKey = this.colorPalette.getColorKey(influence);
      const color = this.colorPalette.getColor(influence, darkMode);

      dotData.push({
        x: p.prevX,
        y: p.prevY,
        radius,
        color,
        colorKey,
      });
    }

    // Batch rendering by color groups
    this._batchRenderDots(dotData);
  }

  _calculateWaveInfluence(point, activeWaves, tNow, spacing) {
    let dx = 0,
      dy = 0;

    for (let j = 0; j < activeWaves.length; j++) {
      const w = activeWaves[j];
      const age = (tNow - w.created) * 0.001;
      const r = age * (w.speed * 400);

      // Fast distance calculation
      const deltaX = point.ox - w.x;
      const deltaY = point.oy - w.y;
      const distSq = deltaX * deltaX + deltaY * deltaY;
      const dist = Math.sqrt(distSq);

      // Early exit for distant points
      const maxInfluenceRadius = r + w.sigma * 3;
      if (dist > maxInfluenceRadius) continue;

      this.performanceMonitor.incrementMathOps();

      // Calculate gaussian influence
      const diff = dist - r;
      const diffSq = diff * diff;
      const sigmaVar = 2 * (w.sigma * w.sigma);
      const gaussian = fastExp(diffSq / sigmaVar);

      // Apply influence
      if (dist > 0.0001 && gaussian > 0.01) {
        const invDist = 1 / dist;
        const nx = deltaX * invDist;
        const ny = deltaY * invDist;

        const ageDecay = 1 / (1 + age * 1.5);
        const ageDecaySq = ageDecay * ageDecay;
        const strength = w.power * gaussian * ageDecaySq;
        const dampingFactor = 0.85;

        dx += nx * strength * 15 * dampingFactor;
        dy += ny * strength * 8 * dampingFactor;
      }
    }

    return { dx, dy };
  }

  _batchRenderDots(dotData) {
    // Group dots by color to minimize draw calls
    const colorGroups = new Map();

    for (let i = 0; i < dotData.length; i++) {
      const dot = dotData[i];
      const key = `${dot.colorKey}_${dot.radius.toFixed(1)}`;

      if (!colorGroups.has(key)) {
        colorGroups.set(key, { color: dot.color, dots: [] });
      }
      colorGroups.get(key).dots.push(dot);
    }

    // Draw each color group in a single path
    for (const [key, group] of colorGroups) {
      this.ctx.beginPath();
      for (let i = 0; i < group.dots.length; i++) {
        const dot = group.dots[i];
        this.ctx.moveTo(dot.x + dot.radius, dot.y);
        this.ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      }
      this.ctx.fillStyle = group.color;
      this.ctx.fill();
    }
  }
}
