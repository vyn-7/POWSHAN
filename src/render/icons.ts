import { createCanvas, context, ellipse, linePx, outlined, px, rect } from '../core/canvas';
import type { ItemId, ProduceId } from '../data/crops';
import { C } from './palette';
import type { Weather } from '../systems/time';

function finish(source: HTMLCanvasElement): HTMLCanvasElement {
  return outlined(source, C.ink, 1);
}

export function itemIcon(item: ItemId): HTMLCanvasElement {
  const source = createCanvas(18, 18);
  const ctx = context(source);
  switch (item) {
    case 'hoe': {
      linePx(ctx, 4, 15, 13, 6, C.woodDark);
      linePx(ctx, 5, 15, 14, 6, C.woodLight);
      rect(ctx, 12, 3, 5, 3, C.stoneDark);
      rect(ctx, 13, 4, 3, 2, C.stoneLight);
      rect(ctx, 10, 8, 2, 3, C.woodDark);
      break;
    }
    case 'can': {
      rect(ctx, 4, 8, 10, 7, C.stoneDark);
      rect(ctx, 5, 9, 8, 5, '#6f8f97');
      rect(ctx, 5, 9, 8, 1, '#a8c0bd');
      rect(ctx, 6, 6, 5, 2, C.stoneDark);
      rect(ctx, 8, 5, 1, 2, C.stoneDark);
      linePx(ctx, 13, 11, 16, 7, C.stoneDark);
      rect(ctx, 15, 6, 2, 2, C.stoneDark);
      rect(ctx, 3, 10, 1, 4, C.stoneDark);
      px(ctx, 13, 14, '#a8c0bd');
      break;
    }
    case 'turnipSeed':
    case 'carrotSeed':
    case 'moonSeed': {
      const accent =
        item === 'turnipSeed' ? '#9a8db6' : item === 'carrotSeed' ? '#d57a35' : '#8f9bd8';
      rect(ctx, 3, 4, 12, 12, C.creamDeep);
      rect(ctx, 4, 5, 10, 10, C.cream);
      rect(ctx, 5, 3, 8, 2, C.creamDeep);
      rect(ctx, 5, 8, 8, 6, accent);
      rect(ctx, 6, 9, 6, 1, C.cream);
      px(ctx, 8, 12, C.gold);
      px(ctx, 10, 13, C.gold);
      px(ctx, 5, 6, C.leaf[1]);
      px(ctx, 6, 5, C.leaf[3]);
      break;
    }
    case 'hand': {
      rect(ctx, 6, 7, 7, 8, C.skin);
      rect(ctx, 5, 9, 2, 5, C.skin);
      rect(ctx, 12, 10, 2, 4, C.skin);
      rect(ctx, 7, 4, 2, 4, C.skin);
      rect(ctx, 9, 3, 2, 5, C.skin);
      rect(ctx, 11, 4, 2, 4, C.skin);
      px(ctx, 9, 6, C.skinShade);
      rect(ctx, 6, 13, 7, 2, C.cream);
      rect(ctx, 6, 13, 7, 1, C.creamDeep);
      break;
    }
  }
  return finish(source);
}

export function produceIcon(id: ProduceId): HTMLCanvasElement {
  const source = createCanvas(18, 18);
  const ctx = context(source);
  if (id === 'turnip') {
    ellipse(ctx, 9, 11, 5, 4, '#cbc0dd');
    ellipse(ctx, 9, 10, 4.5, 3, '#eee8f5');
    rect(ctx, 6, 8, 6, 2, '#b7a6d0');
    px(ctx, 8, 9, '#ffffff');
    rect(ctx, 8, 14, 2, 2, '#a596bd');
    rect(ctx, 7, 4, 1, 4, C.leaf[0]);
    rect(ctx, 9, 3, 1, 5, C.leaf[1]);
    ellipse(ctx, 7, 5, 2, 1.5, C.leaf[2]);
    ellipse(ctx, 11, 5, 2, 1.5, C.leaf[3]);
  } else if (id === 'carrot') {
    ellipse(ctx, 9, 11, 4, 6, '#c4632a');
    ellipse(ctx, 9, 10, 3, 5, '#e58a3a');
    px(ctx, 8, 8, '#f4b265');
    px(ctx, 10, 12, '#9d431c');
    linePx(ctx, 7, 4, 7, 8, C.leaf[2]);
    linePx(ctx, 9, 3, 9, 8, C.leaf[1]);
    linePx(ctx, 11, 4, 11, 8, C.leaf[2]);
    px(ctx, 6, 3, C.leaf[3]);
    px(ctx, 12, 3, C.leaf[3]);
  } else {
    rect(ctx, 9, 8, 1, 8, C.leaf[1]);
    ellipse(ctx, 9, 7, 5, 5, '#e8e4f6');
    ellipse(ctx, 9, 7, 3, 3, '#fbf8ff');
    ellipse(ctx, 9, 7, 1.5, 1.5, C.gold);
    px(ctx, 6, 4, '#cdc6e5');
    px(ctx, 12, 9, '#cdc6e5');
    px(ctx, 5, 9, C.leaf[2]);
  }
  return finish(source);
}

export function coinIcon(): HTMLCanvasElement {
  const source = createCanvas(14, 14);
  const ctx = context(source);
  ellipse(ctx, 7, 7, 5, 5, C.goldDeep);
  ellipse(ctx, 7, 7, 4, 4, C.coin);
  ellipse(ctx, 6, 6, 2, 2, '#f8dd93');
  px(ctx, 9, 9, C.goldDeep);
  return finish(source);
}

let coinUrl: string | null = null;
/** The coin as a data URL, for inline use in HTML copy (prices, totals). */
export function coinDataUrl(): string {
  if (!coinUrl) coinUrl = coinIcon().toDataURL();
  return coinUrl;
}

export function weatherIcon(weather: Weather): HTMLCanvasElement {
  const source = createCanvas(16, 16);
  const ctx = context(source);
  if (weather === 'sunny') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      px(ctx, 8 + Math.cos(a) * 6, 8 + Math.sin(a) * 6, C.gold);
    }
    ellipse(ctx, 8, 8, 4, 4, '#e8a93f');
    ellipse(ctx, 8, 8, 3, 3, '#f6cf6c');
    px(ctx, 6, 6, '#fff1b8');
  } else if (weather === 'rain') {
    ellipse(ctx, 8, 7, 5, 3, '#7f8f9b');
    ellipse(ctx, 6, 6, 3, 2.4, '#95a6b0');
    ellipse(ctx, 10, 6, 2.5, 2, '#95a6b0');
    rect(ctx, 4, 9, 9, 2, '#7f8f9b');
    linePx(ctx, 6, 12, 5, 14, '#6fa6c2');
    linePx(ctx, 9, 12, 8, 14, '#6fa6c2');
    linePx(ctx, 12, 12, 11, 14, '#6fa6c2');
  } else {
    ellipse(ctx, 8, 7, 5, 3, '#a8b6c0');
    ellipse(ctx, 6, 6, 3, 2.4, '#c2ced5');
    ellipse(ctx, 10, 6, 2.5, 2, '#b4c1c9');
    rect(ctx, 4, 9, 9, 2, '#a8b6c0');
  }
  return finish(source);
}

export function heartIcon(): HTMLCanvasElement {
  const canvas = createCanvas(7, 6);
  const ctx = context(canvas);
  px(ctx, 1, 1, C.rose);
  px(ctx, 2, 1, C.rose);
  px(ctx, 4, 1, C.rose);
  px(ctx, 5, 1, C.rose);
  rect(ctx, 1, 2, 5, 2, C.rose);
  rect(ctx, 2, 4, 3, 1, C.rose);
  px(ctx, 3, 5, C.rose);
  return canvas;
}

/** Sprig used on the title and in the journal. */
export function leafSprite(size = 14): HTMLCanvasElement {
  const canvas = createCanvas(size, size);
  const ctx = context(canvas);
  linePx(ctx, size / 2, size - 1, size / 2, 3, C.leaf[0]);
  ellipse(ctx, size / 2 - 2, size / 2, 3, 2, C.leaf[2]);
  ellipse(ctx, size / 2 + 2, size / 2 - 3, 3, 2, C.leaf[3]);
  px(ctx, size / 2, 3, C.leaf[1]);
  return canvas;
}
