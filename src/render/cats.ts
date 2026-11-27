import { createCanvas, context, ellipse, linePx, outlined, px, rect, type Ctx } from '../core/canvas';
import type { CatProfile } from '../data/cats';
import { C } from './palette';
import type { Sprite } from './nature';

export type CatPose = 'idle' | 'walk' | 'sit' | 'sleep';

/* Cats are painted at twice the resolution of the world and drawn at half
 * size. The footprint stays the same, but the face, ears and markings get
 * enough pixels to actually read on screen. */
const W = 40;
const H = 32;
const DETAIL = 0.5;

function stroke(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string, width = 3): void {
  const r = Math.max(0, Math.floor(width / 2));
  for (let oy = -r; oy <= r; oy++) {
    for (let ox = -r; ox <= r; ox++) {
      linePx(ctx, x0 + ox, y0 + oy, x1 + ox, y1 + oy, color);
    }
  }
}

function paw(ctx: Ctx, x: number, y: number, fur: string, toes: string | undefined): void {
  rect(ctx, x, y, 3, 5, fur);
  rect(ctx, x + 1, y + 1, 1, 3, 'rgba(255, 255, 255, 0.08)');
  if (toes) rect(ctx, x, y + 4, 3, 1, toes);
}

function tail(ctx: Ctx, profile: CatProfile, frame: number, sleeping: boolean): void {
  // A cat can carry one solid tail colour (Mumu's is black from base to tip).
  const fur = profile.colors.tail ?? profile.colors.fur;
  const furDark = profile.colors.tailDark ?? profile.colors.furDark;
  const tip = profile.colors.tail ?? profile.colors.accent ?? fur;
  if (sleeping) {
    stroke(ctx, 8, 28, 24, 28, furDark, 6);
    stroke(ctx, 8, 28, 24, 28, fur, 4);
    return;
  }
  const sway = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  // A slim tail curling up behind the haunch.
  stroke(ctx, 10, 22, 4, 15 + sway, furDark, 5);
  stroke(ctx, 4, 15 + sway, 4, 7 + sway, furDark, 5);
  stroke(ctx, 10, 22, 4, 15 + sway, fur, 3);
  stroke(ctx, 4, 15 + sway, 4, 7 + sway, fur, 3);
  // pale tip on cats that do not have a solid tail colour
  if (!profile.colors.tail) {
    rect(ctx, 2, 4 + sway, 4, 4, tip);
    px(ctx, 3, 3 + sway, tip);
  }
  px(ctx, 7, 17 + sway, furDark);
  px(ctx, 5, 11 + sway, furDark);
}

function body(ctx: Ctx, profile: CatProfile, frame: number): void {
  const { fur, furDark, belly, patch, accent } = profile.colors;
  const bob = frame === 2 ? 1 : 0;
  ellipse(ctx, 17, 20 + bob, 10, 6.5, furDark);
  ellipse(ctx, 17, 19 + bob, 9, 5.5, fur);
  ellipse(ctx, 17, 22 + bob, 6, 3, belly);
  if (patch) {
    ellipse(ctx, 13, 16 + bob, 4.5, 3, patch);
    px(ctx, 9, 15 + bob, patch);
    px(ctx, 16, 14 + bob, patch);
  }
  if (accent) rect(ctx, 22, 13 + bob, 7, 2, accent);
  // fur texture
  px(ctx, 9, 17 + bob, furDark);
  px(ctx, 14, 15 + bob, furDark);
  px(ctx, 21, 17 + bob, furDark);
}

function legs(ctx: Ctx, profile: CatProfile, frame: number, walking: boolean): void {
  const { furDark, toes } = profile.colors;
  const off = walking ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
  const liftA = walking && frame === 1 ? 1 : 0;
  const liftB = walking && frame === 3 ? 1 : 0;
  paw(ctx, 9 + off, 25 - liftA, furDark, toes);
  paw(ctx, 13 - off, 25 - liftB, furDark, toes);
  paw(ctx, 21 + off, 25 - liftB, furDark, toes);
  paw(ctx, 25 - off, 25 - liftA, furDark, toes);
}

function eye(ctx: Ctx, x: number, y: number, color: string, sleepy: boolean): void {
  if (sleepy) {
    rect(ctx, x - 1, y + 1, 3, 1, C.inkSoft);
    px(ctx, x - 2, y + 2, C.inkSoft);
    return;
  }
  // A tall oval eye with a big highlight: the thing that makes a cat read
  // as a cat rather than a fox at this size.
  rect(ctx, x - 1, y - 1, 3, 4, color);
  px(ctx, x - 1, y, color);
  px(ctx, x + 1, y + 2, color);
  px(ctx, x - 1, y, '#fff8e6');
  px(ctx, x - 1, y + 1, '#fff8e6');
  px(ctx, x + 1, y - 1, C.inkSoft);
}

function headAt(ctx: Ctx, profile: CatProfile, cx: number, cy: number, sleepy: boolean): void {
  const { fur, furDark, belly, patch, eyes } = profile.colors;
  const muzzle = profile.colors.muzzle ?? belly;

  // ears: two upright triangles on top of the skull
  // back ear
  rect(ctx, cx - 8, cy - 11, 5, 6, furDark);
  rect(ctx, cx - 7, cy - 11, 3, 4, fur);
  px(ctx, cx - 6, cy - 9, '#e39b9b');
  px(ctx, cx - 6, cy - 8, '#e39b9b');
  // front ear
  rect(ctx, cx + 3, cy - 11, 5, 6, furDark);
  rect(ctx, cx + 4, cy - 11, 3, 4, fur);
  px(ctx, cx + 5, cy - 9, '#e39b9b');
  px(ctx, cx + 5, cy - 8, '#e39b9b');
  px(ctx, cx - 3, cy - 10, fur);
  px(ctx, cx + 2, cy - 10, fur);

  // round skull
  ellipse(ctx, cx, cy, 8, 7, furDark);
  ellipse(ctx, cx, cy, 7, 6, fur);
  if (profile.fluffy) {
    // a Persian's cheek fluff spills past the jaw
    ellipse(ctx, cx - 2, cy + 3, 8, 4.5, fur);
    ellipse(ctx, cx + 2, cy + 4, 6.5, 3.5, fur);
  }
  if (patch && profile.headPatch !== false) {
    ellipse(ctx, cx - 3, cy - 4, 4, 3, patch);
    px(ctx, cx + 1, cy - 5, patch);
  }
  // tabby stripes on the forehead
  rect(ctx, cx - 1, cy - 7, 1, 2, furDark);
  px(ctx, cx + 1, cy - 7, furDark);

  // eyes, set wide on a front-facing face
  eye(ctx, cx - 4, cy - 1, eyes, sleepy);
  eye(ctx, cx + 3, cy - 1, eyes, sleepy);

  // short, centred muzzle
  ellipse(ctx, cx, cy + 4, 4, 3, muzzle);
  ellipse(ctx, cx, cy + 5, 3, 2, muzzle);
  // nose
  px(ctx, cx, cy + 2, '#d98c8c');
  px(ctx, cx + 1, cy + 2, '#d98c8c');
  px(ctx, cx, cy + 3, C.inkSoft);
  // mouth
  px(ctx, cx - 1, cy + 4, C.inkSoft);
  px(ctx, cx, cy + 4, C.inkSoft);
  px(ctx, cx + 1, cy + 4, C.inkSoft);

  // whiskers, both sides
  linePx(ctx, cx + 5, cy + 3, cx + 10, cy + 1, C.cream);
  linePx(ctx, cx + 5, cy + 5, cx + 10, cy + 6, C.cream);
  linePx(ctx, cx - 5, cy + 3, cx - 10, cy + 1, C.cream);
  linePx(ctx, cx - 5, cy + 5, cx - 10, cy + 6, C.cream);
}

function paintCat(ctx: Ctx, profile: CatProfile, pose: CatPose, frame: number): void {
  const { fur, furDark, belly } = profile.colors;
  const sleeping = profile.sleepiness > 0.7;

  if (pose === 'sleep') {
    const bob = frame === 2 ? 1 : 0;
    tail(ctx, profile, frame, true);
    ellipse(ctx, 16, 25 + bob, 10, 4.5, furDark);
    ellipse(ctx, 16, 24 + bob, 9, 3.5, fur);
    ellipse(ctx, 17, 26 + bob, 5, 2, belly);
    if (profile.colors.patch) ellipse(ctx, 12, 23 + bob, 4, 2, profile.colors.patch);
    headAt(ctx, profile, 27, 22 + bob, true);
    return;
  }

  if (pose === 'sit') {
    const bob = frame === 2 ? 1 : 0;
    const { fur, furDark, belly, toes, patch } = profile.colors;
    // tail curled on the ground behind (the back is to the left)
    stroke(ctx, 6, 28, 17, 29, profile.colors.tailDark ?? furDark, 6);
    stroke(ctx, 6, 28, 17, 29, profile.colors.tail ?? fur, 4);
    // haunch: a rounded rear resting on the ground
    ellipse(ctx, 12, 26 + bob, 7, 5, furDark);
    ellipse(ctx, 12, 25 + bob, 6, 4.5, fur);
    // torso rising from the haunch to the shoulder
    ellipse(ctx, 17, 21 + bob, 5.5, 8, furDark);
    ellipse(ctx, 17, 20 + bob, 5, 7.5, fur);
    // pale chest at the front
    ellipse(ctx, 20, 23 + bob, 3, 5, belly);
    if (patch) ellipse(ctx, 13, 18 + bob, 3, 3, patch);
    // front legs straight down at the front
    rect(ctx, 20, 22 + bob, 3, 7, furDark);
    rect(ctx, 21, 22 + bob, 2, 6, fur);
    if (toes) rect(ctx, 20, 28 + bob, 3, 1, toes);
    // head faces the viewer (as in idle/sleep), even though the body sits sideways
    headAt(ctx, profile, 18, 11 + bob, sleeping);
    return;
  }

  const walking = pose === 'walk';
  const bob = frame === 2 ? 1 : 0;
  tail(ctx, profile, frame, false);
  body(ctx, profile, frame);
  legs(ctx, profile, frame, walking);
  headAt(ctx, profile, 31, 15 + bob, sleeping);
}

function finish(source: HTMLCanvasElement): Sprite {
  const out = outlined(source, C.ink, 2);
  return { canvas: out, bx: out.width / 2, by: out.height - 4, scale: DETAIL };
}

export interface CatSprites {
  idle: Sprite;
  walk: Sprite[];
  sit: Sprite;
  sleep: Sprite;
}

const cache = new Map<string, CatSprites>();

export function catSprites(profile: CatProfile): CatSprites {
  const existing = cache.get(profile.id);
  if (existing) return existing;

  const make = (pose: CatPose, frame: number): Sprite => {
    const source = createCanvas(W + 8, H + 8);
    const ctx = context(source);
    ctx.translate(4, 4);
    paintCat(ctx, profile, pose, frame);
    return finish(source);
  };

  const sprites: CatSprites = {
    idle: make('idle', 0),
    walk: [make('walk', 0), make('walk', 1), make('walk', 2), make('walk', 3)],
    sit: make('sit', 0),
    sleep: make('sleep', 0),
  };
  cache.set(profile.id, sprites);
  return sprites;
}

/** A bigger portrait for the field notes, drawn from the same sprite. */
export function catPortrait(profile: CatProfile): HTMLCanvasElement {
  const canvas = createCanvas(56, 48);
  const ctx = context(canvas);
  const bg = ctx.createLinearGradient(0, 0, 0, 48);
  bg.addColorStop(0, '#dfe7c4');
  bg.addColorStop(1, '#c9d4a6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 56, 48);
  ctx.fillStyle = '#b6c292';
  ctx.fillRect(0, 36, 56, 12);
  ctx.fillStyle = '#a4b17f';
  for (let i = 0; i < 6; i++) ctx.fillRect(4 + i * 9, 41 + (i % 2), 4, 1);
  const sprite = catSprites(profile).sit;
  const scale = 0.86;
  const w = sprite.canvas.width * scale;
  const h = sprite.canvas.height * scale;
  ctx.drawImage(sprite.canvas, Math.round(28 - w / 2), Math.round(45 - h), w, h);
  return canvas;
}
