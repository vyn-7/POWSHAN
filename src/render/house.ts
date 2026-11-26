import { Bag } from '../core/rng';
import { createCanvas, context, dither, ellipse, linePx, px, rect, tinyText, type Ctx } from '../core/canvas';
import { C } from './palette';
import { softShadow } from './shadow';
import type { Sprite } from './nature';

const sprite = (canvas: HTMLCanvasElement): Sprite => ({ canvas, bx: canvas.width / 2, by: canvas.height });

function stoneBase(ctx: Ctx, x: number, y: number, w: number, h: number, seed = 3): void {
  const bag = new Bag(seed);
  rect(ctx, x, y, w, h, C.stoneDark);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, C.stone);
  let row = 0;
  for (let yy = y + 2; yy < y + h - 2; yy += 4) {
    const offset = row % 2 === 0 ? 0 : 5;
    for (let xx = x + 2 + offset; xx < x + w - 4; xx += 10) {
      const bw = Math.min(9, x + w - 3 - xx);
      if (bw <= 2) continue;
      rect(ctx, xx, yy, bw, 3, bag.chance(0.5) ? C.stoneWarm : C.stoneLight);
      px(ctx, xx, yy, C.stoneDark);
      px(ctx, xx + bw - 1, yy + 2, C.stoneDark);
    }
    row += 1;
  }
}

function windowFrame(ctx: Ctx, x: number, y: number, w: number, h: number, warm = false): void {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, C.inkSoft);
  rect(ctx, x, y, w, h, C.creamDeep);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, warm ? '#f2c36f' : '#5f7f8e');
  rect(ctx, x + 2, y + 2, w - 4, 3, warm ? '#ffd98d' : '#7b9ba6');
  rect(ctx, x + Math.floor(w / 2), y + 2, 1, h - 4, C.cream);
  rect(ctx, x + 2, y + Math.floor(h / 2), w - 4, 1, C.cream);
  px(ctx, x + 3, y + 3, warm ? '#fff0bd' : '#b6d3d6');
  rect(ctx, x, y + h, w, 1, C.inkSoft);
}

/* --------------------------------- house --------------------------------- */

export function makeHouse(): Sprite {
  const w = 128;
  const h = 122;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const cx = w / 2;
  const bag = new Bag(77);

  softShadow(ctx, cx, h - 11, 60, 6, 0.18);

  // ---- porch and steps ----
  rect(ctx, 20, 96, 88, 6, C.woodDark);
  rect(ctx, 22, 94, 84, 5, C.plank);
  for (let x = 24; x < 104; x += 8) rect(ctx, x, 95, 6, 3, bag.chance(0.5) ? C.wood : C.woodLight);
  rect(ctx, 48, 102, 32, 5, C.woodDark);
  rect(ctx, 49, 101, 30, 4, C.wood);
  rect(ctx, 52, 107, 24, 4, C.woodDark);
  rect(ctx, 53, 106, 22, 3, C.woodLight);

  // ---- walls ----
  rect(ctx, 14, 52, 100, 50, C.inkSoft);
  rect(ctx, 15, 53, 98, 48, '#e4c99c');
  dither(ctx, 17, 55, 94, 44, '#d7b98a', 9, 14, 0.35);
  dither(ctx, 17, 55, 94, 22, '#eed7ae', 11, 21, 0.3);

  // timber frame
  rect(ctx, 14, 52, 3, 50, C.woodDark);
  rect(ctx, 111, 52, 3, 50, C.woodDark);
  rect(ctx, 14, 52, 100, 3, C.woodDark);
  rect(ctx, 16, 54, 96, 1, C.woodLight);
  rect(ctx, 14, 98, 100, 4, C.woodDark);
  rect(ctx, 16, 98, 96, 1, C.woodLight);
  rect(ctx, 44, 54, 2, 44, C.woodDark);
  rect(ctx, 82, 54, 2, 44, C.woodDark);

  // ---- roof ----
  const roofTop = 18;
  const roofBottom = 58;
  const topHalf = 38;
  const bottomHalf = 58;
  for (let y = roofTop; y < roofBottom; y++) {
    const t = (y - roofTop) / (roofBottom - roofTop);
    const half = Math.round(topHalf + (bottomHalf - topHalf) * t);
    rect(ctx, cx - half, y, half * 2, 1, t > 0.82 ? C.roofDark : C.roof);
  }
  // shingle rows
  let row = 0;
  for (let y = roofTop + 3; y < roofBottom - 1; y += 5) {
    const t = (y - roofTop) / (roofBottom - roofTop);
    const half = Math.round(topHalf + (bottomHalf - topHalf) * t) - 1;
    const offset = row % 2 === 0 ? 0 : 5;
    for (let x = cx - half - offset; x < cx + half; x += 10) {
      const x0 = Math.max(cx - half, x);
      const x1 = Math.min(cx + half, x + 9);
      if (x1 - x0 < 3) continue;
      const shade = bag.chance(0.18) ? C.roofDarker : bag.chance(0.5) ? C.roof : C.roofLight;
      rect(ctx, x0, y, x1 - x0, 1, shade);
      if (bag.chance(0.6)) {
        rect(ctx, x0 + 1, y + 1, Math.max(1, x1 - x0 - 3), 1, C.roofDark);
      }
    }
    row += 1;
  }
  // ridge and eaves
  rect(ctx, cx - topHalf - 2, roofTop - 2, topHalf * 2 + 4, 4, C.roofDarker);
  rect(ctx, cx - topHalf - 1, roofTop - 1, topHalf * 2 + 2, 1, C.roofEdge);
  rect(ctx, cx - bottomHalf - 2, roofBottom - 1, bottomHalf * 2 + 4, 3, C.roofDarker);
  rect(ctx, cx - bottomHalf - 2, roofBottom + 1, bottomHalf * 2 + 4, 2, 'rgba(43,30,22,0.25)');
  // moss and a shingle patch
  dither(ctx, 28, 33, 24, 12, '#6f8c4b', 7, 5, 0.3);
  dither(ctx, 88, 44, 18, 8, '#6f8c4b', 8, 9, 0.25);
  rect(ctx, 50, 26, 5, 3, C.roofDarker);
  px(ctx, 52, 25, C.roofEdge);

  // ---- chimney ----
  stoneBase(ctx, 88, 4, 16, 24, 8);
  rect(ctx, 87, 2, 18, 4, C.stoneDark);
  rect(ctx, 88, 2, 16, 2, C.stoneLight);
  rect(ctx, 90, 5, 12, 2, C.stoneDark);

  // ---- gable vents ----
  rect(ctx, 60, 42, 8, 8, C.woodDark);
  rect(ctx, 61, 43, 6, 6, '#4c675c');
  rect(ctx, 62, 44, 4, 4, '#d8c39a');

  // ---- windows + flower boxes ----
  windowFrame(ctx, 22, 66, 18, 16);
  rect(ctx, 21, 82, 20, 3, C.woodDark);
  for (let x = 22; x < 40; x += 4) {
    rect(ctx, x, 78, 1, 4, C.leaf[1]);
    rect(ctx, x - 1, 77, 2, 2, bag.chance(0.5) ? C.flower[0] : C.flower[1]);
  }
  windowFrame(ctx, 88, 66, 18, 16);
  rect(ctx, 87, 82, 20, 3, C.woodDark);
  for (let x = 88; x < 106; x += 4) {
    rect(ctx, x, 78, 1, 4, C.leaf[1]);
    rect(ctx, x - 1, 77, 2, 2, bag.chance(0.5) ? C.flower[4] : C.blossom);
  }

  // ---- door ----
  rect(ctx, 53, 62, 22, 38, C.inkSoft);
  rect(ctx, 54, 63, 20, 36, C.woodDark);
  for (let x = 56; x < 73; x += 5) rect(ctx, x, 64, 4, 34, C.wood);
  rect(ctx, 54, 63, 20, 2, C.woodLight);
  rect(ctx, 57, 68, 14, 10, C.creamDeep);
  rect(ctx, 58, 69, 12, 8, '#6b8a92');
  rect(ctx, 59, 70, 10, 2, '#9fbdba');
  rect(ctx, 64, 69, 1, 8, C.cream);
  px(ctx, 70, 88, C.gold);
  px(ctx, 70, 89, C.goldDeep);
  rect(ctx, 53, 98, 22, 2, C.woodDarker);
  // wreath
  ellipse(ctx, 64, 74, 3, 3, C.leaf[1]);
  ellipse(ctx, 64, 74, 1.6, 1.6, '#6b8a92');
  px(ctx, 61, 72, C.rose);
  px(ctx, 66, 76, C.rose);

  // ---- climbing rose ----
  linePx(ctx, 20, 98, 18, 84, C.leaf[0]);
  linePx(ctx, 18, 84, 24, 72, C.leaf[0]);
  linePx(ctx, 24, 72, 20, 62, C.leaf[0]);
  for (let i = 0; i < 9; i++) {
    px(ctx, 18 + bag.int(0, 6), 64 + bag.int(0, 32), C.leaf[2]);
    if (i % 2 === 0) px(ctx, 18 + bag.int(0, 6), 64 + bag.int(0, 32), bag.chance(0.5) ? C.rose : C.blossom);
  }

  // ---- porch posts, lantern, bench ----
  rect(ctx, 18, 84, 3, 16, C.woodDark);
  rect(ctx, 107, 84, 3, 16, C.woodDark);
  rect(ctx, 16, 82, 7, 2, C.wood);
  rect(ctx, 105, 82, 7, 2, C.wood);
  rect(ctx, 60, 88, 8, 1, C.woodDark);
  rect(ctx, 60, 88, 1, 4, C.woodDark);
  rect(ctx, 62, 92, 4, 4, C.ink);
  px(ctx, 63, 93, '#f7d488');
  px(ctx, 64, 94, '#f2b95e');

  // ---- little house number / plaque ----
  rect(ctx, 74, 58, 8, 5, C.woodLight);
  px(ctx, 75, 59, C.woodDark);
  px(ctx, 77, 60, C.woodDark);
  px(ctx, 79, 59, C.woodDark);

  // ---- weather vane on the ridge ----
  rect(ctx, 40, 8, 1, 9, C.inkSoft);
  rect(ctx, 37, 9, 7, 1, C.inkSoft);
  px(ctx, 36, 8, C.inkSoft);
  px(ctx, 44, 8, C.inkSoft);
  rect(ctx, 38, 8, 5, 2, C.goldDeep);

  return sprite(canvas);
}

/* ------------------------------- seed stand ------------------------------- */

export function makeStand(): Sprite {
  const w = 58;
  const h = 56;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(41);
  softShadow(ctx, w / 2, h - 1, 26, 4, 0.18);

  // posts
  rect(ctx, 6, 18, 3, 34, C.woodDark);
  rect(ctx, 49, 18, 3, 34, C.woodDark);
  rect(ctx, 7, 19, 1, 32, C.woodLight);
  rect(ctx, 50, 19, 1, 32, C.woodLight);

  // awning
  for (let x = 2; x < 56; x += 8) {
    rect(ctx, x, 10, 8, 9, x % 16 === 2 ? C.cream : C.rose);
    rect(ctx, x, 17, 8, 2, x % 16 === 2 ? C.creamDeep : '#a95144');
  }
  rect(ctx, 2, 8, 54, 3, C.inkSoft);
  rect(ctx, 3, 8, 52, 1, C.cream);
  for (let x = 4; x < 54; x += 8) {
    linePx(ctx, x, 19, x + 2, 22, C.creamDeep);
  }

  // counter
  rect(ctx, 7, 30, 44, 20, C.woodDark);
  rect(ctx, 8, 31, 42, 17, C.wood);
  for (let x = 10; x < 49; x += 5) rect(ctx, x, 32, 4, 15, bag.chance(0.5) ? C.wood : C.woodLight);
  rect(ctx, 7, 47, 44, 3, C.woodDarker);

  // seed crates on the counter
  rect(ctx, 13, 23, 11, 8, C.woodDark);
  rect(ctx, 14, 24, 9, 6, C.woodLight);
  rect(ctx, 15, 24, 7, 2, '#c8a24c');
  rect(ctx, 33, 23, 12, 8, C.woodDark);
  rect(ctx, 34, 24, 10, 6, C.woodLight);
  rect(ctx, 35, 24, 8, 2, '#8db05a');

  // hanging sign
  rect(ctx, 18, 3, 22, 7, C.woodDark);
  rect(ctx, 19, 4, 20, 5, C.creamDeep);
  tinyText(ctx, 'SEEDS', 21, 5, C.ink, 1);

  // little sack and watering can
  ellipse(ctx, 27, 28, 3, 4, C.creamDeep);
  px(ctx, 27, 23, C.woodDark);
  rect(ctx, 44, 24, 5, 5, C.stoneDark);
  rect(ctx, 45, 25, 3, 3, C.stone);
  rect(ctx, 49, 26, 2, 1, C.stoneDark);

  // flowers at the feet
  for (let i = 0; i < 4; i++) {
    const x = 10 + i * 12 + bag.int(-2, 2);
    rect(ctx, x, 48, 1, 4, C.leaf[1]);
    px(ctx, x - 1, 47, bag.pick(C.flower));
    px(ctx, x + 1, 47, bag.pick(C.flower));
  }
  return sprite(canvas);
}

/* ---------------------------------- well ---------------------------------- */

export function makeWell(awake = false): Sprite {
  const w = 54;
  const h = 62;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(9);
  softShadow(ctx, w / 2, h - 1, 24, 4, 0.18);

  // posts and roof
  rect(ctx, 8, 22, 3, 28, C.woodDark);
  rect(ctx, 43, 22, 3, 28, C.woodDark);
  for (let y = 6; y < 22; y += 4) {
    const half = 12 + Math.round((y - 6) * 1.1);
    rect(ctx, 27 - half, y, half * 2, 4, y % 8 === 2 ? C.roof : C.roofLight);
    rect(ctx, 27 - half, y + 3, half * 2, 1, C.roofDark);
  }
  rect(ctx, 12, 4, 30, 3, C.roofDarker);
  rect(ctx, 13, 4, 28, 1, C.roofEdge);

  // stone ring
  ellipse(ctx, 27, 50, 18, 8, C.stoneDark);
  rect(ctx, 9, 48, 36, 10, C.stoneDark);
  ellipse(ctx, 27, 58, 18, 8, C.stoneDark);
  ellipse(ctx, 27, 48, 16, 6.5, C.stone);
  ellipse(ctx, 27, 47, 13, 5, awake ? C.waterDeep : '#423326');
  if (awake) {
    ellipse(ctx, 27, 47, 10, 3.5, C.water);
    px(ctx, 23, 46, C.waterShimmer);
    px(ctx, 30, 47, C.waterLight);
  } else {
    dither(ctx, 17, 44, 20, 6, '#5a4430', 5, 3, 0.4);
  }
  // stone blocks around the rim
  let row = 0;
  for (let yy = 51; yy < 60; yy += 4) {
    for (let xx = 10 + (row % 2) * 5; xx < 44; xx += 10) {
      rect(ctx, xx, yy, 8, 3, bag.chance(0.5) ? C.stoneWarm : C.stoneLight);
      px(ctx, xx, yy, C.stoneDark);
    }
    row += 1;
  }
  ellipse(ctx, 27, 60, 17, 4, C.stoneDark);

  // bucket on a rope
  rect(ctx, 26, 18, 1, 16, '#b9a67e');
  rect(ctx, 24, 34, 7, 6, C.woodDark);
  rect(ctx, 25, 35, 5, 4, C.wood);
  rect(ctx, 25, 36, 5, 1, C.woodLight);
  if (awake) {
    px(ctx, 27, 40, C.waterLight);
    px(ctx, 29, 41, C.waterFoam);
  }

  // moss and flowers
  for (let i = 0; i < 10; i++) {
    px(ctx, bag.int(10, 44), bag.int(50, 61), bag.chance(0.5) ? C.leaf[1] : C.leafDark);
  }
  for (let i = 0; i < 5; i++) {
    const x = bag.int(8, 46);
    rect(ctx, x, 59, 1, 3, C.leaf[1]);
    px(ctx, x - 1, 58, bag.pick([C.flower[0], C.blossom, C.flower[4]]));
  }
  // handle
  rect(ctx, 42, 28, 5, 2, C.woodDark);
  rect(ctx, 45, 28, 2, 4, C.wood);
  return sprite(canvas);
}

/* --------------------------------- bench ---------------------------------- */

export function makeBench(): Sprite {
  const w = 46;
  const h = 24;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  softShadow(ctx, w / 2, h - 1, 21, 3, 0.18);
  rect(ctx, 4, 9, 38, 3, C.woodDark);
  rect(ctx, 5, 8, 36, 2, C.woodLight);
  rect(ctx, 4, 3, 3, 16, C.woodDark);
  rect(ctx, 39, 3, 3, 16, C.woodDark);
  rect(ctx, 5, 3, 34, 3, C.wood);
  rect(ctx, 6, 3, 32, 1, C.woodLight);
  rect(ctx, 6, 17, 34, 3, C.woodDark);
  rect(ctx, 7, 16, 32, 2, C.wood);
  rect(ctx, 9, 20, 2, 3, C.woodDarker);
  rect(ctx, 35, 20, 2, 3, C.woodDarker);
  // moss
  px(ctx, 12, 15, C.leaf[1]);
  px(ctx, 13, 15, C.leaf[2]);
  px(ctx, 30, 7, C.leaf[1]);
  return sprite(canvas);
}

/* ---------------------------------- sign ---------------------------------- */

export function makeSign(): Sprite {
  const w = 28;
  const h = 34;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  softShadow(ctx, w / 2, h - 1, 10, 3, 0.18);
  rect(ctx, 13, 12, 2, 20, C.woodDark);
  rect(ctx, 14, 13, 1, 18, C.wood);
  rect(ctx, 3, 4, 22, 13, C.inkSoft);
  rect(ctx, 4, 5, 20, 10, C.woodLight);
  rect(ctx, 4, 5, 20, 1, '#c99a62');
  for (let i = 0; i < 3; i++) px(ctx, 5 + i * 6, 14, C.woodDark);
  // a painted leaf
  rect(ctx, 12, 7, 5, 4, C.leaf[2]);
  px(ctx, 11, 8, C.leaf[1]);
  px(ctx, 12, 11, C.leaf[0]);
  // worn text lines
  rect(ctx, 7, 9, 3, 1, C.woodDark);
  rect(ctx, 19, 9, 3, 1, C.woodDark);
  return sprite(canvas);
}

/* -------------------------------- lantern --------------------------------- */

export function makeLantern(): Sprite {
  const w = 12;
  const h = 30;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  softShadow(ctx, 6, h - 1, 4, 2, 0.18);
  rect(ctx, 5, 10, 2, 19, C.woodDark);
  rect(ctx, 6, 11, 1, 17, C.wood);
  rect(ctx, 2, 9, 8, 2, C.woodDark);
  rect(ctx, 3, 3, 6, 7, C.inkSoft);
  rect(ctx, 4, 4, 4, 5, '#5b4634');
  rect(ctx, 5, 5, 2, 3, '#f7d488');
  rect(ctx, 4, 2, 4, 2, C.inkSoft);
  rect(ctx, 3, 10, 6, 1, C.woodDark);
  return sprite(canvas);
}

/* -------------------------------- beehive --------------------------------- */

export function makeBeehive(seed = 1): Sprite {
  const w = 18;
  const h = 25;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  softShadow(ctx, w / 2, h - 1, 7, 2, 0.18);
  rect(ctx, 4, 19, 10, 5, C.woodDark);
  rect(ctx, 5, 20, 8, 3, C.wood);
  rect(ctx, 2, 6, 14, 13, C.inkSoft);
  rect(ctx, 3, 7, 12, 11, '#d8aa55');
  for (let y = 9; y < 18; y += 3) {
    rect(ctx, 3, y, 12, 1, '#b98a3f');
    rect(ctx, 3, y + 1, 12, 1, '#e9c879');
  }
  rect(ctx, 2, 4, 14, 3, C.woodDark);
  rect(ctx, 3, 3, 12, 2, C.wood);
  rect(ctx, 7, 15, 4, 2, C.inkSoft);
  for (let i = 0; i < 4; i++) {
    const x = bag.int(0, w - 1);
    const y = bag.int(0, 12);
    px(ctx, x, y, bag.chance(0.5) ? C.ink : C.gold);
  }
  return sprite(canvas);
}

/* ------------------------------- scarecrow -------------------------------- */

export function makeScarecrow(): Sprite {
  const w = 26;
  const h = 40;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(63);
  softShadow(ctx, w / 2, h - 1, 8, 2, 0.18);
  rect(ctx, 12, 14, 3, 24, C.woodDark);
  rect(ctx, 3, 20, 21, 3, C.woodDark);
  rect(ctx, 4, 19, 19, 2, C.wood);
  // shirt
  rect(ctx, 6, 17, 14, 12, '#b65a43');
  rect(ctx, 7, 18, 12, 4, '#d77b60');
  rect(ctx, 6, 27, 14, 2, '#8f4131');
  px(ctx, 10, 23, C.cream);
  px(ctx, 15, 22, C.cream);
  rect(ctx, 2, 18, 3, 3, '#d9b566');
  rect(ctx, 21, 18, 3, 3, '#d9b566');
  // head
  rect(ctx, 8, 8, 10, 9, C.creamDeep);
  rect(ctx, 9, 9, 8, 7, '#e8cba0');
  px(ctx, 10, 11, C.inkSoft);
  px(ctx, 15, 11, C.inkSoft);
  rect(ctx, 11, 14, 4, 1, C.inkSoft);
  px(ctx, 12, 15, C.inkSoft);
  // hat
  rect(ctx, 5, 6, 16, 2, C.hat);
  rect(ctx, 8, 3, 10, 4, C.hatShade);
  rect(ctx, 9, 3, 8, 2, C.hatLight);
  rect(ctx, 8, 6, 10, 1, C.hatBand);
  // a crow
  rect(ctx, 19, 4, 3, 2, C.ink);
  px(ctx, 22, 4, C.gold);
  px(ctx, 20, 3, C.ink);
  // straw
  for (let i = 0; i < 6; i++) px(ctx, bag.int(5, 21), 30 + bag.int(0, 5), C.hat);
  return sprite(canvas);
}

/* ------------------------------ small props ------------------------------- */

export function makeBarrel(): Sprite {
  const canvas = createCanvas(14, 18);
  const ctx = context(canvas);
  softShadow(ctx, 7, 17, 5, 2, 0.18);
  rect(ctx, 3, 3, 8, 13, C.woodDark);
  rect(ctx, 4, 4, 6, 11, C.wood);
  rect(ctx, 4, 5, 1, 9, C.woodLight);
  rect(ctx, 3, 6, 8, 1, C.inkSoft);
  rect(ctx, 3, 12, 8, 1, C.inkSoft);
  ellipse(ctx, 7, 3, 4, 1.5, C.woodLight);
  return sprite(canvas);
}

export function makeCrate(): Sprite {
  const canvas = createCanvas(16, 14);
  const ctx = context(canvas);
  softShadow(ctx, 8, 13, 6, 2, 0.18);
  rect(ctx, 2, 3, 12, 9, C.woodDark);
  rect(ctx, 3, 4, 10, 7, C.woodLight);
  rect(ctx, 4, 5, 8, 1, C.wood);
  rect(ctx, 4, 9, 8, 1, C.wood);
  rect(ctx, 7, 4, 2, 7, C.wood);
  return sprite(canvas);
}

export function makeMilkCan(): Sprite {
  const canvas = createCanvas(10, 14);
  const ctx = context(canvas);
  softShadow(ctx, 5, 13, 3, 1.5, 0.18);
  rect(ctx, 3, 3, 4, 9, C.stone);
  rect(ctx, 4, 4, 2, 7, C.stoneLight);
  rect(ctx, 2, 6, 6, 4, C.stone);
  rect(ctx, 3, 6, 4, 1, C.stoneLight);
  rect(ctx, 3, 1, 4, 2, C.stoneDark);
  return sprite(canvas);
}

export function makeBucket(): Sprite {
  const canvas = createCanvas(9, 9);
  const ctx = context(canvas);
  rect(ctx, 2, 2, 5, 6, C.woodDark);
  rect(ctx, 3, 3, 3, 4, C.wood);
  rect(ctx, 2, 2, 5, 1, C.stoneDark);
  return sprite(canvas);
}

export function makeClothesline(): Sprite {
  const w = 56;
  const h = 34;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  softShadow(ctx, w / 2, h - 1, 24, 2.5, 0.18);
  rect(ctx, 4, 10, 2, 22, C.woodDark);
  rect(ctx, 50, 10, 2, 22, C.woodDark);
  rect(ctx, 5, 11, 1, 20, C.wood);
  rect(ctx, 51, 11, 1, 20, C.wood);
  linePx(ctx, 5, 12, 50, 15, '#cbb38a');
  const cloths = [
    { x: 9, c: C.cream, w: 8, h: 12 },
    { x: 21, c: C.denimLight, w: 7, h: 10 },
    { x: 33, c: C.rose, w: 8, h: 11 },
    { x: 44, c: C.creamDeep, w: 5, h: 9 },
  ];
  for (const cloth of cloths) {
    const drop = Math.round(((cloth.x - 5) / 45) * 3);
    rect(ctx, cloth.x, 12 + drop, cloth.w, cloth.h, cloth.c);
    rect(ctx, cloth.x, 12 + drop, cloth.w, 1, C.cream);
    px(ctx, cloth.x + 1, 12 + drop + 1, C.woodDark);
    px(ctx, cloth.x + cloth.w - 2, 12 + drop + 1, C.woodDark);
    rect(ctx, cloth.x, 20 + drop, cloth.w, 2, 'rgba(43,30,22,0.12)');
  }
  return sprite(canvas);
}

export function makeMailbox(): Sprite {
  const canvas = createCanvas(14, 22);
  const ctx = context(canvas);
  softShadow(ctx, 7, 21, 4, 2, 0.18);
  rect(ctx, 6, 10, 2, 10, C.woodDark);
  rect(ctx, 2, 4, 10, 7, C.inkSoft);
  rect(ctx, 3, 5, 8, 5, C.denim);
  rect(ctx, 3, 5, 8, 1, C.denimLight);
  px(ctx, 11, 7, C.rose);
  rect(ctx, 3, 8, 2, 1, C.cream);
  return sprite(canvas);
}

export function makeStones(seed = 1): Sprite {
  const w = 24;
  const h = 10;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  for (let i = 0; i < 5; i++) {
    let x = 0;
    let y = 0;
    do {
      x = bag.int(2, w - 5);
      y = bag.int(4, h - 3);
    } while (Math.hypot(x - 12, y - 5) < 3);
    ellipse(ctx, x, y, bag.float(1.5, 3), bag.float(1, 2), bag.chance(0.5) ? C.stone : C.stoneLight);
    px(ctx, x - 1, y - 1, C.stoneLight);
  }
  return sprite(canvas);
}

/** Painted directly into the ground pass, so the fence never floats. */
export function paintFence(
  ctx: Ctx,
  segments: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  gate: { x: number; y: number; w: number },
): void {
  const post = (x: number, y: number, tall = 0): void => {
    rect(ctx, x - 2, y - 11 - tall, 4, 12 + tall, C.woodDark);
    rect(ctx, x - 1, y - 10 - tall, 2, 10 + tall, C.wood);
    rect(ctx, x - 1, y - 10 - tall, 1, 8 + tall, C.woodLight);
    px(ctx, x, y, C.woodDarker);
  };

  for (const seg of segments) {
    const horizontal = Math.abs(seg.y2 - seg.y1) < 1;
    if (horizontal) {
      const step = 16;
      const dir = seg.x2 > seg.x1 ? 1 : -1;
      for (let x = seg.x1; dir > 0 ? x <= seg.x2 : x >= seg.x2; x += step * dir) post(x, seg.y1);
      const start = Math.min(seg.x1, seg.x2);
      const end = Math.max(seg.x1, seg.x2);
      for (let x = start; x < end; x += 8) {
        rect(ctx, x, seg.y1 - 8, Math.min(8, end - x), 2, C.wood);
        rect(ctx, x, seg.y1 - 4, Math.min(8, end - x), 2, C.wood);
        rect(ctx, x, seg.y1 - 8, Math.min(8, end - x), 1, C.woodLight);
        px(ctx, x, seg.y1 - 7, C.woodDark);
      }
    } else {
      const step = 16;
      const dir = seg.y2 > seg.y1 ? 1 : -1;
      for (let y = seg.y1; dir > 0 ? y <= seg.y2 : y >= seg.y2; y += step * dir) post(seg.x1, y);
      const start = Math.min(seg.y1, seg.y2);
      const end = Math.max(seg.y1, seg.y2);
      for (let y = start + 8; y < end - 2; y += 8) {
        rect(ctx, seg.x1 - 1, y - 8, 2, 7, C.wood);
        rect(ctx, seg.x1 - 1, y - 8, 1, 7, C.woodLight);
        px(ctx, seg.x1 + 1, y - 6, C.woodDark);
      }
    }
  }

  // stone posts and an open gate
  rect(ctx, gate.x - 4, gate.y - 16, 5, 18, C.inkSoft);
  rect(ctx, gate.x - 3, gate.y - 15, 3, 16, C.stone);
  rect(ctx, gate.x - 3, gate.y - 15, 1, 14, C.stoneLight);
  rect(ctx, gate.x + gate.w - 1, gate.y - 16, 5, 18, C.inkSoft);
  rect(ctx, gate.x + gate.w, gate.y - 15, 3, 16, C.stone);
  rect(ctx, gate.x + gate.w, gate.y - 15, 1, 14, C.stoneLight);
  // leaning gate leaf
  linePx(ctx, gate.x + 2, gate.y - 4, gate.x + 9, gate.y - 14, C.woodDark);
  linePx(ctx, gate.x + 3, gate.y - 4, gate.x + 10, gate.y - 14, C.wood);
  rect(ctx, gate.x + 8, gate.y - 15, 3, 2, C.woodDark);
  // welcome flowers by the gate
  for (let i = 0; i < 3; i++) {
    const x = gate.x - 8 + i * 4;
    rect(ctx, x, gate.y - 4, 1, 4, C.leaf[1]);
    px(ctx, x - 1, gate.y - 5, C.flower[i % C.flower.length]);
  }
}
