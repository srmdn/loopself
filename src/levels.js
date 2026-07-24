/**
 * Level data — tile map legend:
 *   # wall
 *   . floor
 *   S spawn
 *   P pressure plate
 *   D door (closed unless linked plate active)
 *   E exit
 *
 * Coords in level objects are tile units; runtime multiplies by TILE.
 */

export const TILE = 40;
export const PLAYER_RADIUS = 12;
export const MOVE_SPEED = 150;
export const MAX_GHOSTS_DEFAULT = 3;

/**
 * Parse a rectangular string map into runtime level.
 * Door links to first plate by default (Slice A).
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
          requires: [], // filled below
        });
      } else if (ch === "E") {
        exit = { x: x + 6, y: y + 6, w: TILE - 12, h: TILE - 12 };
      }
    }
  }

  // Slice A: every door needs all plates (AND). L01 has one plate.
  const plateIds = plates.map((p) => p.id);
  for (const d of doors) {
    d.requires = plateIds.length ? [...plateIds] : [];
  }

  return {
    id: def.id,
    name: def.name,
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

export const LEVELS = [
  parseLevel({
    id: "l01",
    name: "Hold the line",
    hint: "Stand on the plate until the timer ends, then use your ghost to hold it while you exit.",
    loopSec: 10,
    maxGhosts: 3,
    map: L01_MAP,
  }),
];

export function getLevel(index = 0) {
  return LEVELS[index] ?? LEVELS[0];
}
