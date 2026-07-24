/**
 * Level data — tile map legend:
 *   # wall
 *   . floor
 *   S spawn
 *   P pressure plate
 *   D door (closed unless linked plates active)
 *   E exit
 */

export const TILE = 40;
export const PLAYER_RADIUS = 12;
export const MOVE_SPEED = 150;
export const MAX_GHOSTS_DEFAULT = 3;

/**
 * Parse a rectangular string map into runtime level.
 * Default: every door requires ALL plates (AND).
 * Optional def.doorRequires: { d1: ['p1','p2'], ... } by order index.
 * @param {object} def
 */
export function parseLevel(def) {
  const rows = def.map.trim().split("\n").map((r) => r.trimEnd());
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));

  /** @type {{ x: number, y: number, w: number, h: number }[]} */
  const walls = [];
  /** @type {{ id: string, x: number, y: number, w: number, h: number }[]} */
  const plates = [];
  /** @type {{ id: string, x: number, y: number, w: number, h: number, requires: string[] }[]} */
  const doors = [];
  let spawn = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 2, y: TILE * 2, w: TILE, h: TILE };

  let plateN = 0;
  let doorN = 0;

  for (let ty = 0; ty < height; ty++) {
    const row = rows[ty].padEnd(width, ".");
    for (let tx = 0; tx < width; tx++) {
      const ch = row[tx];
      const x = tx * TILE;
      const y = ty * TILE;

      if (ch === "#") {
        walls.push({ x, y, w: TILE, h: TILE });
      } else if (ch === "S") {
        spawn = { x: x + TILE / 2, y: y + TILE / 2 };
      } else if (ch === "P") {
        plateN += 1;
        plates.push({
          id: `p${plateN}`,
          x: x + 4,
          y: y + 4,
          w: TILE - 8,
          h: TILE - 8,
        });
      } else if (ch === "D") {
        doorN += 1;
        doors.push({
          id: `d${doorN}`,
          x,
          y,
          w: TILE,
          h: TILE,
          requires: [],
        });
      } else if (ch === "E") {
        exit = { x: x + 6, y: y + 6, w: TILE - 12, h: TILE - 12 };
      }
    }
  }

  const plateIds = plates.map((p) => p.id);
  for (const d of doors) {
    if (def.doorRequires && def.doorRequires[d.id]) {
      d.requires = [...def.doorRequires[d.id]];
    } else {
      d.requires = plateIds.length ? [...plateIds] : [];
    }
  }

  return {
    id: def.id,
    index: def.index ?? 0,
    name: def.name,
    brief: def.brief ?? "",
    hint: def.hint ?? "",
    loopSec: def.loopSec ?? 10,
    maxGhosts: def.maxGhosts ?? MAX_GHOSTS_DEFAULT,
    width: width * TILE,
    height: height * TILE,
    cols: width,
    rows: height,
    walls,
    plates,
    doors,
    spawn,
    exit,
  };
}

/** L01 — stand on plate as ghost, walk exit as self */
const L01_MAP = `
##################
#S...............#
#................#
#................#
#..........###D E#
#..........###...#
#................#
#................#
#P...............#
#................#
##################
`;

/**
 * L02 — two plates AND for one door.
 * Need ghost on each plate (or ghost + self), then walk exit.
 */
const L02_MAP = `
######################
#S...................#
#....................#
#P............###D E.#
#.............###....#
#....................#
#....................#
#....................#
#...................P#
#....................#
######################
`;

export const LEVELS = [
  parseLevel({
    index: 0,
    id: "l01",
    name: "Hold the line",
    brief: "One plate. Record a hold, then walk out.",
    hint: "Stand on the plate until the timer ends, then use your ghost to hold it while you exit.",
    loopSec: 10,
    maxGhosts: 3,
    map: L01_MAP,
  }),
  parseLevel({
    index: 1,
    id: "l02",
    name: "Two hands",
    brief: "Both plates at once. Door needs AND.",
    hint: "Door needs BOTH plates. Record one hold per plate, then exit while both stay pressed.",
    loopSec: 12,
    maxGhosts: 3,
    map: L02_MAP,
  }),
];

export function listLevels() {
  return LEVELS.map((l, i) => ({
    index: i,
    id: l.id,
    name: l.name,
    brief: l.brief,
  }));
}

export function getLevel(index = 0) {
  return LEVELS[index] ?? LEVELS[0];
}

export function getLevelById(id) {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function levelCount() {
  return LEVELS.length;
}
