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
      // alpha and color tuned to subtle apple-like look
      ctx.fillStyle = `rgba(0,0,0,${0.08 + influence * 0.16})`;
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
  };
})();
