/** Personal bests + first-boot intro flag */

const STORAGE_KEY = "loopself_best_v1";
const INTRO_KEY = "loopself_intro_seen_v1";

/**
 * @returns {Record<string, { ghosts: number }>}
 */
export function loadBests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return {};
    return data;
  } catch {
    return {};
  }
}

/**
 * @param {string} levelId
 * @returns {number | null} best ghost count, or null if none
 */
export function getBest(levelId) {
  const b = loadBests()[levelId];
  if (!b || !Number.isFinite(b.ghosts)) return null;
  return b.ghosts;
}

/**
 * Save if better (fewer ghosts). Returns new best or previous.
 * @param {string} levelId
 * @param {number} ghosts
 * @returns {{ best: number, isNew: boolean }}
 */
export function recordBest(levelId, ghosts) {
  const n = Math.max(0, Math.floor(ghosts));
  const all = loadBests();
  const prev = all[levelId]?.ghosts;
  if (prev == null || n < prev) {
    all[levelId] = { ghosts: n };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* quota / private mode */
    }
    return { best: n, isNew: true };
  }
  return { best: prev, isNew: false };
}

export function hasSeenIntro() {
  try {
    return localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* ignore */
  }
}
