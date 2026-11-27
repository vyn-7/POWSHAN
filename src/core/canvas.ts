/** Tiny raster helpers. Everything in the valley is painted with these, so the
 *  art stays crisp at 1x and inherits one consistent set of outlines. */

/** The canvas is rendered at 2x its logical 480x270 view. Characters are drawn
 *  from 2x canvases at half logical size, so their faces keep the extra detail
 *  while the world stays on its familiar pixel grid. */
export const RENDER_SCALE = 2;

export type Ctx = CanvasRenderingContext2D;

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return canvas;
}

export function context(canvas: HTMLCanvasElement): Ctx {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

export function px(ctx: Ctx, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

/** Crisp, non-antialiased ellipse. */
export function ellipse(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
): void {
  ctx.fillStyle = color;
  const height = Math.max(1, Math.round(ry));
  for (let y = -height; y <= height; y++) {
    const t = y / (height + 0.5);
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
  }
}

/** A dithered patch of a second colour, used for grass and shingle texture. */
export function dither(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  step: number,
  seed = 1,
  density = 0.5,
): void {
  ctx.fillStyle = color;
  let n = seed | 0;
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      if ((n / 4294967296) * step < density) ctx.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}

/** Draw a dark copy of the sprite behind itself to get a clean 1px outline. */
export function outlined(source: HTMLCanvasElement, color: string, thickness = 1): HTMLCanvasElement {
  const pad = thickness + 1;
  const out = createCanvas(source.width + pad * 2, source.height + pad * 2);
  const ctx = context(out);
  const tint = createCanvas(source.width, source.height);
  const tintCtx = context(tint);
  tintCtx.drawImage(source, 0, 0);
  tintCtx.globalCompositeOperation = 'source-in';
  tintCtx.fillStyle = color;
  tintCtx.fillRect(0, 0, tint.width, tint.height);

  for (let dy = -thickness; dy <= thickness; dy++) {
    for (let dx = -thickness; dx <= thickness; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (Math.abs(dx) + Math.abs(dy) > thickness) continue;
      ctx.drawImage(tint, pad + dx, pad + dy);
    }
  }
  ctx.drawImage(source, pad, pad);
  return out;
}

/** Horizontal scanline fill with a jagged, hand-cut top, for tree canopies. */
export function leafyBlob(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  seed = 1,
): void {
  ctx.fillStyle = color;
  let n = seed | 0;
  for (let y = -ry; y <= ry; y++) {
    n = (Math.imul(n, 1103515245) + 12345) >>> 0;
    const wobble = (n / 4294967296 > 0.62 ? 1 : 0) + (n / 4294967296 > 0.9 ? 1 : 0);
    const t = y / (ry + 0.5);
    const span = Math.floor((rx + wobble) * Math.sqrt(Math.max(0, 1 - t * t)));
    if (span <= 0) continue;
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
  }
}

export function linePx(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = color;
  for (;;) {
    ctx.fillRect(x, y, 1, 1);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/* ---------------------------------------------------------------------------
 * A 3x5 bitmap face. Canvas-drawn numbers and labels stay inside the pixel
 * grid instead of picking up browser font smoothing.
 * ------------------------------------------------------------------------ */

const FACE: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101111010',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001111',
  '+': '000010111010000',
  '-': '000000111000000',
  '.': '000000000000010',
  ',': '000000000010100',
  ':': '000010000010000',
  '!': '010010010000010',
  '?': '110001010000010',
  '/': '001001010100100',
  "'": '010010000000000',
  ' ': '000000000000000',
};

export function textWidth(text: string, scale = 1): number {
  return Math.max(0, text.length * 4 - 1) * scale;
}

export function tinyText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: 'left' | 'center' = 'left',
): void {
  const upper = text.toUpperCase();
  let startX = Math.round(x);
  if (align === 'center') startX -= Math.round(textWidth(upper, scale) / 2);
  ctx.fillStyle = color;
  for (let i = 0; i < upper.length; i++) {
    const face = FACE[upper[i]] ?? FACE['?'];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (face[row * 3 + col] === '1') {
          ctx.fillRect(startX + i * 4 * scale + col * scale, Math.round(y) + row * scale, scale, scale);
        }
      }
    }
  }
}
