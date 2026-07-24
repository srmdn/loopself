/** Keyboard state for Loopself */

const down = new Set();

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
};

function codeToAction(code) {
  return KEY_MAP[code] ?? null;
}

export function initInput() {
  window.addEventListener("keydown", (e) => {
    const action = codeToAction(e.code);
    if (!action) return;
    e.preventDefault();
    down.add(action);
  });

  window.addEventListener("keyup", (e) => {
    const action = codeToAction(e.code);
    if (!action) return;
    e.preventDefault();
    down.delete(action);
  });

  window.addEventListener("blur", () => down.clear());
}

/** @returns {{ up: boolean, down: boolean, left: boolean, right: boolean, reset: boolean }} */
export function getInput() {
  return {
    up: down.has("up"),
    down: down.has("down"),
    left: down.has("left"),
    right: down.has("right"),
    reset: down.has("reset"),
  };
}

/** Consume one-shot actions (edge-trigger style). Call after handling. */
export function consume(action) {
  down.delete(action);
}
