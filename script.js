// Minimal ripple dot-grid background
(function () {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");

  // Performance monitoring
  const perf = {
    frameCount: 0,
    lastTime: performance.now(),
    fps: 0,
    frameTime: 0,
    mathOps: 0,
    startTime: performance.now(),
  };

  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0,
    height = 0;

  // grid settings
  let spacing = 28; // px between dots (will be scaled by DPR)
  let dotRadius = 2.2; // base dot radius

  let cols = 0,
    rows = 0;
  let points = [];

  // OPTIMIZATION: Pre-computed lookup tables
  const EXP_TABLE_SIZE = 2048;
  const EXP_TABLE_MAX = 8.0;
  const expLookup = new Float32Array(EXP_TABLE_SIZE);
  for (let i = 0; i < EXP_TABLE_SIZE; i++) {
    const x = (i / EXP_TABLE_SIZE) * EXP_TABLE_MAX;
    expLookup[i] = Math.exp(-x);
  }

  // Fast approximation of Math.exp(-x) using lookup table
  function fastExp(x) {
    if (x <= 0) return 1;
    if (x >= EXP_TABLE_MAX) return 0;
    const index = Math.floor((x / EXP_TABLE_MAX) * EXP_TABLE_SIZE);
    return expLookup[Math.min(index, EXP_TABLE_SIZE - 1)];
  }

  // OPTIMIZATION: Object pooling for waves
  const WAVE_POOL_SIZE = 20;
  const wavePool = [];
  const activeWaves = [];

  // Initialize wave pool
  for (let i = 0; i < WAVE_POOL_SIZE; i++) {
    wavePool.push({
      x: 0,
      y: 0,
      created: 0,
      power: 0,
      speed: 0,
      sigma: 0,
      inUse: false,
    });
  }

  // Get wave from pool
  function getWave(x, y, power, speed, sigma) {
    let wave = wavePool.find((w) => !w.inUse);
    if (!wave) {
      // If pool exhausted, reuse oldest active wave
      wave = activeWaves.shift();
      if (!wave) return null;
    }

    wave.x = x;
    wave.y = y;
    wave.created = performance.now();
    wave.power = power;
    wave.speed = speed;
    wave.sigma = sigma;
    wave.inUse = true;

    activeWaves.push(wave);
    return wave;
  }

  // Return wave to pool
  function returnWave(wave) {
    wave.inUse = false;
    const index = activeWaves.indexOf(wave);
    if (index > -1) {
      activeWaves.splice(index, 1);
    }
  }

  // Dark mode detection
  const isDarkMode = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // adapt spacing to screen size for density
    const targetSpacing = Math.max(
      18,
      Math.min(36, Math.round(Math.max(18, spacing * (width / 1280))))
    );
    spacing = targetSpacing;

    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;

    // regenerate points
    points = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * spacing - (cols * spacing - width) / 2;
        const y = r * spacing - (rows * spacing - height) / 2;
        points.push({ x, y, ox: x, oy: y });
      }
    }
  }

  // OPTIMIZATION: Optimized wave creation with pooling
  function pushWave(x, y, power = 1) {
    const clampedPower = Math.max(0.5, Math.min(1.5, power));
    const speed = 1.0 + Math.random() * 0.4;
    const sigma = spacing * 0.7;

    const wave = getWave(x, y, clampedPower, speed, sigma);
    if (!wave) return; // Pool exhausted, skip this wave

    // Clean up old waves efficiently
    if (activeWaves.length > 10) {
      const oldWave = activeWaves[0];
      returnWave(oldWave);
    }
  }

  // pointer handlers with smooth movement tracking
  let lastMove = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;
  let mouseMoving = false;
  let moveTimeout = null;
  let isTouching = false;

  // Detect if device supports touch
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Enhanced pointer move handler for both mouse and touch
  window.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();

      // Calculate velocity for adaptive behavior
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      const velocity = Math.hypot(deltaX, deltaY);

      // Update smooth position with interpolation
      const lerpFactor = 0.3;
      smoothMouseX += (e.clientX - smoothMouseX) * lerpFactor;
      smoothMouseY += (e.clientY - smoothMouseY) * lerpFactor;

      // Adaptive throttling (more responsive on touch devices)
      const baseThrottle = isTouchDevice ? 25 : 35;
      const velocityThrottle = Math.max(10, baseThrottle - velocity * 0.5);

      // Create waves more consistently
      if (now - lastMove > velocityThrottle) {
        const powerMultiplier = isTouchDevice ? 1.1 : 1.0;
        pushWave(
          smoothMouseX,
          smoothMouseY,
          Math.min(1.3, (0.7 + velocity * 0.01) * powerMultiplier)
        );
        lastMove = now;
      }

      // Track movement state
      mouseMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        mouseMoving = false;
      }, 100);

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    },
    { passive: true }
  );

  // Enhanced touch/click handlers
  window.addEventListener("pointerdown", (e) => {
    isTouching = true;
    const powerBoost = e.pointerType === "touch" ? 2.0 : 1.8;
    pushWave(e.clientX, e.clientY, powerBoost);
  });

  window.addEventListener("pointerup", (e) => {
    isTouching = false;
  });

  // Additional touch-specific handlers for better mobile experience
  if (isTouchDevice) {
    // Prevent scrolling when touching the canvas
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );

    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        // The pointermove handler above will handle the wave generation
      },
      { passive: false }
    );

    canvas.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
      },
      { passive: false }
    );

    // Handle multiple touches (multi-touch)
    canvas.addEventListener(
      "touchstart",
      (e) => {
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          pushWave(touch.clientX, touch.clientY, 2.2);
        }
      },
      { passive: false }
    );
  }

  // OPTIMIZATION: Highly optimized main draw loop
  function draw() {
    const frameStart = performance.now();
    ctx.clearRect(0, 0, width, height);

    const tNow = performance.now();
    perf.mathOps = 0;

    // Pre-calculate common values
    const pointsLength = points.length;
    const wavesLength = activeWaves.length;

    // OPTIMIZATION: Early exit if no waves
    if (wavesLength === 0) {
      // Draw static dots only
      for (let i = 0; i < pointsLength; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.ox, p.oy, dotRadius, 0, Math.PI * 2);

        const darkMode = isDarkMode();
        ctx.fillStyle = darkMode
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.08)";
        ctx.fill();
      }
    } else {
      // Process dots with wave interactions
      for (let i = 0; i < pointsLength; i++) {
        const p = points[i];
        let dx = 0,
          dy = 0;

        // OPTIMIZATION: Process waves with early exit and caching
        for (let j = 0; j < wavesLength; j++) {
          const w = activeWaves[j];
          const age = (tNow - w.created) * 0.001; // Convert to seconds

          // OPTIMIZATION: Early age check
          if (age > 2.8) {
            returnWave(w);
            j--; // Adjust index after removal
            continue;
          }

          const r = age * (w.speed * 400);

          // OPTIMIZATION: Fast distance calculation with early exit
          const deltaX = p.ox - w.x;
          const deltaY = p.oy - w.y;
          const distSq = deltaX * deltaX + deltaY * deltaY;
          const dist = Math.sqrt(distSq);

          // OPTIMIZATION: Early exit for distant points
          const maxInfluenceRadius = r + w.sigma * 3;
          if (dist > maxInfluenceRadius) continue;

          perf.mathOps++;

          // OPTIMIZATION: Simplified gaussian calculation using lookup
          const diff = dist - r;
          const diffSq = diff * diff;
          const sigmaVar = 2 * (w.sigma * w.sigma);
          const gaussian = fastExp(diffSq / sigmaVar);

          // Direction calculation (only if significant influence)
          if (dist > 0.0001 && gaussian > 0.01) {
            const invDist = 1 / dist;
            const nx = deltaX * invDist;
            const ny = deltaY * invDist;

            // OPTIMIZATION: Simplified strength calculation
            const ageDecay = 1 / (1 + age * 1.5);
            const ageDecaySq = ageDecay * ageDecay;
            const strength = w.power * gaussian * ageDecaySq;

            const dampingFactor = 0.85;
            dx += nx * strength * 15 * dampingFactor;
            dy += ny * strength * 8 * dampingFactor;
          }
        }

        // OPTIMIZATION: Reuse previous position smoothing
        if (p.prevX === undefined) {
          p.prevX = p.ox;
          p.prevY = p.oy;
        }

        const targetX = p.ox + dx;
        const targetY = p.oy + dy;

        const smoothFactor = 0.7;
        p.prevX += (targetX - p.prevX) * smoothFactor;
        p.prevY += (targetY - p.prevY) * smoothFactor;

        const drawX = p.prevX;
        const drawY = p.prevY;

        // OPTIMIZATION: Simplified influence calculation
        const influence = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.16667); // 1/6
        const radius = dotRadius + influence * 2;

        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);

        // OPTIMIZATION: Simplified color calculation
        const darkMode = isDarkMode();

        if (influence < 0.1) {
          ctx.fillStyle = darkMode
            ? `rgba(255,255,255,${0.06 + influence * 0.12})`
            : `rgba(0,0,0,${0.08 + influence * 0.16})`;
        } else {
          // OPTIMIZATION: Simplified aurora colors with fewer branches
          const t = Math.min(influence * 4, 3.99); // 0-3.99 range
          const segment = Math.floor(t);
          const localT = t - segment;

          let r, g, b, alpha;

          if (darkMode) {
            switch (segment) {
              case 0: // Deep blue to electric blue
                r = 60 + (100 - 60) * localT;
                g = 120 + (200 - 120) * localT;
                b = 200 + (255 - 200) * localT;
                alpha = 0.6 + influence * 0.3;
                break;
              case 1: // Electric blue to cyan
                r = 100 + (150 - 100) * localT;
                g = 200 + (255 - 200) * localT;
                b = 255;
                alpha = 0.7 + influence * 0.2;
                break;
              case 2: // Cyan to green
                r = 150 + (180 - 150) * localT;
                g = 255;
                b = 255 + (220 - 255) * localT;
                alpha = 0.8 + influence * 0.15;
                break;
              default: // Green to golden
                r = 180 + (255 - 180) * localT;
                g = 255 + (180 - 255) * localT;
                b = 220 + (50 - 220) * localT;
                alpha = 0.85 + influence * 0.15;
            }
          } else {
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
          }

          ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(
            b
          )},${alpha})`;
        }

        ctx.fill();
      }
    }

    // OPTIMIZATION: Performance tracking
    perf.frameCount++;
    const frameEnd = performance.now();
    perf.frameTime = frameEnd - frameStart;

    if (frameEnd - perf.lastTime >= 1000) {
      perf.fps = perf.frameCount;
      perf.frameCount = 0;
      perf.lastTime = frameEnd;

      // Log performance data for debugging
      if (window.location.hash === "#debug") {
        console.log(
          `FPS: ${perf.fps}, Frame Time: ${perf.frameTime.toFixed(
            2
          )}ms, Math Ops: ${perf.mathOps}, Active Waves: ${activeWaves.length}`
        );
      }
    }

    requestAnimationFrame(draw);
  }

  // initial run
  resize();
  requestAnimationFrame(draw);

  // keep responsive
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  // Listen for theme changes
  const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  darkModeMediaQuery.addEventListener("change", () => {
    // Redraw when theme changes for immediate visual update
    requestAnimationFrame(draw);
  });

  // Additional Safari iOS scroll prevention
  // Prevent document scrolling and overscroll bounce
  function preventScrolling(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  // Prevent all scrolling on the document for touch devices
  if (isTouchDevice) {
    // Prevent default touch behaviors on the entire document
    document.addEventListener("touchstart", preventScrolling, {
      passive: false,
    });
    document.addEventListener("touchmove", preventScrolling, {
      passive: false,
    });
    document.addEventListener("touchend", preventScrolling, { passive: false });

    // Additional prevention for specific iOS Safari issues
    document.addEventListener("gesturestart", preventScrolling, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventScrolling, {
      passive: false,
    });
    document.addEventListener("gestureend", preventScrolling, {
      passive: false,
    });

    // Prevent body scrolling
    document.body.addEventListener("touchstart", preventScrolling, {
      passive: false,
    });
    document.body.addEventListener("touchmove", preventScrolling, {
      passive: false,
    });
    document.body.addEventListener("touchend", preventScrolling, {
      passive: false,
    });

    // Prevent window scroll events
    window.addEventListener(
      "scroll",
      (e) => {
        window.scrollTo(0, 0);
        e.preventDefault();
      },
      { passive: false }
    );

    // Set viewport meta tag to prevent zooming and improve touch handling
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no"
      );
    } else {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      viewport.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no";
      document.head.appendChild(viewport);
    }
  }

  // expose simple API for customization + performance monitoring
  window._dotGridBG = {
    pushWave,
    setSpacing(s) {
      spacing = s;
      resize();
    },
    setDotRadius(r) {
      dotRadius = r;
    },
    isDarkMode,
    // Performance monitoring API
    getPerformance() {
      return {
        fps: perf.fps,
        frameTime: perf.frameTime,
        mathOps: perf.mathOps,
        activeWaves: activeWaves.length,
        poolUtilization:
          (
            ((WAVE_POOL_SIZE - wavePool.filter((w) => !w.inUse).length) /
              WAVE_POOL_SIZE) *
            100
          ).toFixed(1) + "%",
        runtime: ((performance.now() - perf.startTime) / 1000).toFixed(1) + "s",
      };
    },
    // Debug toggle
    toggleDebug() {
      if (window.location.hash === "#debug") {
        window.location.hash = "";
      } else {
        window.location.hash = "#debug";
      }
    },
  };
})();
