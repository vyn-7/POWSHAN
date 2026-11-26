import { createCanvas, context, ellipse, linePx, outlined, px, rect, type Ctx } from '../core/canvas';
import type { CatProfile } from '../data/cats';
import { C } from './palette';
import type { Sprite } from './nature';

export type CatPose = 'idle' | 'walk' | 'sit' | 'sleep';

const W = 20;
const H = 16;

function leg(ctx: Ctx, x: number, y: number, color: string, toes: string | undefined, lift = 0): void {
  rect(ctx, x, y - lift, 2, 3 + lift, color);
  if (toes) rect(ctx, x, y + 2 - lift, 2, 1, toes);
  px(ctx, x, y + 2, C.inkSoft);
}

function tail(ctx: Ctx, profile: CatProfile, frame: number, sleeping: boolean): void {
  // A cat can carry one solid tail colour (Mumu's is black from base to tip).
  const fur = profile.colors.tail ?? profile.colors.fur;
  const furDark = profile.colors.tailDark ?? profile.colors.furDark;
  const tip = profile.colors.tail ? fur : (profile.colors.accent ?? C.cream);
  if (sleeping) {
    linePx(ctx, 5, 12, 9, 14, furDark);
    linePx(ctx, 6, 11, 10, 13, fur);
    linePx(ctx, 9, 14, 14, 14, furDark);
    return;
  }
  const sway = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  linePx(ctx, 4, 9, 1, 6 + sway, fur);
  linePx(ctx, 1, 6 + sway, 1, 3 + sway, fur);
  linePx(ctx, 2, 9, 2, 7 + sway, furDark);
  px(ctx, 1, 2 + sway, tip);
  px(ctx, 1, 3 + sway, tip);
}

function body(ctx: Ctx, profile: CatProfile, frame: number, patch = true): void {
  const { fur, furDark, belly, patch: patchColor, accent } = profile.colors;
  const bob = frame === 2 ? 1 : 0;
  ellipse(ctx, 9, 10 + bob, 6, 3.6, furDark);
  ellipse(ctx, 9, 9 + bob, 5.4, 3, fur);
  ellipse(ctx, 10, 11 + bob, 4, 1.8, belly);
  if (patch && patchColor) {
    ellipse(ctx, 6, 8 + bob, 2, 1.6, patchColor);
    px(ctx, 8, 7 + bob, patchColor);
  }
  if (accent) {
    rect(ctx, 12, 7 + bob, 5, 1, accent);
  }
  // fur texture
  px(ctx, 5, 8 + bob, furDark);
  px(ctx, 8, 7 + bob, furDark);
  px(ctx, 12, 9 + bob, furDark);
  // legs
  leg(ctx, 5, 12, furDark, profile.colors.toes);
  leg(ctx, 8, 12, furDark, profile.colors.toes);
  leg(ctx, 12, 12, furDark, profile.colors.toes);
  leg(ctx, 14, 12, furDark, profile.colors.toes);
}

function head(ctx: Ctx, profile: CatProfile, frame: number, sleepy: boolean): void {
  const { fur, furDark, belly, patch, eyes } = profile.colors;
  const bob = frame === 2 ? 1 : 0;
  const x = 13;
  const y = 6 + bob;
  ellipse(ctx, x + 2, y + 3, 3.4, 3, furDark);
  ellipse(ctx, x + 2, y + 3, 2.9, 2.5, fur);
  // ears
  rect(ctx, x, y - 1, 2, 3, fur);
  rect(ctx, x + 3, y - 1, 2, 3, fur);
  px(ctx, x, y - 2, fur);
  px(ctx, x + 4, y - 2, fur);
  px(ctx, x + 1, y - 1, '#e39b9b');
  px(ctx, x + 4, y - 1, '#e39b9b');
  if (patch && profile.headPatch !== false) {
    rect(ctx, x, y, 3, 2, patch);
    px(ctx, x + 3, y + 1, patch);
  }
  // muzzle
  ellipse(ctx, x + 4, y + 4, 1.6, 1.2, belly);
  px(ctx, x + 5, y + 4, '#d98c8c');
  px(ctx, x + 5, y + 5, C.inkSoft);
  // eye
  if (sleepy) {
    rect(ctx, x + 3, y + 2, 2, 1, C.inkSoft);
    px(ctx, x + 2, y + 3, furDark);
  } else {
    px(ctx, x + 3, y + 2, eyes);
    px(ctx, x + 3, y + 1, furDark);
    px(ctx, x + 2, y + 2, eyes);
  }
  px(ctx, x + 2, y + 5, furDark);
  // whiskers
  px(ctx, x + 7, y + 4, C.cream);
  px(ctx, x + 8, y + 4, C.cream);
}

function paintCat(ctx: Ctx, profile: CatProfile, pose: CatPose, frame: number): void {
  const { furDark } = profile.colors;
  if (pose === 'sleep') {
    const bob = frame === 2 ? 1 : 0;
    ellipse(ctx, 9, 12, 7, 3.4, furDark);
    ellipse(ctx, 9, 11 + bob, 6.2, 2.8, profile.colors.fur);
    ellipse(ctx, 8, 11 + bob, 4, 2, profile.colors.belly);
    ellipse(ctx, 13, 10 + bob, 3, 2.4, profile.colors.fur);
    px(ctx, 14, 9 + bob, profile.colors.fur);
    px(ctx, 16, 9 + bob, profile.colors.fur);
    px(ctx, 15, 10 + bob, profile.colors.eyes);
    tail(ctx, profile, frame, true);
    return;
  }

  if (pose === 'sit') {
    const bob = frame === 2 ? 1 : 0;
    ellipse(ctx, 9, 13, 5.5, 2.6, furDark);
    ellipse(ctx, 8, 9 + bob, 4.2, 4.5, furDark);
    ellipse(ctx, 8, 9 + bob, 3.6, 4, profile.colors.fur);
    ellipse(ctx, 9, 10 + bob, 2.5, 2.8, profile.colors.belly);
    rect(ctx, 6, 12, 2, 4, profile.colors.furDark);
    rect(ctx, 10, 12, 2, 4, profile.colors.fur);
    px(ctx, 6, 15, C.inkSoft);
    px(ctx, 10, 15, C.inkSoft);
    if (profile.colors.patch) {
      ellipse(ctx, 6, 8 + bob, 2, 1.5, profile.colors.patch);
    }
    head(ctx, profile, frame, profile.sleepiness > 0.7);
    // curled tail
    linePx(ctx, 3, 14, 1, 12, profile.colors.tail ?? profile.colors.fur);
    linePx(ctx, 1, 12, 2, 10, profile.colors.tailDark ?? profile.colors.furDark);
    return;
  }

  const walking = pose === 'walk';
  const off = walking ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;

  tail(ctx, profile, frame, false);
  body(ctx, profile, frame);
  // leg motion
  if (walking) {
    leg(ctx, 5 + off, 12, profile.colors.furDark, profile.colors.toes, off > 0 ? 1 : 0);
    leg(ctx, 8 - off, 12, profile.colors.furDark, profile.colors.toes, off < 0 ? 1 : 0);
    leg(ctx, 12 + off, 12, profile.colors.furDark, profile.colors.toes, off < 0 ? 1 : 0);
    leg(ctx, 14 - off, 12, profile.colors.furDark, profile.colors.toes, off > 0 ? 1 : 0);
  }
  head(ctx, profile, frame, profile.sleepiness > 0.7);
  // dust of a very small animal
  px(ctx, 2, 14, C.leafPale);
}

function finish(source: HTMLCanvasElement, flip: boolean): Sprite {
  const out = outlined(source, C.ink, 1);
  if (!flip) return { canvas: out, bx: out.width / 2, by: out.height - 2 };
  const canvas = createCanvas(out.width, out.height);
  const ctx = context(canvas);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(out, 0, 0);
  return { canvas, bx: canvas.width / 2, by: canvas.height - 2 };
}

export interface CatSprites {
  idle: Sprite;
  walk: Sprite[];
  sit: Sprite;
  sleep: Sprite;
  flip: CatSprites | null;
}

const cache = new Map<string, CatSprites>();

export function catSprites(profile: CatProfile): CatSprites {
  const existing = cache.get(profile.id);
  if (existing) return existing;

  const make = (pose: CatPose, frame: number): Sprite => {
    const source = createCanvas(W + 4, H + 4);
    const ctx = context(source);
    ctx.translate(2, 2);
    paintCat(ctx, profile, pose, frame);
    return finish(source, false);
  };

  const right: CatSprites = {
    idle: make('idle', 0),
    walk: [make('walk', 0), make('walk', 1), make('walk', 2), make('walk', 3)],
    sit: make('sit', 0),
    sleep: make('sleep', 0),
    flip: null,
  };
  const mirror = (sprite: Sprite): Sprite => {
    const canvas = createCanvas(sprite.canvas.width, sprite.canvas.height);
    const ctx = context(canvas);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite.canvas, 0, 0);
    return { canvas, bx: canvas.width / 2, by: canvas.height - 2 };
  };
  const mirrored: CatSprites = {
    idle: mirror(right.idle),
    walk: right.walk.map(mirror),
    sit: mirror(right.sit),
    sleep: mirror(right.sleep),
    flip: null,
  };
  right.flip = mirrored;
  cache.set(profile.id, right);
  return right;
}

/** A bigger portrait for the field notes, drawn from the same sprite. */
export function catPortrait(profile: CatProfile): HTMLCanvasElement {
  const canvas = createCanvas(44, 38);
  const ctx = context(canvas);
  const bg = ctx.createLinearGradient(0, 0, 0, 38);
  bg.addColorStop(0, '#dfe7c4');
  bg.addColorStop(1, '#c9d4a6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 44, 38);
  ctx.fillStyle = '#b6c292';
  ctx.fillRect(0, 29, 44, 9);
  ctx.fillStyle = '#a4b17f';
  for (let i = 0; i < 5; i++) ctx.fillRect(4 + i * 9, 33 + (i % 2), 4, 1);
  const sprite = catSprites(profile).sit;
  const scale = 2;
  const w = sprite.canvas.width * scale;
  const h = sprite.canvas.height * scale;
  ctx.drawImage(sprite.canvas, Math.round(22 - w / 2), Math.round(34 - h), w, h);
  return canvas;
}
