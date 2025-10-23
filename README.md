# Ripple Dot Grid Background

Interactive ripple effect background with animated dot grid using vanilla JavaScript and Canvas API.

## ✨ Features

- 🌊 Smooth ripple effects with physics-based wave propagation
- 🎨 Aurora-inspired color gradients for light/dark modes
- 📱 Touch and multi-touch optimized
- ⚡ High performance with object pooling and batch rendering
- 🎯 Zero dependencies - pure vanilla JavaScript

## 🚀 Quick Start

Run the sample app:

```bash
pnpx serve .
```

Visit `http://localhost:3000`

## 📁 Project Structure

```text
js/
├── main.js            # Application initialization
├── constants.js       # Configuration
├── utils.js           # Utility functions
├── performance.js     # Performance monitoring
├── colorPalette.js    # Color generation
├── wavePool.js        # Wave object pooling
├── gridManager.js     # Grid & canvas management
├── eventHandlers.js   # Pointer/touch events
└── renderer.js        # Drawing engine
```

## 🎮 JavaScript API

```javascript
// Create ripple
window._dotGridBG.pushWave(x, y, power);

// Customize
window._dotGridBG.setSpacing(24);
window._dotGridBG.setDotRadius(2.5);

// Performance stats
window._dotGridBG.getPerformance();
```

## ⚙️ Configuration

Customize behavior by editing `js/constants.js`

### CONFIG - Main Settings

```javascript
export const CONFIG = {
  // Visual Settings
  BASE_SPACING: 28,        // Dot spacing in px (↑ = fewer dots, faster)
  DOT_RADIUS: 2.2,         // Dot size (↑ = bigger dots, more visible)
  
  // Wave Behavior
  WAVE_MAX_AGE: 2.8,       // Wave lifetime in seconds (↑ = travels further, more calculations)
  WAVE_SPEED_BASE: 1.0,    // Wave speed multiplier (↑ = faster waves)
  WAVE_SIGMA_MULTIPLIER: 0.7,  // Wave influence radius (↑ = affects more dots)
  MAX_ACTIVE_WAVES: 10,    // Concurrent waves (↑ = more overlapping effects, slower)
  
  // Performance
  MAX_DPR: 2,              // Pixel density (↑ = sharper on retina, slower)
  COLOR_PALETTE_SIZE: 400, // Pre-computed colors (↑ = smoother gradients, more memory)
};
```

### THROTTLE - Event Processing Control

```javascript
export const THROTTLE = {
  BASE_MOUSE: 35,   // Mouse event throttle in ms (↑ = less responsive, faster)
  BASE_TOUCH: 25,   // Touch event throttle in ms (↓ = more responsive)
  RESIZE: 120,      // Resize debounce in ms (↑ = prevents lag during resize)
};
```

### POWER - Effect Intensity

```javascript
export const POWER = {
  TOUCH_BOOST: 2.0,      // Touch/tap intensity (↑ = more dramatic)
  CLICK_BOOST: 1.8,      // Click intensity
  MULTI_TOUCH: 2.2,      // Multi-touch intensity (strongest)
};
```

**Note:** Values with ↑ mean increasing = more effect, ↓ mean decreasing = more effect

---

Made with Joy️ by Deal-Droid
