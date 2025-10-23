/**
 * Configuration constants for the ripple dot grid background
 * File: js/constants.js
 */

export const CONFIG = {
  // === Performance Settings ===

  /** Maximum number of wave objects in the pool (prevent memory leaks) */
  WAVE_POOL_SIZE: 20,

  /** Size of exponential function lookup table (higher = more accurate, more memory) */
  EXP_TABLE_SIZE: 2048,

  /** Maximum value in exponential lookup table */
  EXP_TABLE_MAX: 8.0,

  /** Number of pre-computed colors (higher = smoother gradients, more memory) */
  COLOR_PALETTE_SIZE: 400,

  /** Maximum device pixel ratio (higher = sharper on retina, slower performance) */
  MAX_DPR: 2,

  // === Visual Settings ===

  /** Base spacing between dots in pixels (higher = fewer dots, better performance) */
  BASE_SPACING: 28,

  /** Minimum spacing (screen size adaptive, keeps grid from being too dense) */
  MIN_SPACING: 18,

  /** Maximum spacing (screen size adaptive, keeps grid from being too sparse) */
  MAX_SPACING: 36,

  /** Base dot radius in pixels (higher = bigger dots, more visible) */
  DOT_RADIUS: 2.2,

  // === Wave Behavior ===

  /** How long waves last in seconds (higher = waves travel further, more calculations) */
  WAVE_MAX_AGE: 2.8,

  /** Base wave propagation speed multiplier (higher = faster waves) */
  WAVE_SPEED_BASE: 1.0,

  /** Random variation in wave speed (adds natural unpredictability) */
  WAVE_SPEED_VARIATION: 0.4,

  /** Wave influence radius multiplier (higher = waves affect more dots) */
  WAVE_SIGMA_MULTIPLIER: 0.7,

  /** Maximum concurrent active waves (higher = more overlapping effects, slower) */
  MAX_ACTIVE_WAVES: 10,
};

/**
 * Event throttling settings (controls how often events are processed)
 */
export const THROTTLE = {
  /** Base throttle for mouse move events in ms (higher = less frequent, better performance) */
  BASE_MOUSE: 35,

  /** Base throttle for touch move events in ms (lower than mouse for responsiveness) */
  BASE_TOUCH: 25,

  /** Minimum throttle when moving fast (ensures some waves even at high speed) */
  MIN: 10,

  /** Resize event debounce in ms (prevents too many recalculations) */
  RESIZE: 120,
};

/**
 * Wave power/intensity settings (controls strength of ripple effects)
 */
export const POWER = {
  /** Minimum wave power (prevents too weak effects) */
  MIN: 0.5,

  /** Maximum wave power (prevents too strong effects) */
  MAX: 1.5,

  /** Power boost for touch/tap events (higher = more dramatic touch response) */
  TOUCH_BOOST: 2.0,

  /** Power boost for mouse click events (slightly less dramatic than touch) */
  CLICK_BOOST: 1.8,

  /** Power for multi-touch points (strongest effect) */
  MULTI_TOUCH: 2.2,

  /** Power multiplier for touch devices during move (makes touch more responsive) */
  TOUCH_MULTIPLIER: 1.1,
};
