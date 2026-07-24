/**
 * Loopself — Slice B (partial)
 * Menu, level select, best scores, L01 + L02.
 */

import {
  initInput,
  getMoveInput,
  wasPressed,
  consumeClick,
} from "./input.js";
import { getLevel, listLevels, levelCount } from "./levels.js";
import { Game } from "./game.js";
import { getBest, recordBest, loadBests } from "./storage.js";
import {
  renderMenu,
  renderPlay,
  renderClear,
  menuLayout,
  clearLayout,
  hit,
} from "./render.js";

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D unavailable");

/** @type {'menu' | 'play' | 'clear'} */
let mode = "menu";
let levelIndex = 0;
let game = new Game(getLevel(0));
/** @type {{ best: number | null, isNew: boolean }} */
let clearInfo = { best: null, isNew: false };
let hoverIndex = -1;
/** @type {ReturnType<typeof menuLayout> | null} */
let lastMenuLayout = null;
/** @type {ReturnType<typeof clearLayout> | null} */
let lastClearLayout = null;

let cssW = 0;
let cssH = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cssW = window.innerWidth;
  cssH = window.innerHeight;
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
  levelIndex = Math.max(0, Math.min(levelCount() - 1, index));
  game = new Game(getLevel(levelIndex));
  mode = "play";
  clearInfo = { best: getBest(game.level.id), isNew: false };
}

function goMenu() {
  mode = "menu";
  hoverIndex = -1;
}

function onWin() {
  const ghosts = game.winGhosts;
  const result = recordBest(game.level.id, ghosts);
  clearInfo = { best: result.best, isNew: result.isNew };
  mode = "clear";
}

function hasNext() {
  return levelIndex + 1 < levelCount();
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

  // Digit jump while playing
  for (let n = 1; n <= 9; n++) {
    if (wasPressed(`lv${n}`) && n <= levelCount()) {
      startLevel(n - 1);
      return;
    }
  }

  game.update(dt, getMoveInput());
  if (game.won) onWin();
}

function handleClearInput() {
  if (wasPressed("menu")) {
    goMenu();
    return;
  }
  if (wasPressed("reset") || wasPressed("confirm")) {
    game.hardReset();
    mode = "play";
    clearInfo = { best: getBest(game.level.id), isNew: false };
    return;
  }
  if (wasPressed("next") && hasNext()) {
    startLevel(levelIndex + 1);
    return;
  }

  const c = consumeClick();
  if (c && lastClearLayout) {
    if (hit(lastClearLayout.replay, c.x, c.y)) {
      game.hardReset();
      mode = "play";
      clearInfo = { best: getBest(game.level.id), isNew: false };
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

initInput(canvas);
resize();
window.addEventListener("resize", resize);

let last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;

  if (mode === "menu") {
    handleMenuInput();
    lastMenuLayout = renderMenu(ctx, cssW, cssH, {
      levels: listLevels(),
      bests: bestsMap(),
      hoverIndex,
    });
    lastClearLayout = null;
  } else if (mode === "play") {
    handlePlayInput(dt);
    if (mode === "play") {
      renderPlay(ctx, cssW, cssH, game.view(), {
        best: getBest(game.level.id),
        isNew: false,
        hasNext: hasNext(),
      });
    } else if (mode === "clear") {
      lastClearLayout = renderClear(ctx, cssW, cssH, game.view(), {
        best: clearInfo.best,
        isNew: clearInfo.isNew,
        hasNext: hasNext(),
      });
    }
    lastMenuLayout = null;
  } else if (mode === "clear") {
    handleClearInput();
    lastClearLayout = renderClear(ctx, cssW, cssH, game.view(), {
      best: clearInfo.best,
      isNew: clearInfo.isNew,
      hasNext: hasNext(),
    });
    lastMenuLayout = null;
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
