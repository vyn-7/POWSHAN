/** Deterministic random helpers. The whole valley can be regenerated from a
 *  single seed, which keeps saves, screenshots and tests stable. */

export function hash2(x: number, y: number, seed = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function hash1(x: number, seed = 0): number {
  return hash2(x, 0, seed);
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Small throw-away bag of random helpers for art routines. */
export class Bag {
  private readonly next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  float(min = 0, max = 1): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length) % items.length];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Smooth-ish 2D value noise, sampled in tile units. */
export function valueNoise(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const ease = (t: number): number => t * t * (3 - 2 * t);
  const u = ease(xf);
  const v = ease(yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Frame-rate independent smoothing. */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function pointInEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): boolean {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
