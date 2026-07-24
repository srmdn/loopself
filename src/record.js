/**
 * Position recording + ghost playback.
 * Samples store absolute world positions (deterministic playback).
 */

/**
 * @typedef {{ t: number, x: number, y: number }} Sample
 * @typedef {{ samples: Sample[], duration: number }} Recording
 */

/** @returns {Recording} */
export function createRecording() {
  return { samples: [], duration: 0 };
}

/**
 * @param {Recording} rec
 * @param {number} t
 * @param {number} x
 * @param {number} y
 */
export function pushSample(rec, t, x, y) {
  const last = rec.samples[rec.samples.length - 1];
  // Thin near-duplicates to keep arrays small
  if (last && t - last.t < 1 / 60 && Math.hypot(x - last.x, y - last.y) < 0.5) {
    last.t = t;
    last.x = x;
    last.y = y;
    rec.duration = t;
    return;
  }
  rec.samples.push({ t, x, y });
  rec.duration = t;
}

/**
 * @param {Recording} rec
 * @param {number} endT
 * @returns {Recording}
 */
export function finalizeRecording(rec, endT) {
  if (rec.samples.length === 0) {
    return { samples: [{ t: 0, x: 0, y: 0 }], duration: endT };
  }
  const first = rec.samples[0];
  if (first.t > 0) {
    rec.samples.unshift({ t: 0, x: first.x, y: first.y });
  }
  const last = rec.samples[rec.samples.length - 1];
  if (last.t < endT) {
    rec.samples.push({ t: endT, x: last.x, y: last.y });
  }
  rec.duration = endT;
  return {
    samples: rec.samples.map((s) => ({ t: s.t, x: s.x, y: s.y })),
    duration: endT,
  };
}

/**
 * Interpolate pose at time t. Holds last sample after duration.
 * @param {Recording} rec
 * @param {number} t
 * @returns {{ x: number, y: number }}
 */
export function poseAt(rec, t) {
  const samples = rec.samples;
  if (!samples.length) return { x: 0, y: 0 };

  const tt = Math.max(0, Math.min(t, rec.duration));

  if (tt <= samples[0].t) return { x: samples[0].x, y: samples[0].y };
  if (tt >= samples[samples.length - 1].t) {
    const s = samples[samples.length - 1];
    return { x: s.x, y: s.y };
  }

  // Binary search segment
  let lo = 0;
  let hi = samples.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= tt) lo = mid;
    else hi = mid;
  }

  const a = samples[lo];
  const b = samples[hi];
  const span = b.t - a.t || 1;
  const u = (tt - a.t) / span;
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
  };
}
