// Minimal ripple dot-grid background
(function () {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");

  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0,
    height = 0;

  // grid settings
  let spacing = 28; // px between dots (will be scaled by DPR)
  let dotRadius = 2.2; // base dot radius

  let cols = 0,
    rows = 0;
  let points = [];

  // active waves generated on mousemove
  const waves = []; // {x,y,created,t0,power,speed,sigma}

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

  // create a wave on pointer
  function pushWave(x, y, power = 1) {
    waves.push({
      x,
      y,
      created: performance.now(),
      power: power,
      speed: 0.9 + Math.random() * 0.6,
      sigma: spacing * 0.65,
    });
    // keep waves short
    if (waves.length > 8) waves.shift();
  }

  // pointer handlers
  let lastMove = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      const now = performance.now();
      // throttle creation so it doesn't flood
      if (now - lastMove > 40) {
        pushWave(e.clientX, e.clientY, 1.0);
        lastMove = now;
      }
    },
    { passive: true }
  );

  // click / touch stronger wave
  window.addEventListener("pointerdown", (e) => {
    pushWave(e.clientX, e.clientY, 1.8);
  });

  // main draw loop
  function draw() {
    ctx.clearRect(0, 0, width, height);

    const tNow = performance.now();

    // draw dots
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      let dx = 0,
        dy = 0;

      // accumulate contribution from each wave
      for (let j = 0; j < waves.length; j++) {
        const w = waves[j];
        const age = (tNow - w.created) / 1000; // seconds
        const r = age * (w.speed * 400); // radius expansion in px (speed * scale)

        const dist = Math.hypot(p.ox - w.x, p.oy - w.y);

        // gaussian ring centered at radius r
        const diff = dist - r;
        const gaussian = Math.exp(-(diff * diff) / (2 * (w.sigma * w.sigma)));

        // direction away from center for push
        if (dist > 0.0001) {
          const nx = (p.ox - w.x) / dist;
          const ny = (p.oy - w.y) / dist;
          const strength = w.power * gaussian * (1 / (1 + age * 2));
          dx += nx * strength * 18; // scale factor
          dy += ny * strength * 10;
        }
      }

      // subtle return easing to original (when no waves)
      // (we are not mutating ox/oy; ox/oy are base positions)
      const drawX = p.ox + dx;
      const drawY = p.oy + dy;

      // size modulation by cumulative influence (optional)
      const influence = Math.min(1, Math.hypot(dx, dy) / 6);
      const radius = dotRadius + influence * 2;

      ctx.beginPath();
      ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);

      // Aurora color transition based on influence
      const darkMode = isDarkMode();

      if (influence < 0.1) {
        // Static dots - adapt to theme
        if (darkMode) {
          ctx.fillStyle = `rgba(255,255,255,${0.06 + influence * 0.12})`;
        } else {
          ctx.fillStyle = `rgba(0,0,0,${0.08 + influence * 0.16})`;
        }
      } else {
        // Animated dots - aurora gradient colors (enhanced for dark mode)
        const normalizedInfluence = influence;

        if (normalizedInfluence < 0.25) {
          // Deep blue to electric blue
          const t = normalizedInfluence / 0.25;
          if (darkMode) {
            const r = Math.round(60 + (100 - 60) * t);
            const g = Math.round(120 + (200 - 120) * t);
            const b = Math.round(200 + (255 - 200) * t);
            const alpha = 0.6 + normalizedInfluence * 0.3;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const r = Math.round(20 + (0 - 20) * t);
            const g = Math.round(50 + (150 - 50) * t);
            const b = Math.round(120 + (255 - 120) * t);
            const alpha = 0.5 + normalizedInfluence * 0.3;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          }
        } else if (normalizedInfluence < 0.5) {
          // Electric blue to cyan
          const t = (normalizedInfluence - 0.25) / 0.25;
          if (darkMode) {
            const r = Math.round(100 + (150 - 100) * t);
            const g = Math.round(200 + (255 - 200) * t);
            const b = 255;
            const alpha = 0.7 + normalizedInfluence * 0.2;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const r = Math.round(0 + (0 - 0) * t);
            const g = Math.round(150 + (255 - 150) * t);
            const b = 255;
            const alpha = 0.6 + normalizedInfluence * 0.2;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          }
        } else if (normalizedInfluence < 0.75) {
          // Cyan to green aurora
          const t = (normalizedInfluence - 0.5) / 0.25;
          if (darkMode) {
            const r = Math.round(150 + (180 - 150) * t);
            const g = 255;
            const b = Math.round(255 + (220 - 255) * t);
            const alpha = 0.8 + normalizedInfluence * 0.15;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const r = Math.round(0 + (100 - 0) * t);
            const g = 255;
            const b = Math.round(255 + (200 - 255) * t);
            const alpha = 0.7 + normalizedInfluence * 0.2;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          }
        } else {
          // Green to purple aurora (highest intensity)
          const t = (normalizedInfluence - 0.75) / 0.25;
          if (darkMode) {
            const r = Math.round(180 + (220 - 180) * t);
            const g = Math.round(255 + (150 - 255) * t);
            const b = Math.round(220 + (255 - 220) * t);
            const alpha = 0.85 + normalizedInfluence * 0.15;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const r = Math.round(100 + (200 - 100) * t);
            const g = Math.round(255 + (100 - 255) * t);
            const b = Math.round(200 + (255 - 200) * t);
            const alpha = 0.8 + normalizedInfluence * 0.2;
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          }
        }
      }

      ctx.fill();
    }

    // decay old waves
    for (let k = waves.length - 1; k >= 0; k--) {
      const w = waves[k];
      const age = (tNow - w.created) / 1000;
      if (age > 2.4) waves.splice(k, 1);
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

  // expose simple API for customization (optional)
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
  };
})();
