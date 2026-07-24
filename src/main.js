/**
 * Loopself — Slice A
 * Move, 10s timer, ghost record/playback, plate + door, L01 tutorial.
 */

import { initInput, getInput } from "./input.js";
import { getLevel } from "./levels.js";
import { Game } from "./game.js";
import { render } from "./render.js";

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D unavailable");

const level = getLevel(0);
const game = new Game(level);

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

initInput();
resize();
window.addEventListener("resize", resize);

let last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  // Clamp spiral-of-death / tab-switch jumps
  if (dt > 0.05) dt = 0.05;

  game.update(dt, getInput());
  render(ctx, cssW, cssH, game.view());

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
