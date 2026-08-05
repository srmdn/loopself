/** Keyboard + pointer state for Loopself (desktop + on-screen touch) */

const down = new Set();
/** @type {{ x: number, y: number, consumed: boolean } | null} */
let click = null;
/** edge-triggered keys this frame */
const pressedOnce = new Set();

/** @type {'intro' | 'menu' | 'play' | 'clear' | string} */
let uiMode = "menu";

/** Show virtual pad when coarse pointer / touch capable */
let touchUiWanted = false;

try {
  touchUiWanted =
    window.matchMedia("(pointer: coarse)").matches ||
    (navigator.maxTouchPoints || 0) > 0;
} catch {
  touchUiWanted = false;
}

const stick = {
  active: false,
  pointerId: /** @type {number | null} */ (null),
  baseX: 0,
  baseY: 0,
  x: 0,
  y: 0,
  nx: 0,
  ny: 0,
};

/** @type {{ kind: 'reset' | 'menu', pointerId: number } | null} */
let buttonHold = null;

const TOUCH = {
  stickR: 52,
  stickMax: 40,
  stickDead: 0.28,
  btnR: 30,
  pad: 18,
};

const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  KeyR: "reset",
  Escape: "menu",
  KeyM: "menu",
  Enter: "confirm",
  Space: "confirm",
  KeyN: "next",
  Digit1: "lv1",
  Digit2: "lv2",
  Digit3: "lv3",
  Digit4: "lv4",
  Digit5: "lv5",
  Digit6: "lv6",
  Digit7: "lv7",
  Digit8: "lv8",
  Digit9: "lv9",
  Numpad1: "lv1",
  Numpad2: "lv2",
  Numpad3: "lv3",
  Numpad4: "lv4",
  Numpad5: "lv5",
  Numpad6: "lv6",
  Numpad7: "lv7",
  Numpad8: "lv8",
  Numpad9: "lv9",
};

function codeToAction(code) {
  return KEY_MAP[code] ?? null;
}

/**
 * @param {number} w
 * @param {number} h
 */
export function touchLayout(w, h) {
  const pad = Math.max(
    TOUCH.pad,
    Math.min(30, Math.floor(Math.min(w, h) * 0.05))
  );
  const bottom = Math.max(TOUCH.btnR * 2 + pad, h - pad - 12);
  return {
    stickBaseX: pad + TOUCH.stickR + 4,
    stickBaseY: bottom - TOUCH.stickR - 4,
    resetX: w - pad - TOUCH.btnR - 4,
    resetY: bottom - TOUCH.btnR - 4,
    menuX: w - pad - TOUCH.btnR - 4,
    menuY: bottom - TOUCH.btnR * 2 - TOUCH.btnR - 20,
  };
}

export function isTouchUi() {
  return touchUiWanted;
}

/**
 * Call each frame (or on mode change) so stick only steals input during play.
 * @param {string} mode
 */
export function setInputMode(mode) {
  if (uiMode === mode) return;
  uiMode = mode;
  if (mode !== "play") {
    clearStick();
    buttonHold = null;
  }
}

function injectEdge(action) {
  pressedOnce.add(action);
  down.add(action);
}

function releaseAction(action) {
  down.delete(action);
}

function clearStick() {
  stick.active = false;
  stick.pointerId = null;
  stick.nx = 0;
  stick.ny = 0;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {PointerEvent} e
 */
function canvasPoint(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function setStickFromPoint(px, py) {
  const dx = px - stick.baseX;
  const dy = py - stick.baseY;
  const len = Math.hypot(dx, dy);
  const max = TOUCH.stickMax;
  if (len > max && len > 0) {
    stick.x = stick.baseX + (dx / len) * max;
    stick.y = stick.baseY + (dy / len) * max;
  } else {
    stick.x = px;
    stick.y = py;
  }
  const ux = (stick.x - stick.baseX) / max;
  const uy = (stick.y - stick.baseY) / max;
  const mag = Math.hypot(ux, uy);
  if (mag < TOUCH.stickDead) {
    stick.nx = 0;
    stick.ny = 0;
  } else {
    const scale = Math.min(1, mag);
    const inv = mag > 0 ? scale / mag : 0;
    stick.nx = ux * inv;
    stick.ny = uy * inv;
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function initInput(canvas) {
  window.addEventListener("keydown", (e) => {
    const action = codeToAction(e.code);
    if (!action) return;
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (!down.has(action)) pressedOnce.add(action);
    down.add(action);
  });

  window.addEventListener("keyup", (e) => {
    const action = codeToAction(e.code);
    if (!action) return;
    e.preventDefault();
    down.delete(action);
  });

  window.addEventListener("blur", () => {
    down.clear();
    pressedOnce.clear();
    clearStick();
    buttonHold = null;
  });

  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        touchUiWanted = true;
      }

      const p = canvasPoint(canvas, e);
      const w = canvas.clientWidth || canvas.width;
      const h = canvas.clientHeight || canvas.height;
      const lay = touchLayout(w, h);

      // Play-mode virtual controls
      if (uiMode === "play" && touchUiWanted) {
        if (e.cancelable) e.preventDefault();

        const rR = TOUCH.btnR;
        if (dist2(p.x, p.y, lay.resetX, lay.resetY) <= rR * rR) {
          injectEdge("reset");
          buttonHold = { kind: "reset", pointerId: e.pointerId };
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          return;
        }
        if (dist2(p.x, p.y, lay.menuX, lay.menuY) <= rR * rR) {
          injectEdge("menu");
          buttonHold = { kind: "menu", pointerId: e.pointerId };
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          return;
        }

        // Stick: left side
        if (p.x < w * 0.52 && p.y > h * 0.28) {
          stick.active = true;
          stick.pointerId = e.pointerId;
          stick.baseX = lay.stickBaseX;
          stick.baseY = lay.stickBaseY;
          setStickFromPoint(p.x, p.y);
          try {
            canvas.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          return;
        }
      }

      // Menus / intro / clear: click hit-tests (unchanged)
      if (e.cancelable && (e.pointerType === "touch" || e.pointerType === "pen")) {
        e.preventDefault();
      }
      click = {
        x: p.x,
        y: p.y,
        consumed: false,
      };
    },
    { passive: false }
  );

  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!stick.active || e.pointerId !== stick.pointerId) return;
      if (e.cancelable) e.preventDefault();
      const p = canvasPoint(canvas, e);
      setStickFromPoint(p.x, p.y);
    },
    { passive: false }
  );

  const endPointer = (/** @type {PointerEvent} */ e) => {
    if (buttonHold && buttonHold.pointerId === e.pointerId) {
      if (buttonHold.kind === "reset") releaseAction("reset");
      if (buttonHold.kind === "menu") releaseAction("menu");
      buttonHold = null;
    }
    if (stick.active && e.pointerId === stick.pointerId) {
      clearStick();
    }
  };

  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
}

/** @returns {{ up: boolean, down: boolean, left: boolean, right: boolean, reset: boolean }} */
export function getMoveInput() {
  const thr = 0.35;
  const su = stick.active && stick.ny < -thr;
  const sd = stick.active && stick.ny > thr;
  const sl = stick.active && stick.nx < -thr;
  const sr = stick.active && stick.nx > thr;
  return {
    up: down.has("up") || su,
    down: down.has("down") || sd,
    left: down.has("left") || sl,
    right: down.has("right") || sr,
    reset: down.has("reset"),
  };
}

/** True once per keydown edge. */
export function wasPressed(action) {
  if (pressedOnce.has(action)) {
    pressedOnce.delete(action);
    return true;
  }
  return false;
}

/**
 * Consume click if any. Returns {x,y} in CSS pixels or null.
 * @returns {{ x: number, y: number } | null}
 */
export function consumeClick() {
  if (!click || click.consumed) return null;
  click.consumed = true;
  const out = { x: click.x, y: click.y };
  click = null;
  return out;
}

export function consume(action) {
  down.delete(action);
  pressedOnce.delete(action);
}

/**
 * Draw on-screen stick + reset/menu during play.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 */
export function drawTouchControls(ctx, w, h) {
  if (!touchUiWanted || uiMode !== "play") return;
  const lay = touchLayout(w, h);
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  const bx = stick.active ? stick.baseX : lay.stickBaseX;
  const by = stick.active ? stick.baseY : lay.stickBaseY;
  const kx = stick.active ? stick.x : bx;
  const ky = stick.active ? stick.y : by;

  ctx.beginPath();
  ctx.arc(bx, by, TOUCH.stickR, 0, Math.PI * 2);
  ctx.fillStyle = stick.active
    ? "rgba(40, 55, 75, 0.5)"
    : "rgba(28, 36, 52, 0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(78, 201, 208, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(kx, ky, 20, 0, Math.PI * 2);
  ctx.fillStyle = stick.active
    ? "rgba(120, 210, 220, 0.55)"
    : "rgba(90, 140, 160, 0.4)";
  ctx.fill();
  ctx.strokeStyle = "rgba(180, 230, 240, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const drawBtn = (x, y, label, held, fill, stroke) => {
    ctx.beginPath();
    ctx.arc(x, y, TOUCH.btnR, 0, Math.PI * 2);
    ctx.fillStyle = held ? fill : fill.replace(/[\d.]+\)$/, "0.38)");
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(230, 240, 250, 0.92)";
    ctx.font = `bold 10px ${mono}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
    ctx.textBaseline = "alphabetic";
  };

  const resetHeld = buttonHold && buttonHold.kind === "reset";
  const menuHeld = buttonHold && buttonHold.kind === "menu";
  drawBtn(
    lay.resetX,
    lay.resetY,
    "R",
    !!resetHeld,
    "rgba(224, 140, 80, 0.55)",
    "rgba(240, 180, 100, 0.6)"
  );
  drawBtn(
    lay.menuX,
    lay.menuY,
    "MENU",
    !!menuHeld,
    "rgba(80, 120, 160, 0.55)",
    "rgba(120, 180, 220, 0.55)"
  );
}
