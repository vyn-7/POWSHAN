import { createCanvas, context, outlined, px, rect, type Ctx } from '../core/canvas';
import { C } from './palette';
import type { Sprite } from './nature';
import type { Dir } from '../core/input';

/* Painted at 2x and drawn at half size, so the face and the butterfly clip
 * survive the upscale to a monitor. */
const W = 40;
const H = 60;
const DETAIL = 0.5;

type FarmerSprites = Record<Dir, Sprite[]>;

export type FarmerAvatar = 'boy' | 'girl';

function map(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  rect(ctx, x, y, w, h, color);
}

function boot(ctx: Ctx, x: number, y: number, facing: 'front' | 'side'): void {
  if (facing === 'front') {
    map(ctx, x, y, 7, 2, C.bootDark);
    map(ctx, x, y - 3, 7, 4, C.boot);
    map(ctx, x + 1, y - 3, 2, 3, '#8a5b3d');
    px(ctx, x + 4, y - 2, C.bootDark);
    px(ctx, x + 5, y - 1, C.bootDark);
  } else {
    map(ctx, x, y - 2, 8, 4, C.bootDark);
    map(ctx, x, y - 3, 7, 4, C.boot);
    map(ctx, x + 1, y - 3, 2, 3, '#8a5b3d');
    px(ctx, x + 5, y - 2, C.bootDark);
  }
}

function overallsLeg(ctx: Ctx, x: number, y: number, h: number): void {
  map(ctx, x, y, 8, h, C.denimDark);
  map(ctx, x + 1, y, 6, h, C.denim);
  map(ctx, x + 1, y, 2, h, C.denimLight);
  map(ctx, x, y + h - 1, 8, 1, C.denimDark);
  px(ctx, x + 6, y + 2, C.denimDark);
  px(ctx, x + 3, y + h - 3, C.denimDark);
}

function torso(ctx: Ctx, dir: Dir, bob: number): void {
  const y = 26 + bob;
  if (dir === 'left' || dir === 'right') {
    // Side profile: only the chest-to-back depth, tapered in at the waist so
    // the farmer reads slim from the side instead of as a denim barrel.
    map(ctx, 13, y + 1, 14, 16, C.shirtShade);
    map(ctx, 14, y + 1, 12, 14, C.shirt);
    map(ctx, 14, y + 1, 3, 13, C.cream);
    // bib across the lower torso, one strap over the near shoulder
    map(ctx, 15, y + 6, 11, 10, C.denim);
    map(ctx, 16, y + 6, 3, 9, C.denimLight);
    map(ctx, 24, y + 6, 2, 10, C.denimDark);
    map(ctx, 15, y + 1, 3, 6, C.denim);
    map(ctx, 18, y + 1, 2, 2, C.gold);
    px(ctx, 16, y + 6, C.gold);
    map(ctx, 15, y + 10, 11, 2, C.denimDark);
    // collar and neck at the front
    map(ctx, 18, y, 3, 3, C.skinShade);
    px(ctx, 17, y, C.cream);
    px(ctx, 21, y, C.cream);
  } else {
    map(ctx, 8, y + 1, 24, 17, C.shirtShade);
    map(ctx, 9, y + 1, 22, 15, C.shirt);
    map(ctx, 10, y + 1, 2, 14, C.cream);
    map(ctx, 28, y + 1, 2, 15, C.shirtShade);
    // overall bib
    map(ctx, 13, y + 7, 15, 11, C.denim);
    map(ctx, 14, y + 7, 2, 10, C.denimLight);
    map(ctx, 26, y + 7, 2, 10, C.denimDark);
    map(ctx, 13, y + 1, 4, 7, C.denim);
    map(ctx, 24, y + 1, 4, 7, C.denim);
    px(ctx, 14, y + 7, C.gold);
    px(ctx, 26, y + 7, C.goldDeep);
    // collar and neck
    map(ctx, 18, y, 5, 3, C.skinShade);
    px(ctx, 17, y, C.cream);
    px(ctx, 23, y, C.cream);
  }
}

function faceDetails(ctx: Ctx, x: number, y: number, girl: boolean): void {
  // eyes: a two-pixel pupil with a highlight, set into a soft socket
  map(ctx, x + 3, y + 5, 3, 4, C.skinShade);
  map(ctx, x + 9, y + 5, 3, 4, C.skinShade);
  map(ctx, x + 4, y + 6, 2, 3, C.inkSoft);
  map(ctx, x + 10, y + 6, 2, 3, C.inkSoft);
  px(ctx, x + 4, y + 6, '#fff6e0');
  px(ctx, x + 10, y + 6, '#fff6e0');
  if (girl) {
    // lashes at the outer corners
    px(ctx, x + 3, y + 5, C.ink);
    px(ctx, x + 9, y + 5, C.ink);
    px(ctx, x + 3, y + 6, C.inkSoft);
    px(ctx, x + 9, y + 6, C.inkSoft);
    // blush
    map(ctx, x + 1, y + 9, 3, 2, '#e8a087');
    map(ctx, x + 12, y + 9, 3, 2, '#e8a087');
  }
  // nose and mouth
  px(ctx, x + 7, y + 10, C.skinShade);
  px(ctx, x + 7, y + 11, C.skinDark);
  if (girl) {
    map(ctx, x + 6, y + 13, 3, 1, '#c4705f');
  } else {
    map(ctx, x + 6, y + 13, 3, 1, C.skinDark);
  }
}

/** A small purple bow: two loops and a dark knot. */
function ribbon(ctx: Ctx, cx: number, cy: number): void {
  map(ctx, cx - 3, cy - 1, 2, 2, C.clip);
  map(ctx, cx + 1, cy - 1, 2, 2, C.clipLight);
  map(ctx, cx - 2, cy + 1, 2, 1, C.clipLight);
  map(ctx, cx + 1, cy + 1, 2, 1, C.clip);
  px(ctx, cx - 1, cy, C.clipDark);
  px(ctx, cx, cy, C.clipDark);
  px(ctx, cx - 1, cy + 1, C.clipDark);
  px(ctx, cx, cy + 1, C.clipDark);
}

function headDown(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 12 + bob;
  // hair behind the face
  map(ctx, 10, y + 1, 20, 15, C.hair);
  map(ctx, 10, y + 1, 3, 14, C.hairLight);
  map(ctx, 28, y + 2, 2, 14, C.hair);
  if (girl) {
    // long hair down past the shoulders, tucked behind the ears
    map(ctx, 8, y + 9, 4, 14, C.hair);
    map(ctx, 28, y + 9, 4, 14, C.hair);
    map(ctx, 8, y + 9, 1, 13, C.hairLight);
    px(ctx, 8, y + 22, C.hairLight);
    px(ctx, 30, y + 22, C.hair);
    // a little fringe framing each cheek
    map(ctx, 12, y + 11, 2, 6, C.hair);
    map(ctx, 26, y + 11, 2, 6, C.hair);
  }
  // face
  map(ctx, 13, y + 3, 14, 13, C.skin);
  map(ctx, 13, y + 13, 14, 3, C.skinShade);
  px(ctx, 12, y + 8, C.skinShade);
  px(ctx, 27, y + 8, C.skinShade);
  faceDetails(ctx, 13, y + 3, girl);
  if (girl) {
    // a braid over the near shoulder, tied with a purple ribbon
    map(ctx, 26, y + 15, 4, 3, C.hair);
    map(ctx, 25, y + 18, 4, 3, C.hair);
    map(ctx, 26, y + 21, 4, 3, C.hair);
    map(ctx, 25, y + 24, 4, 3, C.hair);
    px(ctx, 26, y + 16, C.hairLight);
    px(ctx, 25, y + 19, C.hairLight);
    px(ctx, 26, y + 22, C.hairLight);
    px(ctx, 25, y + 25, C.hairLight);
    map(ctx, 25, y + 27, 4, 2, C.clip);
    map(ctx, 25, y + 29, 3, 2, C.hair);
  }
  // hair fringe under the hat
  map(ctx, 12, y + 1, 16, 4, C.hair);
  map(ctx, 13, y + 1, 5, 2, C.hairLight);
  map(ctx, 21, y + 3, 7, 2, C.hair);
  map(ctx, 10, y + 2, 2, 10, C.hair);
  map(ctx, 28, y + 2, 2, 10, C.hair);
  // ears
  px(ctx, 12, y + 9, C.skin);
  px(ctx, 27, y + 9, C.skin);
}

function headUp(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 12 + bob;
  map(ctx, 10, y + 1, 20, 17, C.hair);
  map(ctx, 10, y + 1, 4, 16, C.hairLight);
  map(ctx, 12, y + 3, 16, 14, C.hair);
  map(ctx, 19, y + 1, 4, 2, C.hairLight);
  map(ctx, 15, y + 14, 10, 2, C.hairLight);
  if (girl) {
    // hair falling to the shoulders, seen from behind
    map(ctx, 8, y + 10, 24, 12, C.hair);
    map(ctx, 9, y + 10, 4, 11, C.hairLight);
    map(ctx, 10, y + 21, 20, 2, C.hair);
    map(ctx, 8, y + 20, 3, 4, C.hair);
    map(ctx, 29, y + 20, 3, 4, C.hair);
    // braid down the back, tied with the same purple ribbon
    map(ctx, 22, y + 18, 4, 3, C.hair);
    map(ctx, 23, y + 21, 4, 3, C.hair);
    map(ctx, 22, y + 24, 4, 3, C.hair);
    map(ctx, 23, y + 27, 4, 3, C.hair);
    px(ctx, 22, y + 19, C.hairLight);
    px(ctx, 23, y + 22, C.hairLight);
    px(ctx, 22, y + 25, C.hairLight);
    px(ctx, 23, y + 28, C.hairLight);
    map(ctx, 22, y + 30, 4, 2, C.clip);
  }
  // a little tuft at the nape
  px(ctx, 16, y + 17, C.hair);
  px(ctx, 23, y + 17, C.hair);
}

function headSide(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 12 + bob;
  // Hair mass at the back of the head, kept slim so the profile isn't oversized.
  map(ctx, 18, y + 1, 12, 16, C.hair);
  map(ctx, 24, y + 2, 6, 14, C.hairLight);
  map(ctx, 18, y + 1, 3, 15, C.hair);
  if (girl) {
    // long hair down the nape, with a braid tied off in a purple ribbon
    map(ctx, 26, y + 9, 5, 13, C.hair);
    map(ctx, 27, y + 9, 2, 12, C.hairLight);
    map(ctx, 28, y + 14, 4, 3, C.hair);
    map(ctx, 27, y + 17, 4, 3, C.hair);
    map(ctx, 28, y + 20, 3, 3, C.hair);
    px(ctx, 28, y + 15, C.hairLight);
    px(ctx, 27, y + 18, C.hairLight);
    px(ctx, 28, y + 21, C.hairLight);
    ribbon(ctx, 28, y + 23);
  }
  // Face skin at the front.
  map(ctx, 12, y + 3, 12, 12, C.skin);
  // Lower face: keep the girl's jaw and chin in plain skin — a shade band here
  // read as a beard. The boy keeps a light jaw plane.
  if (girl) map(ctx, 12, y + 12, 11, 3, C.skin);
  else map(ctx, 12, y + 12, 11, 3, C.skinShade);
  // forehead/hairline under the hat
  map(ctx, 12, y + 1, 13, 4, C.hair);
  map(ctx, 13, y + 1, 7, 2, C.hairLight);
  // nose bump at the very front
  map(ctx, 11, y + 7, 2, 4, C.skin);
  px(ctx, 11, y + 10, C.skinDark);
  px(ctx, 12, y + 11, C.skinShade);
  // eye and brow
  map(ctx, 15, y + 5, 3, 4, C.skinShade);
  map(ctx, 16, y + 6, 2, 3, C.inkSoft);
  px(ctx, 16, y + 6, '#fff6e0');
  if (girl) {
    // lashes at the front corner and a soft blush
    px(ctx, 15, y + 5, C.ink);
    px(ctx, 15, y + 6, C.inkSoft);
    map(ctx, 13, y + 9, 3, 2, '#e8a087');
  }
  // mouth, with no chin shadow (it read as a beard)
  if (girl) map(ctx, 13, y + 12, 3, 1, '#c4705f');
  else map(ctx, 13, y + 12, 3, 1, C.skinDark);
  // ear, with the sideburn in front of it
  map(ctx, 21, y + 3, 2, 7, C.hair);
  px(ctx, 23, y + 7, C.skin);
  px(ctx, 23, y + 8, C.skin);
  px(ctx, 24, y + 8, C.skinShade);
}

/** A purple butterfly pinned in the back of the hair: wide upper wings pinched
 *  at the waist, smaller lower wings with spots, a dark body and two antennae.
 *  Only drawn from the side and back, where the back of the head is visible. */
function butterflyClip(ctx: Ctx, cx: number, cy: number): void {
  // upper wings, wide and stepped outward
  map(ctx, cx - 4, cy - 4, 2, 1, C.clipLight);
  map(ctx, cx + 1, cy - 4, 3, 1, C.clip);
  map(ctx, cx - 5, cy - 3, 4, 1, C.clipLight);
  map(ctx, cx + 1, cy - 3, 5, 1, C.clip);
  map(ctx, cx - 6, cy - 2, 5, 2, C.clipLight);
  map(ctx, cx + 1, cy - 2, 6, 2, C.clip);
  // lower wings, smaller
  map(ctx, cx - 4, cy, 3, 1, C.clipLight);
  map(ctx, cx + 1, cy, 4, 1, C.clip);
  map(ctx, cx - 5, cy + 1, 4, 1, C.clipLight);
  map(ctx, cx + 1, cy + 1, 5, 1, C.clip);
  map(ctx, cx - 4, cy + 2, 3, 1, C.clipLight);
  map(ctx, cx + 1, cy + 2, 4, 1, C.clip);
  map(ctx, cx - 3, cy + 3, 2, 1, C.clipDark);
  map(ctx, cx + 1, cy + 3, 3, 1, C.clipDark);
  // dark outer edge so the shape holds against the hair
  px(ctx, cx - 6, cy - 1, C.clipDark);
  px(ctx, cx + 6, cy - 1, C.clipDark);
  px(ctx, cx - 5, cy - 4, C.clipDark);
  px(ctx, cx + 5, cy - 4, C.clipDark);
  // wing spots
  px(ctx, cx - 4, cy - 2, C.clip);
  px(ctx, cx + 3, cy - 2, C.clipLight);
  px(ctx, cx - 4, cy + 1, C.clip);
  px(ctx, cx + 3, cy + 1, C.clipLight);
  // body and head
  map(ctx, cx - 1, cy - 3, 2, 7, C.inkSoft);
  px(ctx, cx - 1, cy - 4, C.inkSoft);
  px(ctx, cx, cy - 4, C.inkSoft);
  // antennae
  px(ctx, cx - 2, cy - 5, C.inkSoft);
  px(ctx, cx - 3, cy - 6, C.inkSoft);
  px(ctx, cx + 1, cy - 5, C.inkSoft);
  px(ctx, cx + 2, cy - 6, C.inkSoft);
}

function hat(ctx: Ctx, dir: Dir, bob: number): void {
  const y = 2 + bob;
  // crown
  map(ctx, 11, y + 1, 18, 8, C.hatShade);
  map(ctx, 12, y, 16, 7, C.hat);
  map(ctx, 14, y, 9, 2, C.hatLight);
  map(ctx, 11, y + 6, 18, 3, C.hatBand);
  px(ctx, 11, y + 6, '#8f3b2c');
  px(ctx, 27, y + 7, C.hatBand);
  // brim
  map(ctx, 5, y + 9, 30, 3, C.hatShade);
  map(ctx, 6, y + 8, 28, 3, C.hat);
  map(ctx, 8, y + 8, 20, 1, C.hatLight);
  px(ctx, 5, y + 11, C.inkSoft);
  px(ctx, 34, y + 11, C.inkSoft);
  // wheat sprig in the band
  if (dir !== 'up') {
    map(ctx, 27, y + 4, 1, 4, C.gold);
    px(ctx, 28, y + 3, C.gold);
    px(ctx, 26, y + 3, C.goldDeep);
    px(ctx, 28, y + 5, C.goldDeep);
  }
}

function armDown(ctx: Ctx, side: 'left' | 'right', dir: Dir, swing: number, bob: number): void {
  const x = side === 'left' ? 5 : 30;
  const y = 28 + bob + swing;
  if (dir === 'left' || dir === 'right') {
    // the near arm only
    map(ctx, 20, 29 + bob + swing, 4, 11, C.shirt);
    map(ctx, 21, 29 + bob + swing, 2, 10, C.cream);
    map(ctx, 21, 38 + bob + swing, 3, 3, C.skin);
    return;
  }
  map(ctx, x, y, 5, 11, C.shirt);
  map(ctx, x + (side === 'left' ? 1 : 0), y + 1, 2, 9, C.cream);
  map(ctx, x + (side === 'left' ? 1 : 2), y + 10, 3, 3, C.skin);
  px(ctx, x + (side === 'left' ? 1 : 2), y + 10, C.skinShade);
}

function drawFarmer(ctx: Ctx, dir: Dir, frame: number, girl: boolean): void {
  const bob = frame === 2 ? -1 : 0;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;

  // legs
  const stride = frame === 1 ? 2 : frame === 3 ? -2 : 0;
  if (dir === 'left' || dir === 'right') {
    // Side view: the legs overlap into one stride rather than standing in two
    // planted columns. The far leg sits a touch back and in shadow.
    overallsLeg(ctx, 16 + stride, 42, 12);
    overallsLeg(ctx, 14 - stride, 42, 12);
    boot(ctx, 15 + stride, 58, 'side');
    boot(ctx, 13 - stride, 58, 'side');
  } else {
    overallsLeg(ctx, 10, 42, 13);
    overallsLeg(ctx, 22, 42, 13);
    if (dir === 'down') {
      boot(ctx, 9, 58, 'front');
      boot(ctx, 23, 58, 'front');
    } else {
      map(ctx, 10, 55, 7, 3, C.bootDark);
      map(ctx, 23, 55, 7, 3, C.bootDark);
      px(ctx, 11, 55, C.boot);
      px(ctx, 24, 55, C.boot);
    }
    // offset feet for the walk
    if (frame === 1) map(ctx, 23, 56, 7, 2, C.bootDark);
    if (frame === 3) map(ctx, 10, 56, 7, 2, C.bootDark);
  }

  torso(ctx, dir, bob);

  if (dir === 'down') {
    headDown(ctx, bob, girl);
  } else if (dir === 'up') {
    headUp(ctx, bob, girl);
  } else {
    headSide(ctx, bob, girl);
  }

  if (dir === 'down' || dir === 'up') {
    armDown(ctx, 'left', dir, -swing, bob);
    armDown(ctx, 'right', dir, swing, bob);
  } else {
    armDown(ctx, 'right', dir, swing, bob);
  }

  // belt
  if (dir !== 'left' && dir !== 'right') {
    map(ctx, 10, 40, 8, 2, C.denimDark);
    map(ctx, 22, 40, 8, 2, C.denimDark);
  }

  hat(ctx, dir, bob);

  // The butterfly clip is pinned in the back of the hair, so it only shows
  // from the side and back — never from the front.
  if (girl && dir !== 'down') {
    butterflyClip(ctx, dir === 'up' ? 20 : 26, 20 + bob);
  }
}

function finish(source: HTMLCanvasElement, dir: Dir): Sprite {
  const out = outlined(source, C.ink, 2);
  if (dir === 'right') {
    const canvas = createCanvas(out.width, out.height);
    const ctx = context(canvas);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(out, 0, 0);
    return { canvas, bx: canvas.width / 2, by: canvas.height - 4, scale: DETAIL };
  }
  return { canvas: out, bx: out.width / 2, by: out.height - 4, scale: DETAIL };
}

const caches = new Map<FarmerAvatar, FarmerSprites>();

export function farmerSprites(avatar: FarmerAvatar = 'boy'): FarmerSprites {
  const cached = caches.get(avatar);
  if (cached) return cached;
  const girl = avatar === 'girl';
  const dirs: Dir[] = ['down', 'up', 'left', 'right'];
  const result = {} as FarmerSprites;
  for (const dir of dirs) {
    result[dir] = [];
    for (let frame = 0; frame < 4; frame++) {
      const source = createCanvas(W + 8, H + 8);
      const ctx = context(source);
      ctx.translate(4, 4);
      drawFarmer(ctx, dir, frame, girl);
      result[dir].push(finish(source, dir));
    }
  }
  caches.set(avatar, result);
  return result;
}

/** A small portrait for dialogue and the journal. */
export function farmerPortrait(avatar: FarmerAvatar = 'boy'): HTMLCanvasElement {
  const canvas = createCanvas(40, 40);
  const ctx = context(canvas);
  ctx.imageSmoothingEnabled = false;
  const frame = farmerSprites(avatar).down[0];
  const size = 1;
  ctx.drawImage(
    frame.canvas,
    Math.round(20 - (frame.canvas.width * size) / 2),
    Math.round(40 - frame.canvas.height * size + 30),
    frame.canvas.width * size,
    frame.canvas.height * size,
  );
  return canvas;
}

/** A head-and-shoulders crop used by the moving-day character picker. */
export function farmerBust(avatar: FarmerAvatar = 'boy'): HTMLCanvasElement {
  const canvas = createCanvas(48, 48);
  const ctx = context(canvas);
  ctx.imageSmoothingEnabled = false;
  const bg = ctx.createLinearGradient(0, 0, 0, 48);
  bg.addColorStop(0, '#e7edc9');
  bg.addColorStop(0.62, '#cdd9a8');
  bg.addColorStop(1, '#aebd87');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 48, 48);
  ctx.fillStyle = '#b9c795';
  for (let y = 32; y < 48; y += 3) {
    for (let x = (y % 2) * 2; x < 48; x += 5) ctx.fillRect(x, y, 2, 1);
  }
  ctx.fillStyle = 'rgba(255, 249, 222, 0.42)';
  ctx.fillRect(0, 0, 48, 1);
  const frame = farmerSprites(avatar).down[0];
  const size = 1;
  const w = frame.canvas.width * size;
  const h = frame.canvas.height * size;
  ctx.drawImage(frame.canvas, Math.round(24 - w / 2), Math.round(72 - h), w, h);
  return canvas;
}
