// Color palette generation
import { CONFIG } from "./constants.js";

export class ColorPalette {
  constructor() {
    this.darkModeColors = new Array(CONFIG.COLOR_PALETTE_SIZE);
    this.lightModeColors = new Array(CONFIG.COLOR_PALETTE_SIZE);
    this.lowInfluenceDarkColors = new Array(100);
    this.lowInfluenceLightColors = new Array(100);
    this.initialize();
  }

  initialize() {
    // Pre-generate low influence colors (influence < 0.1)
    for (let i = 0; i < 100; i++) {
      const influence = i / 1000;
      this.lowInfluenceDarkColors[i] = `rgba(255,255,255,${
        0.06 + influence * 0.12
      })`;
      this.lowInfluenceLightColors[i] = `rgba(0,0,0,${
        0.08 + influence * 0.16
      })`;
    }

    // Pre-generate high influence colors (influence >= 0.1)
    for (let i = 0; i < CONFIG.COLOR_PALETTE_SIZE; i++) {
      const influence = 0.1 + (i / CONFIG.COLOR_PALETTE_SIZE) * 0.9;
      this.darkModeColors[i] = this._generateDarkColor(influence);
      this.lightModeColors[i] = this._generateLightColor(influence);
    }
  }

  _generateDarkColor(influence) {
    const t = Math.min(influence * 4, 3.99);
    const segment = Math.floor(t);
    const localT = t - segment;
    let r, g, b, alpha;

    switch (segment) {
      case 0:
        r = 60 + (100 - 60) * localT;
        g = 120 + (200 - 120) * localT;
        b = 200 + (255 - 200) * localT;
        alpha = 0.6 + influence * 0.3;
        break;
      case 1:
        r = 100 + (150 - 100) * localT;
        g = 200 + (255 - 200) * localT;
        b = 255;
        alpha = 0.7 + influence * 0.2;
        break;
      case 2:
        r = 150 + (180 - 150) * localT;
        g = 255;
        b = 255 + (220 - 255) * localT;
        alpha = 0.8 + influence * 0.15;
        break;
      default:
        r = 180 + (255 - 180) * localT;
        g = 255 + (180 - 255) * localT;
        b = 220 + (50 - 220) * localT;
        alpha = 0.85 + influence * 0.15;
    }
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
  }

  _generateLightColor(influence) {
    const t = Math.min(influence * 4, 3.99);
    const segment = Math.floor(t);
    const localT = t - segment;
    let r, g, b, alpha;

    switch (segment) {
      case 0:
        r = 20 * (1 - localT);
        g = 50 + (150 - 50) * localT;
        b = 120 + (255 - 120) * localT;
        alpha = 0.5 + influence * 0.3;
        break;
      case 1:
        r = 0;
        g = 150 + (255 - 150) * localT;
        b = 255;
        alpha = 0.6 + influence * 0.2;
        break;
      case 2:
        r = 100 * localT;
        g = 255;
        b = 255 + (200 - 255) * localT;
        alpha = 0.7 + influence * 0.2;
        break;
      default:
        r = 100 + (255 - 100) * localT;
        g = 255 + (140 - 255) * localT;
        b = 200 * (1 - localT);
        alpha = 0.8 + influence * 0.2;
    }
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
  }

  getColor(influence, isDarkMode) {
    if (influence < 0.01) {
      return isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
    } else if (influence < 0.1) {
      const index = Math.min(99, Math.floor(influence * 1000));
      return isDarkMode
        ? this.lowInfluenceDarkColors[index]
        : this.lowInfluenceLightColors[index];
    } else {
      const index = Math.min(
        CONFIG.COLOR_PALETTE_SIZE - 1,
        Math.floor(((influence - 0.1) / 0.9) * CONFIG.COLOR_PALETTE_SIZE)
      );
      return isDarkMode
        ? this.darkModeColors[index]
        : this.lightModeColors[index];
    }
  }

  getColorKey(influence) {
    if (influence < 0.01) {
      return "static";
    } else if (influence < 0.1) {
      return `low_${Math.min(99, Math.floor(influence * 1000))}`;
    } else {
      return `high_${Math.min(
        CONFIG.COLOR_PALETTE_SIZE - 1,
        Math.floor(((influence - 0.1) / 0.9) * CONFIG.COLOR_PALETTE_SIZE)
      )}`;
    }
  }
}
