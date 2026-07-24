import { PLAYER_RADIUS, MOVE_SPEED } from "./levels.js";
import {
  createRecording,
  pushSample,
  finalizeRecording,
  poseAt,
} from "./record.js";

/**
 * @typedef {ReturnType<import('./levels.js').parseLevel>} Level
 * @typedef {import('./record.js').Recording} Recording
 */

function circleRectOverlap(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function resolveCircleRects(x, y, r, rects) {
  let px = x;
  let py = y;
  for (let pass = 0; pass < 3; pass++) {
    for (const rect of rects) {
      const nearestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
      const nearestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
      let dx = px - nearestX;
      let dy = py - nearestY;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r * r || d2 === 0) {
        if (
          px > rect.x &&
          px < rect.x + rect.w &&
          py > rect.y &&
          py < rect.y + rect.h
        ) {
          const left = px - rect.x;
          const right = rect.x + rect.w - px;
          const top = py - rect.y;
          const bottom = rect.y + rect.h - py;
          const m = Math.min(left, right, top, bottom);
          if (m === left) px = rect.x - r;
          else if (m === right) px = rect.x + rect.w + r;
          else if (m === top) py = rect.y - r;
          else py = rect.y + rect.h + r;
        }
        continue;
      }
      const d = Math.sqrt(d2);
      const push = (r - d) / d;
      px += dx * push;
      py += dy * push;
    }
  }
  return { x: px, y: py };
}

export class Game {
  /** @param {Level} level */
  constructor(level) {
    this.level = level;
    this.won = false;
    this.winFlash = 0;
    /** Ghosts used at the moment of win (for scoring). */
    this.winGhosts = 0;
    /** @type {Recording[]} */
    this.ghosts = [];
    /** @type {Recording} */
    this.active = createRecording();
    this.t = 0;
    this.player = { x: level.spawn.x, y: level.spawn.y };
    this.loopsCommitted = 0;
    this.hintPulse = 0;
    this.maxedToast = 0;
    this.resetPressed = false;
  }

  /** @param {Level} level */
  loadLevel(level) {
    this.level = level;
    this.hardReset();
  }

  hardReset() {
    this.ghosts = [];
    this.active = createRecording();
    this.t = 0;
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
    this.won = false;
    this.winFlash = 0;
    this.winGhosts = 0;
    this.loopsCommitted = 0;
    this.maxedToast = 0;
  }

  softLoopBoundary() {
    const maxG = this.level.maxGhosts;
    if (this.ghosts.length < maxG) {
      if (this.active.samples.length === 0) {
        pushSample(this.active, 0, this.level.spawn.x, this.level.spawn.y);
      }
      const rec = finalizeRecording(this.active, this.level.loopSec);
      this.ghosts.push(rec);
      this.loopsCommitted += 1;
    } else {
      this.maxedToast = 2.5;
    }
    this.active = createRecording();
    this.t = 0;
    this.player.x = this.level.spawn.x;
    this.player.y = this.level.spawn.y;
  }

  bodiesAt(t) {
    const bodies = [{ x: this.player.x, y: this.player.y }];
    for (const g of this.ghosts) {
      bodies.push(poseAt(g, t));
    }
    return bodies;
  }

  /** @returns {Record<string, boolean>} */
  plateState(t) {
    const bodies = this.bodiesAt(t);
    /** @type {Record<string, boolean>} */
    const state = {};
    for (const p of this.level.plates) {
      let on = false;
      for (const b of bodies) {
        if (circleRectOverlap(b.x, b.y, PLAYER_RADIUS, p)) {
          on = true;
          break;
        }
      }
      state[p.id] = on;
    }
    return state;
  }

  /** @param {Record<string, boolean>} plates */
  doorOpen(door, plates) {
    if (!door.requires.length) return true;
    return door.requires.every((id) => plates[id]);
  }

  solidRects(plates) {
    const rects = [...this.level.walls];
    for (const d of this.level.doors) {
      if (!this.doorOpen(d, plates)) rects.push(d);
    }
    return rects;
  }

  /**
   * @param {number} dt
   * @param {{ up: boolean, down: boolean, left: boolean, right: boolean, reset: boolean }} input
   */
  update(dt, input) {
    if (input.reset && !this.resetPressed) {
      this.hardReset();
      this.resetPressed = true;
      return;
    }
    if (!input.reset) this.resetPressed = false;

    if (this.won) {
      this.winFlash = Math.min(2, this.winFlash + dt);
      return;
    }

    if (this.maxedToast > 0) this.maxedToast -= dt;
    this.hintPulse += dt;

    this.t += dt;
    if (this.t >= this.level.loopSec) {
      this.softLoopBoundary();
    }

    const plates = this.plateState(this.t);
    const solids = this.solidRects(plates);

    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;
    if (mx !== 0 || my !== 0) {
      const len = Math.hypot(mx, my);
      mx = (mx / len) * MOVE_SPEED * dt;
      my = (my / len) * MOVE_SPEED * dt;
    }

    let nx = this.player.x + mx;
    let ny = this.player.y + my;

    let resolved = resolveCircleRects(nx, this.player.y, PLAYER_RADIUS, solids);
    nx = resolved.x;
    resolved = resolveCircleRects(nx, this.player.y + my, PLAYER_RADIUS, solids);
    ny = resolved.y;

    for (const g of this.ghosts) {
      const gp = poseAt(g, this.t);
      const dx = nx - gp.x;
      const dy = ny - gp.y;
      const minDist = PLAYER_RADIUS * 2;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / dist;
        nx += dx * push;
        ny += dy * push;
        const r2 = resolveCircleRects(nx, ny, PLAYER_RADIUS, solids);
        nx = r2.x;
        ny = r2.y;
      }
    }

    this.player.x = nx;
    this.player.y = ny;

    pushSample(this.active, this.t, this.player.x, this.player.y);

    const ex = this.level.exit;
    if (circleRectOverlap(this.player.x, this.player.y, PLAYER_RADIUS * 0.6, ex)) {
      const allDoorsOpen = this.level.doors.every((d) => this.doorOpen(d, plates));
      if (allDoorsOpen || this.level.doors.length === 0) {
        this.won = true;
        this.winFlash = 0;
        this.winGhosts = this.ghosts.length;
      }
    }
  }

  /** Contextual coach — works for 1+ plates. */
  coachText(plates, doorsOpen) {
    if (this.won) return "Clear!";

    const plateList = this.level.plates;
    const heldCount = plateList.filter((p) => plates[p.id]).length;
    const need = plateList.length;
    const playerOnPlate = plateList.some((p) =>
      circleRectOverlap(this.player.x, this.player.y, PLAYER_RADIUS, p)
    );

    if (need >= 2) {
      if (!doorsOpen) {
        if (this.ghosts.length === 0) {
          if (playerOnPlate) {
            return `Holding 1 plate — stay until timer ends, then record the other plate. (${heldCount}/${need} held now)`;
          }
          return `Door needs ALL ${need} plates at once. Record a ghost on each plate, then walk to EXIT.`;
        }
        return `Need ${need} plates held together (${heldCount}/${need}). Park ghosts on plates, then go when door opens.`;
      }
      return "All plates held — door open! Reach the green EXIT.";
    }

    // Single-plate (L01) coaching
    if (this.ghosts.length === 0) {
      if (playerOnPlate) {
        return "Good — stay on the plate until the timer hits 0. Your path is being recorded.";
      }
      return "STEP 1/2 — Walk to the gold PLATE and stand on it until the timer ends.";
    }

    if (!doorsOpen) {
      if (heldCount > 0) {
        return "Door should open soon… if not, ghost missed the plate — press R and try again.";
      }
      return "STEP 2/2 — Cyan ghost is your past self. Wait until it stands on the plate, then go.";
    }

    return "Door open! Walk through it into the green EXIT.";
  }

  view() {
    const plates = this.plateState(this.t);
    const doors = this.level.doors.map((d) => ({
      id: d.id,
      open: this.doorOpen(d, plates),
      x: d.x,
      y: d.y,
      w: d.w,
      h: d.h,
    }));

    const doorsOpen =
      this.level.doors.length === 0 || doors.every((d) => d.open);

    const ghostPos = this.ghosts.map((g) => poseAt(g, this.t));

    /** @type {Record<string, boolean>} */
    const plateOn = {};
    for (const p of this.level.plates) plateOn[p.id] = !!plates[p.id];

    return {
      level: this.level,
      t: this.t,
      loopSec: this.level.loopSec,
      player: { x: this.player.x, y: this.player.y },
      ghosts: ghostPos,
      ghostCount: this.ghosts.length,
      maxGhosts: this.level.maxGhosts,
      plates: this.level.plates,
      plateOn,
      doors,
      doorsOpen,
      exit: this.level.exit,
      won: this.won,
      winFlash: this.winFlash,
      winGhosts: this.winGhosts,
      hint: this.coachText(plates, doorsOpen),
      hintPulse: this.hintPulse,
      maxedToast: this.maxedToast,
      loopsCommitted: this.loopsCommitted,
      phase: this.ghosts.length === 0 ? 1 : 2,
    };
  }
}
