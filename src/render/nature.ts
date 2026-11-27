import { Bag } from '../core/rng';
import { createCanvas, context, ellipse, leafyBlob, linePx, px, rect, type Ctx } from '../core/canvas';
import { C } from './palette';
import { softShadow } from './shadow';

export interface Sprite {
  canvas: HTMLCanvasElement;
  /** Base point sits bottom-centre, in sprite pixels. */
  bx: number;
  by: number;
  /** Destination size relative to the canvas' own pixels. Characters paint at
   *  2x detail and draw at 0.5 so their footprint stays on the world grid. */
  scale?: number;
}

const sprite = (canvas: HTMLCanvasElement): Sprite => ({ canvas, bx: canvas.width / 2, by: canvas.height });

export function drawAtBase(ctx: Ctx, sprite: Sprite, x: number, y: number, flip = false): void {
  const scale = sprite.scale ?? 1;
  const width = sprite.canvas.width * scale;
  const height = sprite.canvas.height * scale;
  const dx = Math.round(x - sprite.bx * scale);
  const dy = Math.round(y - sprite.by * scale);
  if (flip) {
    ctx.save();
    ctx.translate(dx + width, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite.canvas, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(sprite.canvas, dx, dy, width, height);
  }
}

function trunk(ctx: Ctx, cx: number, bottom: number, height: number, width: number, seed: number): void {
  const bag = new Bag(seed);
  const left = cx - Math.floor(width / 2);
  rect(ctx, left, bottom - height, width, height, C.woodDark);
  rect(ctx, left + 1, bottom - height + 1, width - 2, height - 2, C.wood);
  rect(ctx, left + 1, bottom - height + 2, 2, height - 4, C.woodLight);
  for (let i = 0; i < 5; i++) {
    px(ctx, left + bag.int(2, width - 2), bottom - bag.int(2, height - 2), C.woodDark);
  }
  // roots
  rect(ctx, left - 3, bottom - 3, 4, 3, C.woodDark);
  rect(ctx, left + width - 1, bottom - 3, 4, 3, C.woodDark);
  rect(ctx, left - 1, bottom - 2, 2, 2, C.wood);
  rect(ctx, left + width - 1, bottom - 2, 2, 2, C.wood);
}

function oakCanopy(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number): void {
  const bag = new Bag(seed);
  const blobs: Array<[number, number, number, number]> = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + bag.float(-0.2, 0.2);
    const dist = bag.float(0.32, 0.72);
    blobs.push([
      cx + Math.cos(angle) * rx * dist,
      cy + Math.sin(angle) * ry * dist * 0.82,
      rx * bag.float(0.3, 0.46),
      ry * bag.float(0.36, 0.52),
    ]);
  }
  blobs.push([cx, cy, rx * 0.55, ry * 0.52]);

  // dark silhouette
  for (const [x, y, r1, r2] of blobs) leafyBlob(ctx, x, y, r1 + 2, r2 + 2, C.leafDark, seed + Math.round(x + y));
  // body
  for (const [x, y, r1, r2] of blobs) leafyBlob(ctx, x, y, r1, r2, bag.chance(0.5) ? C.leaf[1] : C.leaf[2], seed + Math.round(x * 2 + y));
  // light from the top-left
  for (const [x, y, r1, r2] of blobs) {
    if (bag.chance(0.55)) {
      leafyBlob(ctx, x - r1 * 0.18, y - r2 * 0.22, r1 * 0.52, r2 * 0.46, C.leaf[3], seed + Math.round(x * 3 + y));
    }
  }
  for (let i = 0; i < 14; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.15, 0.78);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d * 0.8;
    leafyBlob(ctx, x, y, bag.float(3, 7), bag.float(2, 5), C.leafLight, seed + i * 7);
  }
  // leaf speckle + a few deep gaps
  for (let i = 0; i < 46; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.2, 1);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d * 0.84;
    px(ctx, x, y, bag.chance(0.55) ? C.leaf[4] : C.leafPale);
  }
  for (let i = 0; i < 9; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.25, 0.85);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d * 0.8;
    leafyBlob(ctx, x, y, bag.float(2, 4), bag.float(1.5, 3), C.leafDark, seed + 300 + i);
  }
  // hanging leaves along the underside
  for (let i = 0; i < 10; i++) {
    const x = cx + bag.float(-rx * 0.9, rx * 0.9);
    const y = cy + ry * bag.float(0.45, 0.92);
    rect(ctx, x, y, 2, 3, bag.chance(0.5) ? C.leaf[0] : C.leaf[1]);
  }
}

export function makeTree(kind: 'oak' | 'fir' | 'birch' | 'apple', scale: number, seed: number): Sprite {
  const bag = new Bag(seed);
  const baseW = kind === 'fir' ? 54 : kind === 'birch' ? 46 : kind === 'apple' ? 52 : 68;
  const baseH = kind === 'fir' ? 94 : kind === 'birch' ? 76 : kind === 'apple' ? 66 : 84;
  const w = Math.round(baseW * scale);
  const h = Math.round(baseH * scale);
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const cx = Math.round(w / 2);
  const bottom = h - 2;

  softShadow(ctx, cx, h - 1, w * 0.28, Math.max(3, 4 * scale));

  if (kind === 'fir') {
    trunk(ctx, cx, bottom, h * 0.28, Math.max(4, 5 * scale), seed);
    const tiers = 6;
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers;
      const y = Math.round(h * (0.16 + t * 0.58));
      const half = Math.round(w * (0.12 + t * 0.38));
      ctx.fillStyle = C.leaf[0];
      for (let yy = 0; yy < Math.round(h * 0.15); yy++) {
        const span = Math.round(half * (1 - yy / (h * 0.15)));
        ctx.fillRect(cx - span, y + yy, span * 2, 1);
      }
      ctx.fillStyle = C.leaf[2];
      for (let yy = 1; yy < Math.round(h * 0.15); yy += 2) {
        const span = Math.round(half * (1 - yy / (h * 0.15))) - 1;
        ctx.fillRect(cx - span, y + yy, span * 2, 1);
      }
      linePx(ctx, cx - 2, y - 2, cx, y + 3, C.leafDark);
    }
    // tip
    leafyBlob(ctx, cx, h * 0.13, w * 0.13, h * 0.06, C.leaf[1], seed);
    leafyBlob(ctx, cx - 2, h * 0.115, w * 0.08, h * 0.035, C.leaf[3], seed + 4);
    return sprite(canvas);
  }

  if (kind === 'birch') {
    const tw = Math.max(4, Math.round(4 * scale));
    const th = Math.round(h * 0.52);
    rect(ctx, cx - tw / 2, bottom - th, tw, th, '#d9d2bd');
    rect(ctx, cx - tw / 2 + 1, bottom - th, 1, th, '#f1ead6');
    for (let i = 0; i < 7; i++) {
      const y = bottom - bag.float(4, th - 2);
      const x = cx - tw / 2 + bag.int(0, tw - 1);
      rect(ctx, x, y, Math.min(tw - (x - (cx - tw / 2)), bag.int(1, 2)), 1, '#443a2e');
    }
    linePx(ctx, cx - 1, bottom - th + 8, cx - w * 0.16, bottom - th - 4, C.woodDark);
    linePx(ctx, cx + 1, bottom - th + 12, cx + w * 0.15, bottom - th + 1, C.woodDark);
    const ccy = Math.round(h * 0.28);
    oakCanopy(ctx, cx, ccy, w * 0.44, h * 0.24, seed + 3);
    return sprite(canvas);
  }

  const trunkH = kind === 'apple' ? h * 0.36 : h * 0.42;
  trunk(ctx, cx, bottom, trunkH, Math.max(5, Math.round(7 * scale)), seed + 2);

  if (kind === 'apple') {
    linePx(ctx, cx, bottom - trunkH + 4, cx - w * 0.18, bottom - trunkH - 2, C.woodDark);
    linePx(ctx, cx, bottom - trunkH + 8, cx + w * 0.17, bottom - trunkH + 1, C.woodDark);
    oakCanopy(ctx, cx, Math.round(h * 0.32), w * 0.4, h * 0.28, seed + 7);
    for (let i = 0; i < 14; i++) {
      const a = bag.float(0, Math.PI * 2);
      const d = bag.float(0.35, 0.9);
      const x = cx + Math.cos(a) * w * 0.34 * d;
      const y = h * 0.32 + Math.sin(a) * h * 0.23 * d;
      rect(ctx, x, y, 2, 2, C.fruit);
      px(ctx, x + 1, y, '#e68b6c');
    }
    return sprite(canvas);
  }

  oakCanopy(ctx, cx, Math.round(h * 0.34), w * 0.47, h * 0.3, seed + 11);
  // a knot and a tiny mushroom at the foot, for the hand-made feel
  px(ctx, cx + 2, bottom - trunkH * 0.5, C.woodDarker);
  if (bag.chance(0.5)) {
    rect(ctx, cx + 5, bottom - 3, 3, 2, '#d39475');
    px(ctx, cx + 6, bottom - 4, '#e8b28e');
  }
  return sprite(canvas);
}

export function makeBush(scale = 1, seed = 1): Sprite {
  const w = Math.round(30 * scale);
  const h = Math.round(22 * scale);
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const cx = w / 2;
  softShadow(ctx, cx, h - 1, w * 0.4, 3);
  const bag = new Bag(seed);
  const blobs: Array<[number, number, number]> = [
    [cx - w * 0.22, h * 0.55, w * 0.26],
    [cx + w * 0.2, h * 0.52, w * 0.27],
    [cx, h * 0.42, w * 0.3],
    [cx - w * 0.05, h * 0.66, w * 0.32],
  ];
  for (const [x, y, r] of blobs) leafyBlob(ctx, x, y, r + 1, r * 0.78 + 1, C.leafDark, seed + Math.round(x));
  for (const [x, y, r] of blobs) leafyBlob(ctx, x, y, r, r * 0.72, bag.chance(0.5) ? C.leaf[1] : C.leaf[2], seed + Math.round(x * 2));
  for (const [x, y, r] of blobs) leafyBlob(ctx, x - r * 0.2, y - r * 0.35, r * 0.55, r * 0.4, C.leaf[3], seed + Math.round(x * 3));
  for (let i = 0; i < 3; i++) {
    px(ctx, cx + bag.float(-w * 0.3, w * 0.3), h * bag.float(0.35, 0.7), bag.chance(0.5) ? C.flower[0] : C.flower[4]);
  }
  return sprite(canvas);
}

export function makeFlowerBush(seed = 2): Sprite {
  const base = makeBush(0.9, seed);
  const ctx = context(base.canvas);
  const bag = new Bag(seed + 20);
  for (let i = 0; i < 7; i++) {
    const x = bag.float(8, base.canvas.width - 8);
    const y = bag.float(7, base.canvas.height - 7);
    rect(ctx, x, y, 2, 2, bag.chance(0.5) ? C.blossom : C.flower[0]);
    px(ctx, x, y, C.cream);
  }
  return base;
}

export function makeRock(scale = 1, seed = 1): Sprite {
  const w = Math.round(22 * scale);
  const h = Math.round(16 * scale);
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  softShadow(ctx, w / 2, h - 1, w * 0.42, 3);
  const bottom = h - 2;
  const points: Array<[number, number]> = [
    [w * 0.12, bottom],
    [w * 0.06, bottom - h * 0.3],
    [w * 0.24, bottom - h * 0.68],
    [w * 0.55, bottom - h * 0.78],
    [w * 0.84, bottom - h * 0.58],
    [w * 0.94, bottom - h * 0.22],
    [w * 0.82, bottom],
  ];
  ctx.fillStyle = C.stoneDark;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    linePx(ctx, x1, y1, x2, y2, C.stoneDark);
  }
  ctx.fillStyle = C.stone;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.stoneLight;
  ctx.beginPath();
  ctx.moveTo(points[1][0] + 2, points[1][1] + 2);
  ctx.lineTo(points[2][0], points[2][1] + 4);
  ctx.lineTo(points[3][0], points[3][1] + 4);
  ctx.lineTo(points[3][0] - 3, points[3][1] + h * 0.06);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 4; i++) px(ctx, bag.float(w * 0.2, w * 0.8), bag.float(h * 0.4, h * 0.8), C.stoneDark);
  return sprite(canvas);
}

export function makeStump(scale = 1, seed = 1): Sprite {
  const w = Math.round(20 * scale);
  const h = Math.round(16 * scale);
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  softShadow(ctx, w / 2, h - 1, w * 0.44, 3);
  rect(ctx, 3, h * 0.42, w - 6, h * 0.55, C.woodDark);
  rect(ctx, 4, h * 0.46, w - 8, h * 0.44, C.wood);
  ellipse(ctx, w / 2, h * 0.4, w * 0.42, h * 0.18, C.woodDark);
  ellipse(ctx, w / 2, h * 0.38, w * 0.36, h * 0.14, C.woodLight);
  ellipse(ctx, w / 2, h * 0.38, w * 0.19, h * 0.08, C.wood);
  px(ctx, w / 2, h * 0.38, C.woodDark);
  const bag = new Bag(seed);
  const bottom = h - 2;
  for (let i = 0; i < 3; i++) rect(ctx, bag.float(3, w - 5), h * 0.6, 1, 3, C.woodDark);
  rect(ctx, 2, bottom - 3, 4, 3, C.leaf[1]);
  return sprite(canvas);
}

export function makeWeed(seed = 1): Sprite {
  const w = 15;
  const h = 16;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  for (let i = 0; i < 7; i++) {
    const x = bag.int(3, 12);
    const top = bag.int(1, 7);
    linePx(ctx, x, h - 1, x + bag.int(-2, 2), top, bag.chance(0.5) ? C.leaf[1] : C.grassDark[0]);
  }
  for (let i = 0; i < 3; i++) {
    const x = bag.int(4, 11);
    ctx.fillStyle = i === 1 ? C.flower[0] : C.flower[3];
    ctx.fillRect(x, bag.int(2, 6), 2, 2);
  }
  px(ctx, 7, h - 3, C.leafDark);
  return sprite(canvas);
}

export function makeReeds(seed = 1): Sprite {
  const w = 18;
  const h = 28;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  for (let i = 0; i < 5; i++) {
    const x = bag.int(3, 15);
    const top = bag.int(4, 13);
    linePx(ctx, x, h - 1, x + bag.int(-2, 2), top, C.leaf[1]);
    if (i < 3) {
      rect(ctx, x - 1, top, 3, 5, C.wood);
      rect(ctx, x - 1, top, 2, 2, C.woodLight);
    }
  }
  return sprite(canvas);
}

export function makeLily(seed = 1): Sprite {
  const w = 16;
  const h = 8;
  const canvas = createCanvas(w, h);
  const ctx = context(canvas);
  const bag = new Bag(seed);
  ellipse(ctx, w / 2, h / 2, 6, 3, C.leafDark);
  ellipse(ctx, w / 2, h / 2 - 1, 5.5, 2.5, C.leaf[2]);
  ctx.fillStyle = C.water;
  ctx.fillRect(8, 5, 4, 2);
  if (bag.chance(0.6)) {
    rect(ctx, w / 2 + 2, 1, 2, 2, C.blossomLight);
    px(ctx, w / 2 + 2, 2, C.flower[0]);
  }
  return sprite(canvas);
}

export function makeCushion(): Sprite {
  const canvas = createCanvas(22, 11);
  const ctx = context(canvas);
  ellipse(ctx, 11, 7, 10, 4, C.rose);
  ellipse(ctx, 11, 5.5, 9, 3, '#d98a79');
  for (let i = 0; i < 3; i++) px(ctx, 6 + i * 4, 5, C.cream);
  px(ctx, 5, 9, C.inkSoft);
  px(ctx, 17, 9, C.inkSoft);
  return sprite(canvas);
}

/* ------------------------------- ground bits ------------------------------ */

export function paintTuft(ctx: Ctx, x: number, y: number, bag: Bag, tall = 1): void {
  const blades = bag.int(2, 4);
  for (let i = 0; i < blades; i++) {
    const bx = Math.round(x + bag.float(-3, 3));
    const bh = Math.round(bag.float(2, 5) * tall);
    linePx(ctx, bx, y, bx + bag.int(-1, 1), y - bh, bag.chance(0.7) ? C.grassDark[1] : C.grassLight);
  }
}

export function paintFlower(ctx: Ctx, x: number, y: number, bag: Bag): void {
  const stem = bag.int(2, 4);
  linePx(ctx, x, y, x, y - stem, C.grassDark[0]);
  const color = bag.pick(C.flower);
  px(ctx, x - 1, y - stem, color);
  px(ctx, x + 1, y - stem, color);
  px(ctx, x, y - stem - 1, color);
  px(ctx, x, y - stem + 1, color);
  px(ctx, x, y - stem, C.gold);
}

export function paintClover(ctx: Ctx, x: number, y: number, bag: Bag): void {
  const color = bag.pick([C.grassLight, C.leafPale, C.grassWhite]);
  px(ctx, x, y, color);
  px(ctx, x + 1, y, color);
  px(ctx, x, y + 1, color);
  px(ctx, x + 2, y + 1, color);
}

/** A pale wildflower with a long stem, used sparingly in the meadow. */
export function paintDaisy(ctx: Ctx, x: number, y: number): void {
  linePx(ctx, x, y, x, y - 5, C.grassDark[0]);
  rect(ctx, x - 1, y - 7, 3, 3, C.cream);
  px(ctx, x, y - 6, C.gold);
}

export function makeCattailCluster(seed: number): Sprite {
  return makeReeds(seed);
}
