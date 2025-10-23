// Wave object pooling for performance
import { CONFIG } from "./constants.js";

export class WavePool {
  constructor() {
    this.pool = [];
    this.activeWaves = [];
    this._initializePool();
  }

  _initializePool() {
    for (let i = 0; i < CONFIG.WAVE_POOL_SIZE; i++) {
      this.pool.push({
        x: 0,
        y: 0,
        created: 0,
        power: 0,
        speed: 0,
        sigma: 0,
        inUse: false,
      });
    }
  }

  getWave(x, y, power, speed, sigma) {
    let wave = this.pool.find((w) => !w.inUse);
    if (!wave) {
      // If pool exhausted, reuse oldest active wave
      wave = this.activeWaves.shift();
      if (!wave) return null;
    }

    wave.x = x;
    wave.y = y;
    wave.created = performance.now();
    wave.power = power;
    wave.speed = speed;
    wave.sigma = sigma;
    wave.inUse = true;

    this.activeWaves.push(wave);
    return wave;
  }

  returnWave(wave) {
    wave.inUse = false;
    const index = this.activeWaves.indexOf(wave);
    if (index > -1) {
      this.activeWaves.splice(index, 1);
    }
  }

  getActiveWaves() {
    return this.activeWaves;
  }

  getUtilization() {
    const inUse =
      CONFIG.WAVE_POOL_SIZE - this.pool.filter((w) => !w.inUse).length;
    return inUse / CONFIG.WAVE_POOL_SIZE;
  }

  cleanup(currentTime) {
    for (let i = this.activeWaves.length - 1; i >= 0; i--) {
      const wave = this.activeWaves[i];
      const age = (currentTime - wave.created) * 0.001;
      if (age > CONFIG.WAVE_MAX_AGE) {
        this.returnWave(wave);
      }
    }
  }
}
