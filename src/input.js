/** Keyboard + pointer state for Loopself */

const down = new Set();
/** @type {{ x: number, y: number, consumed: boolean } | null} */
let click = null;
/** edge-triggered keys this frame */
const pressedOnce = new Set();

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
 * @param {HTMLCanvasElement} canvas
 */
export function initInput(canvas) {
  window.addEventListener("keydown", (e) => {
    const action = codeToAction(e.code);
    if (!action) return;
    // Allow browser shortcuts with meta/ctrl
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
  });

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      consumed: false,
    };
  });
}

/** @returns {{ up: boolean, down: boolean, left: boolean, right: boolean, reset: boolean }} */
export function getMoveInput() {
  return {
    up: down.has("up"),
    down: down.has("down"),
    left: down.has("left"),
    right: down.has("right"),
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
