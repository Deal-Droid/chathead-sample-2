// Utility functions
import { CONFIG } from "./constants.js";

// Detect Safari browser
export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent
);

// Detect touch device
export const isTouchDevice =
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Dark mode detection
export const isDarkMode = () =>
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

// Pre-computed lookup table for exponential function
const expLookup = new Float32Array(CONFIG.EXP_TABLE_SIZE);
for (let i = 0; i < CONFIG.EXP_TABLE_SIZE; i++) {
  const x = (i / CONFIG.EXP_TABLE_SIZE) * CONFIG.EXP_TABLE_MAX;
  expLookup[i] = Math.exp(-x);
}

// Fast approximation of Math.exp(-x) using lookup table
export function fastExp(x) {
  if (x <= 0) return 1;
  if (x >= CONFIG.EXP_TABLE_MAX) return 0;
  const index = Math.floor((x / CONFIG.EXP_TABLE_MAX) * CONFIG.EXP_TABLE_SIZE);
  return expLookup[Math.min(index, CONFIG.EXP_TABLE_SIZE - 1)];
}
