import { Bag, valueNoise } from '../core/rng';
import { createCanvas, context, dither, ellipse, linePx, px, rect, type Ctx } from '../core/canvas';
import { C } from './palette';
import { paintFence } from './house';
import { paintClover, paintDaisy, paintFlower, paintTuft } from './nature';
import {
  BEEHIVES,
  FIELD,
  FENCE,
  FENCE_SEGMENTS,
  HOUSE,
  LANTERNS,
  PATHS,
  POND,
  SIGN,
  STAND,
  STREAM,
  TREES,
  WELL,
  WORLD_H,
  WORLD_W,
} from '../world/layout';

function grassDetail(ctx: Ctx, x: number, y: number, bag: Bag): void {
  // Broad strokes of light and shade, deliberately sparse so the meadow breathes.
  for (let i = 0; i < 2; i++) {
    if (!bag.chance(0.62)) continue;
    const cx = x + bag.int(1, 12);
    const cy = y + bag.int(1, 13);
    const w = bag.int(2, 5);
    rect(ctx, cx, cy, w, 1, bag.chance(0.55) ? C.grassDark[1] : C.grassLight);
    if (bag.chance(0.3)) px(ctx, cx + 1, cy + 1, C.grassShadow);
  }
  if (bag.chance(0.12)) paintTuft(ctx, x + bag.int(3, 13), y + bag.int(10, 16), bag);
  if (bag.chance(0.06)) paintClover(ctx, x + bag.int(3, 12), y + bag.int(4, 13), bag);
  if (bag.chance(0.035)) paintDaisy(ctx, x + bag.int(3, 12), y + bag.int(4, 12));
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** A continuous, dithered meadow. Noise is sampled every two pixels and
 *  resolved per pixel with an ordered dither, so the ground never tiles. */
const hexRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

function paintMeadowBase(ctx: Ctx): void {
  const image = ctx.createImageData(WORLD_W, WORLD_H);
  const data = image.data;
  const colors = C.grass.map(hexRgb);
  const cell = 2;
  for (let y = 0; y < WORLD_H; y += cell) {
    for (let x = 0; x < WORLD_W; x += cell) {
      const broad = valueNoise(x * 0.012, y * 0.012, 7);
      const fine = valueNoise(x * 0.048 + 14, y * 0.048 + 9, 11);
      const grain = valueNoise(x * 0.19 + 3, y * 0.19 + 5, 13);
      const value = Math.min(0.999, Math.max(0, broad * 0.56 + fine * 0.32 + grain * 0.12));
      const scaled = value * (colors.length - 1);
      const index = Math.floor(scaled);
      const fraction = scaled - index;
      for (let dy = 0; dy < cell && y + dy < WORLD_H; dy++) {
        for (let dx = 0; dx < cell && x + dx < WORLD_W; dx++) {
          const threshold = BAYER[(y + dy) % 4][(x + dx) % 4] / 16;
          const pick = fraction > threshold ? Math.min(colors.length - 1, index + 1) : index;
          const rgb = colors[pick];
          const offset = ((y + dy) * WORLD_W + (x + dx)) * 4;
          data[offset] = rgb[0];
          data[offset + 1] = rgb[1];
          data[offset + 2] = rgb[2];
          data[offset + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

function paintField(ctx: Ctx, bag: Bag): void {
  const { x, y, w, h } = FIELD;
  // The old field reads as a field before a single plot is tilled.
  ctx.fillStyle = 'rgba(83, 104, 52, 0.22)';
  ctx.fillRect(x, y, w, h);
  for (let row = 0; row < h; row += 16) {
    const yy = y + row + 11;
    for (let xx = x + 4; xx < x + w - 4; xx += 7) {
      if (!bag.chance(0.62)) continue;
      rect(ctx, xx, yy + bag.int(-1, 1), bag.int(2, 5), 1, 'rgba(68, 82, 42, 0.26)');
    }
    for (let xx = x + 6; xx < x + w - 6; xx += 9) {
      if (bag.chance(0.4)) px(ctx, xx, yy - 2, 'rgba(158, 176, 100, 0.2)');
    }
  }
  // worn earth along the fence line
  for (let xx = x; xx < x + w; xx += 3) {
    if (bag.chance(0.5)) px(ctx, xx, y + bag.int(0, 2), 'rgba(116, 91, 57, 0.28)');
    if (bag.chance(0.5)) px(ctx, xx, y + h - 1 - bag.int(0, 2), 'rgba(116, 91, 57, 0.3)');
  }
  for (let yy = y; yy < y + h; yy += 3) {
    if (bag.chance(0.5)) px(ctx, x + bag.int(0, 2), yy, 'rgba(116, 91, 57, 0.26)');
    if (bag.chance(0.5)) px(ctx, x + w - 1 - bag.int(0, 2), yy, 'rgba(116, 91, 57, 0.26)');
  }
  for (let i = 0; i < 58; i++) {
    const xx = bag.float(x + 3, x + w - 3);
    const yy = bag.float(y + 3, y + h - 3);
    if (bag.chance(0.55)) paintTuft(ctx, xx, yy, bag, 0.55);
    else if (bag.chance(0.3)) paintClover(ctx, xx, yy, bag);
  }
}

function softShadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, alpha: number): void {
  ctx.fillStyle = `rgba(42, 55, 30, ${alpha})`;
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.1))));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2, 1);
  }
}

interface PathSample {
  x: number;
  y: number;
  width: number;
  angle: number;
  distance: number;
}

function collectPathSamples(points: Array<[number, number]>, startDistance: number): PathSample[] {
  const samples: PathSample[] = [];
  let travelled = startDistance;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(2, Math.ceil(length / 2));
    const angle = Math.atan2(y2 - y1, x2 - x1);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const distance = travelled + length * t;
      const wobble = valueNoise(distance * 0.035 + 4, 9, 5) - 0.5;
      const width = 16.5 + wobble * 4.5;
      samples.push({
        x: x1 + (x2 - x1) * t,
        y: y1 + (y2 - y1) * t,
        width,
        angle,
        distance,
      });
    }
    travelled += length;
  }
  return samples;
}

/** Paint every path in shared passes (all edges, then all bodies) so crossings
 *  merge into one continuous lane instead of one path's dark rim cutting a seam
 *  across another. */
function paintPaths(ctx: Ctx, samples: PathSample[], bag: Bag): void {
  // Soft dark edge, then the packed earth body. Same samples, so no rings.
  for (const sample of samples) {
    ellipse(ctx, sample.x, sample.y, sample.width + 3, (sample.width + 3) * 0.84, C.pathDark);
  }
  for (const sample of samples) {
    ellipse(ctx, sample.x, sample.y, sample.width, sample.width * 0.84, C.path[1]);
  }

  // Long, subtle wear down the middle instead of regular dashes.
  for (let i = 0; i < samples.length; i += 12) {
    const sample = samples[i];
    if (!bag.chance(0.55)) continue;
    const along = bag.int(4, 9);
    const nx = Math.cos(sample.angle);
    const ny = Math.sin(sample.angle);
    linePx(ctx, sample.x - nx * along, sample.y - ny * along, sample.x + nx * along, sample.y + ny * along, '#d6b783');
  }

  // Mottled earth, small stones and grass creeping over the edges.
  for (const sample of samples) {
    if (bag.chance(0.16)) {
      const side = bag.float(-sample.width * 0.62, sample.width * 0.62);
      const x = sample.x + Math.cos(sample.angle + Math.PI / 2) * side;
      const y = sample.y + Math.sin(sample.angle + Math.PI / 2) * side;
      ellipse(ctx, x, y, bag.float(1.5, 3.5), bag.float(1, 2), bag.chance(0.5) ? C.path[0] : C.path[2]);
    }
    if (bag.chance(0.1)) {
      const side = bag.float(-sample.width * 0.5, sample.width * 0.5);
      const x = sample.x + Math.cos(sample.angle + Math.PI / 2) * side;
      const y = sample.y + Math.sin(sample.angle + Math.PI / 2) * side;
      px(ctx, x, y, bag.chance(0.5) ? C.gravel : C.pathLight);
    }
  }

  for (const sample of samples) {
    if (!bag.chance(0.05)) continue;
    const side = bag.chance(0.5) ? 1 : -1;
    const off = sample.width + bag.float(1, 3);
    paintTuft(
      ctx,
      sample.x + Math.cos(sample.angle + Math.PI / 2) * off * side,
      sample.y + Math.sin(sample.angle + Math.PI / 2) * off * side,
      bag,
      0.75,
    );
  }
}

function paintPond(ctx: Ctx, bag: Bag): void {
  const { cx, cy, rx, ry } = POND;
  // muddy bank
  ellipse(ctx, cx, cy, rx + 7, ry + 6, '#8b6a48');
  ellipse(ctx, cx, cy + 1, rx + 3, ry + 2, '#a3845c');
  ellipse(ctx, cx, cy, rx, ry, C.waterDeep);
  ellipse(ctx, cx, cy - 2, rx - 3, ry - 3, C.water);
  ellipse(ctx, cx - rx * 0.18, cy - ry * 0.24, rx * 0.62, ry * 0.5, C.waterMid);
  ellipse(ctx, cx - rx * 0.24, cy - ry * 0.32, rx * 0.4, ry * 0.26, C.waterLight);
  // shoreline foam: a jagged ring
  for (let a = 0; a < Math.PI * 2; a += 0.025) {
    const wobble = 1 + (valueNoise(Math.cos(a) * 3 + 8, Math.sin(a) * 3 + 8, 4) - 0.5) * 0.1;
    const x = cx + Math.cos(a) * (rx + 1) * wobble;
    const y = cy + Math.sin(a) * (ry + 1) * wobble;
    if (bag.chance(0.5)) px(ctx, x, y, C.waterFoam);
    if (bag.chance(0.25)) px(ctx, x, y - 1, '#b8d3c6');
  }
  // ripples
  for (let i = 0; i < 26; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.1, 0.8);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    rect(ctx, x, y, bag.int(2, 5), 1, bag.chance(0.4) ? C.waterShimmer : C.waterFoam);
  }
  // lily pads
  for (let i = 0; i < 8; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.45, 0.85);
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    ellipse(ctx, x, y, bag.float(4, 6), bag.float(2, 3), C.leafDark);
    ellipse(ctx, x, y - 1, bag.float(3, 5), bag.float(1.5, 2.5), bag.chance(0.4) ? C.leaf[2] : C.leaf[1]);
    if (bag.chance(0.3)) px(ctx, x + 1, y - 1, C.blossomLight);
  }
  // reeds at the west bank
  for (let i = 0; i < 10; i++) {
    const x = cx - rx + bag.int(-12, 8);
    const y = cy + bag.int(-ry * 0.7, ry * 0.7);
    const h = bag.int(10, 22);
    linePx(ctx, x, y, x + bag.int(-2, 2), y - h, C.leaf[1]);
    if (i % 3 === 0) rect(ctx, x - 1, y - h, 2, 4, C.wood);
  }
  // stepping stones at the edge
  for (let i = 0; i < 3; i++) {
    ellipse(ctx, cx - rx - 16 + i * 9, cy + ry * 0.15 + i * 5, 5, 3, C.stoneDark);
    ellipse(ctx, cx - rx - 16 + i * 9, cy + ry * 0.15 + i * 5 - 1, 4, 2, C.stoneLight);
  }
}

function paintStream(ctx: Ctx, bag: Bag): void {
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [x1, y1] = STREAM[i];
    const [x2, y2] = STREAM[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(length / 3);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      ellipse(ctx, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 15, 12, '#8b6a48');
    }
  }
  for (let i = 0; i < STREAM.length - 1; i++) {
    const [x1, y1] = STREAM[i];
    const [x2, y2] = STREAM[i + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(length / 3);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      ellipse(ctx, x, y, 11, 8, C.water);
      if (bag.chance(0.3)) rect(ctx, x - 3, y - 2, 4, 1, C.waterShimmer);
    }
  }
  // waterfall at the top
  const [tx, ty] = STREAM[0];
  rect(ctx, tx - 10, ty - 18, 20, 40, C.waterDeep);
  for (let i = 0; i < 14; i++) {
    const x = tx - 9 + bag.int(0, 18);
    const y = ty - 18 + bag.int(0, 34);
    rect(ctx, x, y, bag.int(1, 3), bag.int(3, 8), bag.chance(0.5) ? C.waterFoam : C.waterShimmer);
  }
  ellipse(ctx, tx, ty + 19, 15, 5, '#a8d3c9');
  ellipse(ctx, tx, ty + 21, 12, 4, C.waterFoam);
  for (let i = 0; i < 8; i++) px(ctx, tx + bag.int(-14, 14), ty + 22 + bag.int(0, 4), '#e8f4ec');
  // bank stones
  for (let i = 0; i < 12; i++) {
    const t = bag.float(0, 1);
    const idx = bag.int(0, STREAM.length - 2);
    const [x1, y1] = STREAM[idx];
    const [x2, y2] = STREAM[idx + 1];
    const x = x1 + (x2 - x1) * t + (bag.chance(0.5) ? 13 : -13);
    const y = y1 + (y2 - y1) * t;
    ellipse(ctx, x, y, 3, 2, C.stone);
    px(ctx, x - 1, y - 1, C.stoneLight);
  }
}

function paintWellClearing(ctx: Ctx, bag: Bag): void {
  for (let i = 0; i < 18; i++) {
    const a = bag.float(0, Math.PI * 2);
    const d = bag.float(0.35, 1);
    ellipse(ctx, WELL.x + Math.cos(a) * 30 * d, WELL.y + Math.sin(a) * 22 * d, 4, 2.5, C.stoneDark);
    ellipse(ctx, WELL.x + Math.cos(a) * 30 * d, WELL.y + Math.sin(a) * 22 * d - 1, 3, 1.7, bag.chance(0.5) ? C.stone : C.stoneWarm);
  }
  for (let i = 0; i < 10; i++) {
    const x = WELL.x + bag.int(-38, 38);
    const y = WELL.y + bag.int(-26, 26);
    if (bag.chance(0.5)) paintFlower(ctx, x, y, bag);
    else paintTuft(ctx, x, y, bag, 0.7);
  }
}

function paintMeadow(ctx: Ctx, bag: Bag): void {
  for (let i = 0; i < 130; i++) {
    const x = bag.float(6.5 * 16, 18 * 16);
    const y = bag.float(23 * 16, 37 * 16);
    paintFlower(ctx, x, y, bag);
  }
  for (let i = 0; i < 40; i++) {
    const x = bag.float(6.5 * 16, 18 * 16);
    const y = bag.float(23 * 16, 37 * 16);
    paintDaisy(ctx, x, y);
  }
  for (let i = 0; i < 55; i++) {
    const x = bag.float(6.5 * 16, 30 * 16);
    const y = bag.float(20 * 16, 40 * 16);
    paintTuft(ctx, x, y, bag, 1.1);
  }
}

function nearAnyPath(x: number, y: number, radius: number): boolean {
  for (const path of PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i];
      const [x2, y2] = path[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = dx * dx + dy * dy;
      const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length));
      if (Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t)) < radius) return true;
    }
  }
  return false;
}

function paintHomeGarden(ctx: Ctx, bag: Bag): void {
  // The cottage garden: dense enough to feel tended, loose enough to feel old.
  for (let i = 0; i < 120; i++) {
    const x = bag.float(2.2 * 16, 16.2 * 16);
    const y = bag.float(11.3 * 16, 21.4 * 16);
    if (x > HOUSE.x - 6 && x < HOUSE.x + HOUSE.w + 6 && y < HOUSE.y + 118) continue;
    if (x > FENCE.x - 10 && y > FENCE.y - 10) continue;
    if (nearAnyPath(x, y, 21)) continue;
    const roll = bag.float(0, 1);
    if (roll < 0.34) paintFlower(ctx, x, y, bag);
    else if (roll < 0.52) paintDaisy(ctx, x, y);
    else if (roll < 0.74) paintTuft(ctx, x, y, bag, bag.float(0.65, 1.15));
    else if (roll < 0.86) paintClover(ctx, x, y, bag);
    else ellipse(ctx, x, y, bag.float(1, 2.2), bag.float(0.8, 1.4), bag.chance(0.5) ? C.stone : C.stoneWarm);
  }
  // A few taller wildflower clumps by the porch and along the fence.
  for (let i = 0; i < 22; i++) {
    const x = bag.float(3.5 * 16, 15.5 * 16);
    const y = bag.float(13.5 * 16, 20 * 16);
    if (nearAnyPath(x, y, 22)) continue;
    paintFlower(ctx, x, y, bag);
  }
}

function paintOrchardFloor(ctx: Ctx, bag: Bag): void {
  for (let i = 0; i < 22; i++) {
    const x = bag.float(40 * 16, 52 * 16);
    const y = bag.float(9 * 16, 14 * 16);
    paintTuft(ctx, x, y, bag, 0.7);
    if (bag.chance(0.3)) {
      ellipse(ctx, x, y, 1.5, 1.2, C.fruit);
      px(ctx, x - 1, y - 1, '#e98c6b');
    }
  }
}

export function renderTerrain(): HTMLCanvasElement {
  const canvas = createCanvas(WORLD_W, WORLD_H);
  const ctx = context(canvas);
  const bag = new Bag(20261124);

  // ---- base grass, a continuous dithered field of light and shade ----
  paintMeadowBase(ctx);
  for (let ty = 0; ty < WORLD_H / 16; ty++) {
    for (let tx = 0; tx < WORLD_W / 16; tx++) {
      grassDetail(ctx, tx * 16, ty * 16, bag);
    }
  }

  // ---- forest floor darkening around the frame ----
  ctx.fillStyle = 'rgba(38, 55, 30, 0.32)';
  for (let i = 0; i < 430; i++) {
    const edge = bag.int(0, 3);
    let x = 0;
    let y = 0;
    if (edge === 0) {
      x = bag.float(-30, WORLD_W + 30);
      y = bag.float(-20, 86);
    } else if (edge === 1) {
      x = bag.float(-20, 66);
      y = bag.float(-20, WORLD_H + 20);
    } else if (edge === 2) {
      x = bag.float(WORLD_W - 70, WORLD_W + 20);
      y = bag.float(-20, WORLD_H + 20);
    } else {
      x = bag.float(-30, WORLD_W + 30);
      y = bag.float(WORLD_H - 86, WORLD_H + 20);
    }
    const r = bag.float(12, 34);
    ellipse(ctx, x, y, r, r * 0.7, 'rgba(41, 58, 32, 0.4)');
  }
  // mossy patches under the treeline
  for (let i = 0; i < 70; i++) {
    const x = bag.float(0, WORLD_W);
    const y = bag.chance(0.5) ? bag.float(60, 120) : bag.float(WORLD_H - 110, WORLD_H - 40);
    dither(ctx, x - 12, y - 6, 24, 12, C.leafDark, 9, bag.int(0, 999), 0.35);
  }

  // ---- the old field ----
  paintField(ctx, bag);

  // ---- paths ----
  const pathSamples: PathSample[] = [];
  for (const path of PATHS) pathSamples.push(...collectPathSamples(path, 0));
  paintPaths(ctx, pathSamples, bag);

  // ---- cottage garden ----
  paintHomeGarden(ctx, bag);

  // ---- the field fence, painted into the ground pass ----
  paintFence(ctx, FENCE_SEGMENTS, { x: FENCE.gateX, y: FENCE.y + FENCE.h, w: FENCE.gateW });

  // ---- water ----
  paintStream(ctx, bag);
  paintPond(ctx, bag);

  // ---- the farm field's worn edge ----
  for (let x = FIELD.x - 8; x < FIELD.x + FIELD.w + 8; x += 5) {
    for (let y = FIELD.y - 8; y < FIELD.y + FIELD.h + 8; y += 5) {
      if (x > FIELD.x + 4 && x < FIELD.x + FIELD.w - 4 && y > FIELD.y + 4 && y < FIELD.y + FIELD.h - 4) continue;
      if (bag.chance(0.16)) paintTuft(ctx, x, y, bag, 0.6);
    }
  }

  // ---- meadow, orchard, well clearing, house garden ----
  paintMeadow(ctx, bag);
  paintOrchardFloor(ctx, bag);
  paintWellClearing(ctx, bag);

  for (let i = 0; i < 45; i++) {
    const x = bag.float(4 * 16, 16 * 16);
    const y = bag.float(12 * 16, 21 * 16);
    if (x > FENCE.x - 6 && y > FENCE.y - 6) continue;
    if (bag.chance(0.6)) paintTuft(ctx, x, y, bag, 0.8);
    else paintFlower(ctx, x, y, bag);
  }

  // ---- flower pots and veg beds by the house ----
  for (let i = 0; i < 2; i++) {
    const x = 3.4 * 16 + i * 9 * 16;
    const y = 14.4 * 16;
    ellipse(ctx, x, y, 9, 4, C.soilDark);
    for (let j = 0; j < 4; j++) paintFlower(ctx, x - 6 + j * 4, y - 2, bag);
  }

  // ---- fallen leaves, twigs, small stones ----
  for (let i = 0; i < 180; i++) {
    const x = bag.float(0, WORLD_W);
    const y = bag.float(0, WORLD_H);
    if (bag.chance(0.5)) px(ctx, x, y, bag.pick([C.leaf[0], C.leaf[1], C.leaf[2]]));
    else px(ctx, x, y, bag.pick([C.grassDark[0], C.grassLight, '#b79a63']));
  }
  for (let i = 0; i < 18; i++) {
    const x = bag.float(0, WORLD_W);
    const y = bag.float(0, WORLD_H);
    if (bag.chance(0.5)) {
      linePx(ctx, x, y, x + bag.int(-4, 4), y + bag.int(-2, 2), C.woodDark);
    } else {
      ellipse(ctx, x, y, 1.5, 1, C.stone);
    }
  }

  // ---- dappled shade under the hero trees ----
  for (const tree of TREES) {
    if (tree.scale < 1) continue;
    softShadow(ctx, tree.x + 10, tree.y + 6, 34 * tree.scale, 12 * tree.scale, 0.09);
  }
  softShadow(ctx, 26 * 16, 20 * 16, 40, 16, 0.04);

  // ---- warm patch of sun in the meadow ----
  ctx.fillStyle = 'rgba(255, 235, 170, 0.05)';
  ellipse(ctx, 15 * 16, 27 * 16, 90, 60, 'rgba(255, 235, 170, 0.06)');
  ellipse(ctx, 43 * 16, 19 * 16, 70, 44, 'rgba(255, 235, 170, 0.04)');

  // ---- soft worn ground under the stand, sign, beehives, lanterns ----
  for (const point of [STAND, SIGN, ...BEEHIVES, ...LANTERNS]) {
    ellipse(ctx, point.x, point.y + 2, 18, 5, 'rgba(126, 96, 60, 0.14)');
  }

  return canvas;
}
