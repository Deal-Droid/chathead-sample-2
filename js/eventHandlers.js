// Event handlers for pointer and touch interactions
import { isTouchDevice } from "./utils.js";
import { THROTTLE, POWER } from "./constants.js";

export class EventHandlers {
  constructor(canvas, waveCreator) {
    this.canvas = canvas;
    this.waveCreator = waveCreator;
    this.lastMove = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.smoothMouseX = 0;
    this.smoothMouseY = 0;
    this.mouseMoving = false;
    this.moveTimeout = null;
    this.isTouching = false;

    this._setupEventListeners();
    this._setupScrollPrevention();
  }

  _setupEventListeners() {
    // Pointer move handler
    window.addEventListener("pointermove", (e) => this._handlePointerMove(e), {
      passive: true,
    });

    // Pointer down/up handlers
    window.addEventListener("pointerdown", (e) => this._handlePointerDown(e));
    window.addEventListener("pointerup", (e) => this._handlePointerUp(e));

    // Touch-specific handlers
    if (isTouchDevice) {
      this.canvas.addEventListener(
        "touchstart",
        (e) => this._handleTouchStart(e),
        { passive: false }
      );
      this.canvas.addEventListener("touchmove", (e) => e.preventDefault(), {
        passive: false,
      });
      this.canvas.addEventListener("touchend", (e) => e.preventDefault(), {
        passive: false,
      });
    }
  }

  _handlePointerMove(e) {
    const now = performance.now();

    // Calculate velocity
    const deltaX = e.clientX - this.lastMouseX;
    const deltaY = e.clientY - this.lastMouseY;
    const velocity = Math.hypot(deltaX, deltaY);

    // Update smooth position
    const lerpFactor = 0.3;
    this.smoothMouseX += (e.clientX - this.smoothMouseX) * lerpFactor;
    this.smoothMouseY += (e.clientY - this.smoothMouseY) * lerpFactor;

    // Adaptive throttling
    const baseThrottle = isTouchDevice
      ? THROTTLE.BASE_TOUCH
      : THROTTLE.BASE_MOUSE;
    const velocityThrottle = Math.max(
      THROTTLE.MIN,
      baseThrottle - velocity * 0.5
    );

    // Create waves
    if (now - this.lastMove > velocityThrottle) {
      const powerMultiplier = isTouchDevice ? POWER.TOUCH_MULTIPLIER : 1.0;
      const power = Math.min(1.3, (0.7 + velocity * 0.01) * powerMultiplier);
      this.waveCreator(this.smoothMouseX, this.smoothMouseY, power);
      this.lastMove = now;
    }

    // Track movement state
    this.mouseMoving = true;
    clearTimeout(this.moveTimeout);
    this.moveTimeout = setTimeout(() => {
      this.mouseMoving = false;
    }, 100);

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  }

  _handlePointerDown(e) {
    this.isTouching = true;
    const powerBoost =
      e.pointerType === "touch" ? POWER.TOUCH_BOOST : POWER.CLICK_BOOST;
    this.waveCreator(e.clientX, e.clientY, powerBoost);
  }

  _handlePointerUp(e) {
    this.isTouching = false;
  }

  _handleTouchStart(e) {
    e.preventDefault();
    // Handle multi-touch
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.waveCreator(touch.clientX, touch.clientY, POWER.MULTI_TOUCH);
    }
  }

  _setupScrollPrevention() {
    if (!isTouchDevice) return;

    const preventScrolling = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent all scrolling on touch devices
    document.addEventListener("touchstart", preventScrolling, {
      passive: false,
    });
    document.addEventListener("touchmove", preventScrolling, {
      passive: false,
    });
    document.addEventListener("touchend", preventScrolling, { passive: false });

    // Prevent gestures on iOS
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

    // Prevent window scroll
    window.addEventListener(
      "scroll",
      (e) => {
        window.scrollTo(0, 0);
        e.preventDefault();
      },
      { passive: false }
    );

    // Update viewport meta tag
    this._updateViewportMeta();
  }

  _updateViewportMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    const content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no";

    if (viewport) {
      viewport.setAttribute("content", content);
    } else {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      viewport.content = content;
      document.head.appendChild(viewport);
    }
  }
}
