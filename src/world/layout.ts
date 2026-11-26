import { CATS, type CatId } from '../data/cats';
import { Bag, pointInEllipse } from '../core/rng';

export const TILE = 16;
export const WORLD_COLS = 64;
export const WORLD_ROWS = 46;
export const WORLD_W = WORLD_COLS * TILE;
export const WORLD_H = WORLD_ROWS * TILE;
export const VIEW_W = 480;
export const VIEW_H = 270;

export const HOUSE = {
  x: 5 * TILE,
  y: 3 * TILE,
  w: 8 * TILE,
  h: 120,
  door: { x: 9 * TILE, y: 10 * TILE }, // foot of the steps, not out in the lawn
};

export const FIELD = {
  tx: 17,
  ty: 7,
  tw: 13,
  th: 6,
  x: 17 * TILE,
  y: 7 * TILE,
  w: 13 * TILE,
  h: 6 * TILE,
};

export const FENCE = {
  x: 16 * TILE,
  y: 6 * TILE,
  w: 15 * TILE,
  h: 8 * TILE,
  gateX: 23 * TILE,
  gateW: 2 * TILE,
};

export const POND = {
  cx: 52.5 * TILE,
  cy: 27 * TILE,
  rx: 6.6 * TILE,
  ry: 4.3 * TILE,
};

export const WELL = { x: 39 * TILE, y: 25.1 * TILE };
export const STAND = { x: 37 * TILE, y: 12 * TILE };
export const BENCH = { x: 27.6 * TILE, y: 28.2 * TILE };
export const SIGN = { x: 22 * TILE, y: 33 * TILE };
export const SCARECROW = { x: 18.5 * TILE, y: 12.9 * TILE };

export const PLAYER_START = { x: 10.5 * TILE, y: 12.4 * TILE };
export const PLAYER_RADIUS = 5;
export const WALK_SPEED = 62;
export const RUN_SPEED = 104;

export type TreeKind = 'oak' | 'fir' | 'birch' | 'apple';

export interface TreeDef {
  x: number;
  y: number;
  kind: TreeKind;
  scale: number;
  /** Interior trees get a trunk collider. Border trees are scenery. */
  solid: boolean;
}

export interface WeedDef {
  id: string;
  x: number;
  y: number;
  kind: 'weed' | 'stone' | 'stump';
}

export const TREES: TreeDef[] = [];

function addTree(x: number, y: number, kind: TreeKind, scale: number, solid: boolean): void {
  TREES.push({ x, y, kind, scale, solid });
}

// Hero trees, placed by hand.
addTree(27.2 * TILE, 26.4 * TILE, 'oak', 1.85, true); // the old oak by the bench
addTree(7.5 * TILE, 22 * TILE, 'oak', 1.35, true);
addTree(20.5 * TILE, 31.5 * TILE, 'oak', 1.15, true);
addTree(46.5 * TILE, 35 * TILE, 'birch', 1.15, true);
addTree(33 * TILE, 36 * TILE, 'oak', 1.25, true);
addTree(59 * TILE, 22 * TILE, 'fir', 1.4, true);
addTree(13 * TILE, 37 * TILE, 'birch', 1.0, true);

// The little apple orchard on the east slope.
addTree(43 * TILE, 7.5 * TILE, 'apple', 1.05, true);
addTree(46 * TILE, 8.5 * TILE, 'apple', 1.0, true);
addTree(49 * TILE, 7.2 * TILE, 'apple', 1.1, true);
addTree(45 * TILE, 10.5 * TILE, 'apple', 0.95, true);

// Forest frame. Seeded so the treeline never changes between visits.
const bag = new Bag(20261124);
for (let x = -12; x < WORLD_W + 30; x += 23) {
  addTree(x + bag.int(-6, 6), 4.2 * TILE + bag.int(-8, 8), bag.chance(0.34) ? 'fir' : 'oak', bag.float(0.95, 1.35), false);
  addTree(x + bag.int(-8, 8), 1.4 * TILE + bag.int(-5, 5), bag.chance(0.5) ? 'fir' : 'oak', bag.float(1.05, 1.45), false);
}
for (let y = 4; y < WORLD_ROWS - 1; y += 3.4) {
  addTree(1.2 * TILE + bag.int(-6, 6), y * TILE + bag.int(-8, 8), bag.chance(0.4) ? 'fir' : 'oak', bag.float(0.9, 1.3), false);
  addTree(62.2 * TILE + bag.int(-8, 8), y * TILE + bag.int(-8, 8), bag.chance(0.4) ? 'fir' : 'oak', bag.float(0.95, 1.3), false);
}
for (let x = -10; x < WORLD_W + 30; x += 26) {
  addTree(x + bag.int(-8, 8), 44.4 * TILE + bag.int(-6, 6), bag.chance(0.42) ? 'fir' : 'oak', bag.float(1.0, 1.4), false);
}

export const WEEDS: WeedDef[] = [
  { id: 'w1', x: 14.3 * TILE, y: 19.5 * TILE, kind: 'weed' },
  { id: 'w2', x: 12.2 * TILE, y: 22.4 * TILE, kind: 'weed' },
  { id: 'w3', x: 20.6 * TILE, y: 29.4 * TILE, kind: 'stone' },
  { id: 'w4', x: 9.2 * TILE, y: 17.6 * TILE, kind: 'weed' },
  { id: 'w5', x: 17.6 * TILE, y: 34.1 * TILE, kind: 'weed' },
  { id: 'w6', x: 30.5 * TILE, y: 21.4 * TILE, kind: 'stone' },
  { id: 'w7', x: 34.3 * TILE, y: 19.1 * TILE, kind: 'weed' },
  { id: 'w8', x: 43.5 * TILE, y: 16.5 * TILE, kind: 'weed' },
  { id: 'w9', x: 46 * TILE, y: 25.5 * TILE, kind: 'stump' },
  { id: 'w10', x: 29.5 * TILE, y: 38.5 * TILE, kind: 'weed' },
  { id: 'w11', x: 56 * TILE, y: 35.5 * TILE, kind: 'stone' },
  { id: 'w12', x: 11.5 * TILE, y: 28.3 * TILE, kind: 'weed' },
];

export interface CatSpot {
  id: CatId;
  x: number;
  y: number;
}

export const CAT_SPOTS: CatSpot[] = CATS.map((cat) => ({
  id: cat.id,
  x: cat.home.x * TILE,
  y: cat.home.y * TILE,
}));

export const LANTERNS = [
  { x: 10.4 * TILE, y: 14.4 * TILE },
  { x: 34 * TILE, y: 16.5 * TILE },
  { x: 40.5 * TILE, y: 22.5 * TILE },
  { x: 18.2 * TILE, y: 31 * TILE },
];
export const BEEHIVES = [
  { x: 12.3 * TILE, y: 32.5 * TILE },
  { x: 14.2 * TILE, y: 33.1 * TILE },
];

/** Path centre lines, in pixels. Painted with a soft edge, not tiles. */
export const PATHS: Array<Array<[number, number]>> = [
  [
    [9 * TILE, 11 * TILE],
    [9 * TILE, 14.4 * TILE],
    [12 * TILE, 15.6 * TILE],
    [19 * TILE, 16.2 * TILE],
    [23.6 * TILE, 16.4 * TILE],
  ],
  [
    [23.6 * TILE, 16.4 * TILE],
    [29 * TILE, 16.6 * TILE],
    [35 * TILE, 15.6 * TILE],
    [37.4 * TILE, 14.6 * TILE],
  ],
  [
    [34.6 * TILE, 16.2 * TILE],
    [37.6 * TILE, 20 * TILE],
    [38.8 * TILE, 24 * TILE],
  ],
  [
    [37 * TILE, 20 * TILE],
    [43 * TILE, 21.2 * TILE],
    [49 * TILE, 23 * TILE],
    [47 * TILE, 26.8 * TILE],
  ],
  [
    [12 * TILE, 15.6 * TILE],
    [10.4 * TILE, 22 * TILE],
    [10.3 * TILE, 27 * TILE],
    [13.5 * TILE, 31.5 * TILE],
    [18.5 * TILE, 33.2 * TILE],
    [22.5 * TILE, 33 * TILE],
  ],
  [
    [35 * TILE, 15.6 * TILE],
    [43 * TILE, 13.4 * TILE],
    [48 * TILE, 11.4 * TILE],
  ],
  // Spur from the main lane up through the field gate.
  [
    [23.6 * TILE, 16.4 * TILE],
    [23.6 * TILE, 14 * TILE],
  ],
];

export const STREAM: Array<[number, number]> = [
  [55.6 * TILE, 2 * TILE],
  [55.2 * TILE, 7 * TILE],
  [55.8 * TILE, 12 * TILE],
  [54.8 * TILE, 17 * TILE],
  [53.2 * TILE, 21 * TILE],
  [52.5 * TILE, 23 * TILE],
];

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const SOLID_RECTS: Rect[] = [
  // Walls, porch and steps of the cottage, in sprite pixels (the sprite is
  // drawn with its base on HOUSE.y + HOUSE.h). The old box floated over the roof.
  { x: HOUSE.x + 13, y: HOUSE.y + 51, w: 102, h: 62 },
  // The seed stand: posts and counter only, so the awning stays walk-under.
  { x: STAND.x - 24, y: STAND.y - 8, w: 48, h: 24 },
  { x: BENCH.x - 22, y: BENCH.y - 9, w: 44, h: 13 },
  { x: SCARECROW.x - 7, y: SCARECROW.y - 6, w: 14, h: 8 },
];

export const SOLID_CIRCLES: Array<{ x: number; y: number; r: number }> = [
  { x: WELL.x, y: WELL.y - 8, r: 17 },
  { x: SIGN.x, y: SIGN.y - 2, r: 6 },
  { x: BENCH.x, y: BENCH.y + 2, r: 10 },
  { x: SCARECROW.x, y: SCARECROW.y + 2, r: 6 },
  ...BEEHIVES.map((hive) => ({ x: hive.x, y: hive.y - 2, r: 7 })),
  // Props that used to be walk-through: bushes, rocks, stumps, reeds, and the
  // small yard things. Feet of each sprite, never its middle.
  { x: 46.7 * TILE, y: 31.1 * TILE - 2, r: 11 },
  { x: 5.5 * TILE, y: 26.5 * TILE - 2, r: 9 },
  { x: 30.9 * TILE, y: 23.9 * TILE - 2, r: 11 },
  { x: 51.1 * TILE, y: 31.7 * TILE - 2, r: 9 },
  { x: 21.4 * TILE, y: 37.6 * TILE - 2, r: 8 },
  { x: 3.7 * TILE, y: 11.8 * TILE - 2, r: 8 },
  { x: 15.3 * TILE, y: 17.4 * TILE - 2, r: 8 },
  { x: 44.8 * TILE, y: 21.2 * TILE - 2, r: 8 },
  { x: 20.2 * TILE, y: 35.2 * TILE - 2, r: 8 },
  { x: 56.3 * TILE, y: 29.2 * TILE - 2, r: 8 },
  { x: 42.4 * TILE, y: 24.9 * TILE - 2, r: 6 },
  { x: 57.6 * TILE, y: 33.1 * TILE - 2, r: 6 },
  { x: 15.4 * TILE, y: 25.4 * TILE - 2, r: 6 },
  { x: 60.2 * TILE, y: 39.1 * TILE - 2, r: 5 },
  { x: 45.4 * TILE, y: 25.7 * TILE - 2, r: 6 },
  { x: 44.8 * TILE, y: 28.6 * TILE - 2, r: 6 },
  { x: 59.6 * TILE, y: 24.2 * TILE - 2, r: 6 },
  { x: 52.1 * TILE, y: 9.2 * TILE - 2, r: 6 },
  { x: 52.2 * TILE, y: 19.1 * TILE - 2, r: 6 },
  { x: 13.05 * TILE, y: 13.25 * TILE - 1, r: 3 },
  { x: 11.95 * TILE, y: 13.5 * TILE - 1, r: 5 },
  { x: 12.75 * TILE, y: 13.6 * TILE - 1, r: 5 },
  { x: 38.9 * TILE, y: 14.55 * TILE - 1, r: 3 },
  // Two clothesline posts; the line itself is overhead.
  { x: 7.3 * TILE - 25, y: 18.9 * TILE - 1, r: 2 },
  { x: 7.3 * TILE + 25, y: 18.9 * TILE - 1, r: 2 },
  ...LANTERNS.map((lantern) => ({ x: lantern.x, y: lantern.y - 1, r: 2 })),
  // Loose stones and the little weed clumps that used to be pure decoration.
  { x: 20.8 * TILE, y: 30.2 * TILE - 2, r: 8 },
  { x: 41.2 * TILE, y: 19.1 * TILE - 2, r: 8 },
  ...WEEDS.filter((weed) => weed.kind !== 'weed').map((weed) => ({
    x: weed.x,
    y: weed.y - 2,
    r: weed.kind === 'stone' ? 6 : 7,
  })),
];

for (const tree of TREES) {
  if (tree.solid) SOLID_CIRCLES.push({ x: tree.x, y: tree.y - 2, r: 7 * tree.scale });
}

export const FENCE_SEGMENTS: Array<{ x1: number; y1: number; x2: number; y2: number; gate?: boolean }> = [
  { x1: FENCE.x, y1: FENCE.y, x2: FENCE.x + FENCE.w, y2: FENCE.y },
  { x1: FENCE.x, y1: FENCE.y, x2: FENCE.x, y2: FENCE.y + FENCE.h },
  { x1: FENCE.x + FENCE.w, y1: FENCE.y, x2: FENCE.x + FENCE.w, y2: FENCE.y + FENCE.h },
  { x1: FENCE.x, y1: FENCE.y + FENCE.h, x2: FENCE.gateX, y2: FENCE.y + FENCE.h },
  { x1: FENCE.gateX + FENCE.gateW, y1: FENCE.y + FENCE.h, x2: FENCE.x + FENCE.w, y2: FENCE.y + FENCE.h },
];

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length));
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

export function nearWater(x: number, y: number): boolean {
  const d = Math.sqrt(((x - POND.cx) / POND.rx) ** 2 + ((y - POND.cy) / POND.ry) ** 2);
  if (d > 0.82 && d < 1.35) return true;
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [x1, y1] = STREAM[i];
    const [x2, y2] = STREAM[i + 1];
    if (distanceToSegment(x, y, x1, y1, x2, y2) < 28) return true;
  }
  return false;
}

export function inField(px: number, py: number): boolean {
  return px >= FIELD.x && px < FIELD.x + FIELD.w && py >= FIELD.y && py < FIELD.y + FIELD.h;
}

export function fieldTile(px: number, py: number): { x: number; y: number } | null {
  if (!inField(px, py)) return null;
  return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
}

export function blocked(x: number, y: number, radius = PLAYER_RADIUS): boolean {
  const minX = 3.2 * TILE + radius;
  const maxX = 60.8 * TILE - radius;
  const minY = 5.1 * TILE + radius;
  const maxY = 41.6 * TILE - radius;
  if (x < minX || x > maxX || y < minY || y > maxY) return true;

  for (const rect of SOLID_RECTS) {
    if (x + radius > rect.x && x - radius < rect.x + rect.w && y + radius > rect.y && y - radius < rect.y + rect.h) {
      return true;
    }
  }
  for (const circle of SOLID_CIRCLES) {
    if (Math.hypot(x - circle.x, y - circle.y) < circle.r + radius) return true;
  }
  if (pointInEllipse(x, y, POND.cx, POND.cy, POND.rx - 2, POND.ry - 2)) return true;
  if (pointInEllipse(x, y, POND.cx, POND.cy, POND.rx + radius, POND.ry + radius) && pointInEllipse(x, y, POND.cx, POND.cy, POND.rx - radius, POND.ry - radius)) return true;

  for (let i = 0; i < STREAM.length - 1; i++) {
    const [x1, y1] = STREAM[i];
    const [x2, y2] = STREAM[i + 1];
    if (distanceToSegment(x, y, x1, y1, x2, y2) < 13 + radius) return true;
  }

  for (const fence of FENCE_SEGMENTS) {
    if (distanceToSegment(x, y, fence.x1, fence.y1, fence.x2, fence.y2) < 4 + radius) {
      const inGate =
        fence.y1 === fence.y2 &&
        fence.y1 > FENCE.y + 1 &&
        x > FENCE.gateX + 3 &&
        x < FENCE.gateX + FENCE.gateW - 3;
      if (!inGate) return true;
    }
  }
  return false;
}

/** Walkable test used by cats, who are allowed to slip through the gate. */
export function catBlocked(x: number, y: number): boolean {
  return blocked(x, y, 3);
}

export const INTERACT = {
  door: { x: HOUSE.door.x, y: HOUSE.door.y + 6, r: 26 },
  stand: { x: STAND.x, y: STAND.y - 1, r: 30 },
  well: { x: WELL.x, y: WELL.y, r: 34 },
  sign: { x: SIGN.x, y: SIGN.y, r: 22 },
};
