import { Bag } from '../core/rng';
import { createCanvas, context, ellipse, outlined, px, rect, type Ctx } from '../core/canvas';
import type { CropId } from '../data/crops';
import { C } from './palette';
import type { Sprite } from './nature';
import type { Plot } from '../systems/farm';

const CW = 18;
const CH = 26;

function seededMound(ctx: Ctx): void {
  ellipse(ctx, 9, 23, 5, 2, C.soilDark);
  ellipse(ctx, 9, 22, 4, 1.5, C.soil);
  px(ctx, 8, 21, '#b98f62');
}

function sprout(ctx: Ctx, leafColor: string = C.leaf[2]): void {
  rect(ctx, 8, 18, 1, 5, C.leaf[0]);
  rect(ctx, 6, 17, 3, 2, leafColor);
  rect(ctx, 9, 16, 3, 2, C.leaf[3]);
  px(ctx, 8, 16, C.leafDark);
}

function leafy(ctx: Ctx, bag: Bag, height: number, width: number): void {
  rect(ctx, 9, 23 - height, 1, height, C.leaf[0]);
  const leaves = 5;
  for (let i = 0; i < leaves; i++) {
    const y = 22 - Math.round((i / leaves) * height);
    const side = i % 2 === 0 ? -1 : 1;
    const len = Math.round(width * (0.6 + (i / leaves) * 0.5));
    const x = 9 + side * len;
    ellipse(ctx, x, y, Math.max(1.5, len * 0.7), 2, i % 3 === 0 ? C.leaf[1] : C.leaf[2]);
    px(ctx, x, y - 1, C.leaf[4]);
  }
  for (let i = 0; i < 3; i++) px(ctx, bag.int(5, 13), bag.int(10, 20), C.leafLight);
}

function matureTurnip(ctx: Ctx, bag: Bag): void {
  leafy(ctx, bag, 8, 4);
  // bulb
  ellipse(ctx, 9, 20, 4.5, 3.5, '#cbc0dd');
  ellipse(ctx, 9, 19, 4, 2.5, '#e8e1f0');
  ellipse(ctx, 9, 18, 2.5, 1.5, '#f7f3fb');
  px(ctx, 8, 18, '#ffffff');
  rect(ctx, 6, 22, 6, 1, '#9d90b6');
  // purple shoulder
  rect(ctx, 7, 16, 4, 1, '#b7a6d0');
  rect(ctx, 6, 17, 1, 1, '#b7a6d0');
  // roots
  px(ctx, 11, 23, '#cbbad3');
}

function matureCarrot(ctx: Ctx): void {
  // feathery top
  for (let i = 0; i < 9; i++) {
    const x = 4 + i * 1.6;
    rect(ctx, x, 6 + i % 3, 1, 10, i % 2 === 0 ? C.leaf[2] : C.leaf[1]);
    px(ctx, x - 1, 6 + (i % 3), C.leaf[3]);
  }
  rect(ctx, 9, 15, 2, 5, C.leaf[0]);
  // carrot shoulder
  ellipse(ctx, 9, 21, 3.5, 2.5, '#b85a26');
  ellipse(ctx, 9, 20, 3, 2, '#de7a2f');
  rect(ctx, 8, 19, 2, 1, '#f2a04c');
  px(ctx, 7, 22, '#973f1b');
  px(ctx, 10, 23, '#973f1b');
}

function matureMoon(ctx: Ctx, bag: Bag): void {
  rect(ctx, 9, 8, 1, 15, '#5e8a54');
  rect(ctx, 8, 14, 3, 1, C.leaf[1]);
  rect(ctx, 10, 16, 3, 1, C.leaf[1]);
  rect(ctx, 6, 18, 3, 1, C.leaf[2]);
  // leaves
  ellipse(ctx, 6, 16, 3, 1.5, C.leaf[2]);
  ellipse(ctx, 12, 19, 3, 1.5, C.leaf[1]);
  // blossom
  const petals: Array<[number, number]> = [
    [9, 4],
    [6, 6],
    [12, 6],
    [7, 9],
    [11, 9],
    [9, 7],
  ];
  for (const [x, y] of petals) ellipse(ctx, x, y, 2, 2, '#e7e3f6');
  for (const [x, y] of petals) px(ctx, x, y, '#fbf8ff');
  ellipse(ctx, 9, 6, 1.5, 1.5, '#f4de94');
  px(ctx, 8, 5, '#fff3bd');
  px(ctx, 6, 5, '#d8d2ee');
  px(ctx, 12, 8, '#d8d2ee');
  // dew
  px(ctx, 4, 13, '#d9e9e0');
  if (bag.chance(0.4)) px(ctx, 14, 10, '#d9e9e0');
}

function drawCrop(ctx: Ctx, crop: CropId, stage: number): void {
  const bag = new Bag(crop.length * 19 + stage * 7);
  if (stage === 0) {
    seededMound(ctx);
    sprout(ctx);
    return;
  }
  if (stage === 1) {
    seededMound(ctx);
    sprout(ctx, C.leaf[3]);
    rect(ctx, 7, 19, 1, 3, C.leaf[0]);
    return;
  }
  if (stage === 2) {
    seededMound(ctx);
    if (crop === 'turnip') {
      leafy(ctx, bag, 6, 3);
      ellipse(ctx, 9, 20, 3, 1.6, '#cbc0dd');
    } else if (crop === 'carrot') {
      leafy(ctx, bag, 7, 4);
      px(ctx, 9, 23, '#de7a2f');
    } else {
      leafy(ctx, bag, 10, 3);
      px(ctx, 9, 12, '#e7e3f6');
    }
    return;
  }
  if (crop === 'turnip') matureTurnip(ctx, bag);
  else if (crop === 'carrot') matureCarrot(ctx);
  else matureMoon(ctx, bag);
}

const cache = new Map<string, Sprite[]>();

export function cropSprites(crop: CropId): Sprite[] {
  const existing = cache.get(crop);
  if (existing) return existing;
  const list: Sprite[] = [];
  for (let stage = 0; stage < 4; stage++) {
    const source = createCanvas(CW + 2, CH + 2);
    const ctx = context(source);
    ctx.translate(1, 1);
    drawCrop(ctx, crop, stage);
    const out = outlined(source, C.ink, 1);
    list.push({ canvas: out, bx: out.width / 2, by: out.height - 3 });
  }
  cache.set(crop, list);
  return list;
}

/** Soil is drawn per plot, then joined with its neighbours so the furrows run
 *  across the whole field instead of looking like a spreadsheet. */
export function drawPlot(
  ctx: Ctx,
  plot: Plot,
  px0: number,
  py0: number,
  neighbours: { up: boolean; down: boolean; left: boolean; right: boolean },
  seed: number,
): void {
  const bag = new Bag(seed);
  const wet = plot.watered;
  rect(ctx, px0, py0, 16, 16, wet ? C.soilWet : C.soil);
  for (let y = 2; y < 16; y += 4) {
    rect(ctx, px0, py0 + y, 16, 1, wet ? C.soilWetDark : C.soilDark);
    rect(ctx, px0, py0 + y + 1, 16, 1, wet ? '#6b4433' : C.soilLight);
  }
  // scatter clods
  for (let i = 0; i < 3; i++) {
    const x = px0 + bag.int(2, 13);
    const y = py0 + bag.int(2, 13);
    px(ctx, x, y, bag.chance(0.5) ? C.soilDark : C.soilLight);
  }
  if (wet) {
    for (let i = 0; i < 2; i++) {
      const x = px0 + bag.int(3, 12);
      const y = py0 + bag.int(4, 13);
      px(ctx, x, y, '#7b5a49');
      px(ctx, x + 1, y + 1, '#3f271d');
    }
  }
  // soft rim only on edges that meet grass
  ctx.fillStyle = wet ? '#462b20' : '#6a4230';
  if (!neighbours.up) ctx.fillRect(px0, py0, 16, 1);
  if (!neighbours.down) ctx.fillRect(px0, py0 + 15, 16, 1);
  if (!neighbours.left) ctx.fillRect(px0, py0, 1, 16);
  if (!neighbours.right) ctx.fillRect(px0 + 15, py0, 1, 16);
  ctx.fillStyle = wet ? '#8f6a55' : C.soilLight;
  if (!neighbours.up) ctx.fillRect(px0 + 1, py0 + 1, 14, 1);
  if (!neighbours.left) ctx.fillRect(px0 + 1, py0 + 2, 1, 12);
}
