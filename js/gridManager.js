// Grid and canvas management
import { CONFIG } from "./constants.js";
import { isSafari } from "./utils.js";

export class GridManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.DPR = 1;
    this.spacing = CONFIG.BASE_SPACING;
    this.dotRadius = CONFIG.DOT_RADIUS;
    this.cols = 0;
    this.rows = 0;
    this.points = [];
  }

  resize() {
    // Set device pixel ratio
    this.DPR = isSafari
      ? 1
      : Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);

    // Update canvas dimensions
    this.width = Math.floor(window.innerWidth);
    this.height = Math.floor(window.innerHeight);
    this.canvas.width = Math.floor(this.width * this.DPR);
    this.canvas.height = Math.floor(this.height * this.DPR);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    // Adapt spacing to screen size
    const targetSpacing = Math.max(
      CONFIG.MIN_SPACING,
      Math.min(
        CONFIG.MAX_SPACING,
        Math.round(
          Math.max(CONFIG.MIN_SPACING, this.spacing * (this.width / 1280))
        )
      )
    );
    this.spacing = targetSpacing;

    // Calculate grid dimensions
    this.cols = Math.ceil(this.width / this.spacing) + 1;
    this.rows = Math.ceil(this.height / this.spacing) + 1;

    // Regenerate grid points
    this._generatePoints();
  }

  _generatePoints() {
    this.points = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x =
          c * this.spacing - (this.cols * this.spacing - this.width) / 2;
        const y =
          r * this.spacing - (this.rows * this.spacing - this.height) / 2;
        this.points.push({ x, y, ox: x, oy: y });
      }
    }
  }

  getPoints() {
    return this.points;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  setSpacing(spacing) {
    this.spacing = spacing;
    this.resize();
  }

  setDotRadius(radius) {
    this.dotRadius = radius;
  }

  getDotRadius() {
    return this.dotRadius;
  }

  getSpacing() {
    return this.spacing;
  }
}
