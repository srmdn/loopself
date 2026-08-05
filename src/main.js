/**
 * Loopself — MVP complete (Slice B + C)
 * 8 levels, menu, bests, intro, SFX, juice.
 */

import {
  initInput,
  getMoveInput,
  wasPressed,
  consumeClick,
  setInputMode,
  drawTouchControls,
} from "./input.js";
import { initOrientationPrompt, viewportSize } from "./mobile.js";
import { getLevel, listLevels, levelCount } from "./levels.js";
import { Game } from "./game.js";
import {
  getBest,
  recordBest,
  loadBests,
  hasSeenIntro,
  markIntroSeen,
} from "./storage.js";
import {
  renderMenu,
  renderPlay,
  renderClear,
  renderIntro,
  menuLayout,
  clearLayout,
  introLayout,
  hit,
} from "./render.js";
import {
  unlockAudio,
  playLoop,
  playWin,
  playUi,
  playReset,
  playTick,
} from "./audio.js";

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D unavailable");
initOrientationPrompt({ game: "Loopself", accent: "#4ec9d0" });

/** @type {'intro' | 'menu' | 'play' | 'clear'} */
let mode = hasSeenIntro() ? "menu" : "intro";
let levelIndex = 0;
let game = new Game(getLevel(0));
/** @type {{ best: number | null, isNew: boolean }} */
let clearInfo = { best: null, isNew: false };
let hoverIndex = -1;
/** @type {ReturnType<typeof menuLayout> | null} */
let lastMenuLayout = null;
/** @type {ReturnType<typeof clearLayout> | null} */
let lastClearLayout = null;
/** @type {ReturnType<typeof introLayout> | null} */
let lastIntroLayout = null;

let cssW = 0;
let cssH = 0;
let dpr = 1;
let lastTickSecond = -1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const viewport = viewportSize();
  cssW = viewport.w;
  cssH = viewport.h;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bestsMap() {
  const raw = loadBests();
  /** @type {Record<string, number | null>} */
  const out = {};
  for (const lv of listLevels()) {
    out[lv.id] = raw[lv.id]?.ghosts ?? null;
  }
  return out;
}

function startLevel(index) {
  unlockAudio();
  playUi();
  levelIndex = Math.max(0, Math.min(levelCount() - 1, index));
  game = new Game(getLevel(levelIndex));
  mode = "play";
  clearInfo = { best: getBest(game.level.id), isNew: false };
  lastTickSecond = -1;
}

function goMenu() {
  unlockAudio();
  mode = "menu";
  hoverIndex = -1;
}

function dismissIntro() {
  unlockAudio();
  markIntroSeen();
  playUi();
  mode = "menu";
}

function onWin() {
  unlockAudio();
  playWin();
  const ghosts = game.winGhosts;
  const result = recordBest(game.level.id, ghosts);
  clearInfo = { best: result.best, isNew: result.isNew };
  mode = "clear";
}

function hasNext() {
  return levelIndex + 1 < levelCount();
}

function handleIntroInput() {
  if (wasPressed("confirm") || wasPressed("menu")) {
    dismissIntro();
    return;
  }
  const c = consumeClick();
  if (c && lastIntroLayout && hit(lastIntroLayout.btn, c.x, c.y)) {
    dismissIntro();
  }
}

function handleMenuInput() {
  for (let n = 1; n <= 9; n++) {
    if (wasPressed(`lv${n}`) && n <= levelCount()) {
      startLevel(n - 1);
      return;
    }
  }

  const c = consumeClick();
  if (c && lastMenuLayout) {
    for (const card of lastMenuLayout.cards) {
      if (hit(card, c.x, c.y)) {
        startLevel(card.index);
        return;
      }
    }
  }
}

function handlePlayInput(dt) {
  if (wasPressed("menu")) {
    goMenu();
    return;
  }

  for (let n = 1; n <= 9; n++) {
    if (wasPressed(`lv${n}`) && n <= levelCount()) {
      startLevel(n - 1);
      return;
    }
  }

  game.update(dt, getMoveInput());

  if (game.justReset) {
    unlockAudio();
    playReset();
    lastTickSecond = -1;
  }
  if (game.justLooped) {
    unlockAudio();
    playLoop();
    lastTickSecond = -1;
  }
  if (game.justWon) {
    onWin();
    return;
  }

  // Soft tick in last 3 seconds of loop
  if (!game.won) {
    const left = game.level.loopSec - game.t;
    if (left <= 3 && left > 0) {
      const sec = Math.ceil(left);
      if (sec !== lastTickSecond) {
        lastTickSecond = sec;
        unlockAudio();
        playTick();
      }
    }
  }
}

function handleClearInput() {
  if (wasPressed("menu")) {
    goMenu();
    return;
  }
  if (wasPressed("reset") || wasPressed("confirm")) {
    unlockAudio();
    playReset();
    game.hardReset();
    mode = "play";
    clearInfo = { best: getBest(game.level.id), isNew: false };
    lastTickSecond = -1;
    return;
  }
  if (wasPressed("next") && hasNext()) {
    startLevel(levelIndex + 1);
    return;
  }

  const c = consumeClick();
  if (c && lastClearLayout) {
    if (hit(lastClearLayout.replay, c.x, c.y)) {
      unlockAudio();
      playReset();
      game.hardReset();
      mode = "play";
      clearInfo = { best: getBest(game.level.id), isNew: false };
      lastTickSecond = -1;
      return;
    }
    if (hit(lastClearLayout.next, c.x, c.y) && hasNext()) {
      startLevel(levelIndex + 1);
      return;
    }
    if (hit(lastClearLayout.menu, c.x, c.y)) {
      goMenu();
    }
  }
}

canvas.addEventListener("pointermove", (e) => {
  if (mode !== "menu" || !lastMenuLayout) {
    hoverIndex = -1;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  hoverIndex = -1;
  for (const card of lastMenuLayout.cards) {
    if (hit(card, x, y)) {
      hoverIndex = card.index;
      break;
    }
  }
});

// Unlock audio on first pointer/key
window.addEventListener(
  "pointerdown",
  () => {
    unlockAudio();
  },
  { once: true }
);
window.addEventListener(
  "keydown",
  () => {
    unlockAudio();
  },
  { once: true }
);

initInput(canvas);
resize();
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => {
  requestAnimationFrame(resize);
  window.setTimeout(resize, 80);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize, { passive: true });
}

let last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;

  setInputMode(mode);

  if (mode === "intro") {
    handleIntroInput();
    lastIntroLayout = renderIntro(ctx, cssW, cssH);
    lastMenuLayout = null;
    lastClearLayout = null;
  } else if (mode === "menu") {
    handleMenuInput();
    lastMenuLayout = renderMenu(ctx, cssW, cssH, {
      levels: listLevels(),
      bests: bestsMap(),
      hoverIndex,
    });
    lastClearLayout = null;
    lastIntroLayout = null;
  } else if (mode === "play") {
    handlePlayInput(dt);
    if (mode === "play") {
      // Keep particles/tints updating even mid-frame transitions
      renderPlay(ctx, cssW, cssH, game.view(), {
        best: getBest(game.level.id),
        isNew: false,
        hasNext: hasNext(),
      });
      drawTouchControls(ctx, cssW, cssH);
    } else if (mode === "clear") {
      lastClearLayout = renderClear(ctx, cssW, cssH, game.view(), {
        best: clearInfo.best,
        isNew: clearInfo.isNew,
        hasNext: hasNext(),
      });
    }
    lastMenuLayout = null;
    lastIntroLayout = null;
  } else if (mode === "clear") {
    // Animate residual particles under clear overlay
    game.updateParticles(dt);
    handleClearInput();
    lastClearLayout = renderClear(ctx, cssW, cssH, game.view(), {
      best: clearInfo.best,
      isNew: clearInfo.isNew,
      hasNext: hasNext(),
    });
    lastMenuLayout = null;
    lastIntroLayout = null;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
