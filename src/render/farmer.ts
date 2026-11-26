import { createCanvas, context, outlined, px, rect, type Ctx } from '../core/canvas';
import { C } from './palette';
import type { Sprite } from './nature';
import type { Dir } from '../core/input';

const W = 20;
const H = 30;

type FarmerSprites = Record<Dir, Sprite[]>;

export type FarmerAvatar = 'boy' | 'girl';

function map(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  rect(ctx, x, y, w, h, color);
}

function boot(ctx: Ctx, x: number, y: number, facing: 'front' | 'side'): void {
  if (facing === 'front') {
    map(ctx, x, y, 4, 2, C.bootDark);
    map(ctx, x, y - 1, 4, 2, C.boot);
    px(ctx, x, y - 1, '#8a5b3d');
    px(ctx, x + 2, y - 1, C.bootDark);
  } else {
    map(ctx, x, y - 1, 4, 3, C.bootDark);
    map(ctx, x, y - 1, 3, 2, C.boot);
    px(ctx, x + 1, y - 1, '#8a5b3d');
  }
}

function overallsLeg(ctx: Ctx, x: number, y: number, h: number, wet = false): void {
  map(ctx, x, y, 4, h, C.denimDark);
  map(ctx, x + 1, y, 2, h, wet ? '#41617a' : C.denim);
  map(ctx, x + 1, y, 1, h, C.denimLight);
  map(ctx, x, y + h - 1, 4, 1, C.denimDark);
}

function torso(ctx: Ctx, dir: Dir, bob: number): void {
  const y = 15 + bob;
  if (dir === 'left' || dir === 'right') {
    map(ctx, 6, y, 9, 8, C.shirtShade);
    map(ctx, 6, y, 8, 7, C.shirt);
    map(ctx, 7, y, 1, 6, C.cream);
    map(ctx, 6, y + 6, 8, 2, C.denim);
    map(ctx, 7, y + 5, 6, 3, C.denim);
    map(ctx, 10, y + 5, 3, 3, C.denimDark);
  } else {
    map(ctx, 4, y + 1, 12, 8, C.shirtShade);
    map(ctx, 5, y + 1, 10, 7, C.shirt);
    map(ctx, 5, y + 1, 1, 6, C.cream);
    map(ctx, 14, y + 1, 1, 7, C.shirtShade);
    // overall bib
    map(ctx, 6, y + 4, 8, 6, C.denim);
    map(ctx, 6, y + 4, 1, 5, C.denimLight);
    map(ctx, 13, y + 4, 1, 5, C.denimDark);
    map(ctx, 6, y + 1, 2, 4, C.denim);
    map(ctx, 12, y + 1, 2, 4, C.denim);
    px(ctx, 6, y + 4, C.gold);
    px(ctx, 13, y + 4, C.goldDeep);
    // collar
    map(ctx, 9, y, 2, 2, C.skinShade);
    px(ctx, 8, y, C.cream);
    px(ctx, 11, y, C.cream);
  }
}

function headDown(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 6 + bob;
  // hair behind the face
  map(ctx, 5, y + 1, 10, 6, C.hair);
  map(ctx, 5, y + 1, 1, 5, C.hairLight);
  map(ctx, 14, y + 2, 1, 5, C.hair);
  if (girl) {
    // longer hair past the jaw, tucked behind the ear
    map(ctx, 4, y + 5, 2, 5, C.hair);
    map(ctx, 14, y + 5, 2, 5, C.hair);
    px(ctx, 4, y + 9, C.hairLight);
    px(ctx, 15, y + 9, C.hair);
  }
  // face
  map(ctx, 6, y + 1, 8, 8, C.skin);
  map(ctx, 6, y + 7, 8, 2, C.skinShade);
  px(ctx, 5, y + 4, C.skinShade);
  px(ctx, 14, y + 4, C.skinShade);
  // fine features
  px(ctx, 7, y + 3, C.inkSoft);
  px(ctx, 12, y + 3, C.inkSoft);
  px(ctx, 7, y + 4, C.skinShade);
  px(ctx, 12, y + 4, C.skinShade);
  px(ctx, 9, y + 4, C.skinShade);
  px(ctx, 10, y + 4, C.skinShade);
  map(ctx, 8, y + 6, 1, 1, C.skinDark);
  map(ctx, 11, y + 6, 1, 1, C.skinDark);
  px(ctx, 9, y + 7, C.skinDark);
  px(ctx, 10, y + 7, C.skinDark);
  // hair fringe under the hat
  map(ctx, 6, y, 8, 2, C.hair);
  px(ctx, 7, y, C.hairLight);
  px(ctx, 8, y + 1, C.hairLight);
  map(ctx, 5, y + 2, 1, 4, C.hair);
  map(ctx, 14, y + 2, 1, 4, C.hair);
  map(ctx, 9, y + 1, 1, 1, C.skin);
  map(ctx, 10, y + 1, 1, 1, C.skin);
}

function headUp(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 6 + bob;
  map(ctx, 5, y + 1, 10, 8, C.hair);
  map(ctx, 5, y + 1, 2, 8, C.hairLight);
  map(ctx, 6, y + 2, 8, 6, C.hair);
  map(ctx, 9, y + 1, 2, 1, C.hairLight);
  map(ctx, 7, y + 7, 6, 1, C.hairLight);
  if (girl) {
    // hair falling to the shoulders, seen from behind
    map(ctx, 5, y + 8, 10, 3, C.hair);
    map(ctx, 5, y + 8, 2, 3, C.hairLight);
    map(ctx, 6, y + 11, 8, 1, C.hair);
  }
  // a little tuft at the nape
  px(ctx, 8, y + 8, C.hair);
  px(ctx, 11, y + 8, C.hair);
}

function headSide(ctx: Ctx, bob: number, girl: boolean): void {
  const y = 6 + bob;
  // Facing left: the face is at the front (low x), hair falls at the back (high x).
  // Hair mass at the back of the head.
  map(ctx, 9, y + 1, 6, 8, C.hair);
  map(ctx, 12, y + 1, 3, 8, C.hairLight);
  map(ctx, 9, y + 1, 1, 8, C.hair);
  if (girl) {
    // ponytail at the nape (back), and a wisp in front of the ear
    map(ctx, 13, y + 6, 3, 4, C.hair);
    map(ctx, 13, y + 6, 1, 4, C.hairLight);
    px(ctx, 15, y + 10, C.hair);
  }
  // Face skin at the front.
  map(ctx, 5, y + 2, 6, 7, C.skin);
  map(ctx, 5, y + 6, 5, 3, C.skinShade);
  // forehead/hairline under the hat
  map(ctx, 5, y + 1, 7, 2, C.hair);
  map(ctx, 5, y + 1, 4, 1, C.hairLight);
  // nose at the very front
  px(ctx, 4, y + 4, C.skin);
  px(ctx, 4, y + 5, C.skinDark);
  // eye and brow
  map(ctx, 7, y + 3, 1, 2, C.inkSoft);
  px(ctx, 7, y + 4, C.skinShade);
  // mouth and cheek
  px(ctx, 5, y + 7, C.skinDark);
  px(ctx, 6, y + 7, C.skinDark);
  // sideburn in front of the ear
  map(ctx, 10, y + 2, 1, 3, C.hair);
}

function butterflyClip(ctx: Ctx, dir: Dir, bob: number): void {
  const y = 6 + bob;
  const x = dir === 'left' ? 4 : 14;
  // A purple butterfly clip pinned in the hat band: four wings, a dark body,
  // and a 1px ink outline so it reads against the straw.
  map(ctx, x - 2, y - 2, 2, 2, C.clipDark);
  map(ctx, x + 1, y - 2, 2, 2, C.clipDark);
  map(ctx, x - 2, y, 2, 2, C.clipDark);
  map(ctx, x + 1, y, 2, 2, C.clipDark);
  map(ctx, x - 2, y - 2, 2, 2, C.clip);
  map(ctx, x + 1, y - 2, 2, 2, C.clipLight);
  map(ctx, x - 2, y, 2, 2, C.clipLight);
  map(ctx, x + 1, y, 2, 2, C.clip);
  map(ctx, x, y - 2, 1, 4, C.inkSoft);
  px(ctx, x - 1, y - 3, C.inkSoft);
  px(ctx, x + 1, y - 3, C.inkSoft);
}

function hat(ctx: Ctx, dir: Dir, bob: number, girl: boolean): void {
  const y = 3 + bob;
  // crown
  map(ctx, 5, y - 1, 10, 4, C.hatShade);
  map(ctx, 6, y - 2, 8, 3, C.hat);
  map(ctx, 7, y - 2, 5, 1, C.hatLight);
  map(ctx, 5, y + 2, 10, 2, C.hatBand);
  px(ctx, 5, y + 2, '#8f3b2c');
  // brim
  map(ctx, 2, y + 4, 16, 2, C.hatShade);
  map(ctx, 3, y + 3, 14, 2, C.hat);
  map(ctx, 4, y + 3, 11, 1, C.hatLight);
  px(ctx, 2, y + 5, C.inkSoft);
  px(ctx, 17, y + 5, C.inkSoft);
  // wheat sprig in the band
  if (dir !== 'up') {
    map(ctx, 13, y + 1, 1, 3, C.gold);
    px(ctx, 14, y, C.gold);
    px(ctx, 12, y, C.goldDeep);
    px(ctx, 14, y + 2, C.goldDeep);
  }
  if (girl) butterflyClip(ctx, dir, bob);
}

function armDown(ctx: Ctx, side: 'left' | 'right', dir: Dir, swing: number, bob: number): void {
  const x = side === 'left' ? 2 : 15;
  const y = 16 + bob + swing;
  if (dir === 'left' || dir === 'right') {
    // the near arm only
    map(ctx, 8, 17 + bob + swing, 2, 6, C.shirt);
    map(ctx, 8, 22 + bob + swing, 2, 2, C.skin);
  } else {
    map(ctx, x, y, 3, 6, C.shirt);
    map(ctx, x + (side === 'left' ? 0 : 1), y + 6, 2, 2, C.skin);
    map(ctx, x + (side === 'left' ? 1 : 0), y + 1, 1, 4, C.cream);
  }
}

function drawFarmer(ctx: Ctx, dir: Dir, frame: number, girl: boolean): void {
  const bob = frame === 2 ? -1 : 0;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;

  // legs
  const stride = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  if (dir === 'left' || dir === 'right') {
    overallsLeg(ctx, 6 + stride, 23, 4);
    overallsLeg(ctx, 8 - stride, 23, 4);
    boot(ctx, 5 + stride, 29, 'side');
    boot(ctx, 8 - stride, 29, 'side');
  } else {
    overallsLeg(ctx, 5, 23, 5);
    overallsLeg(ctx, 11, 23, 5);
    if (dir === 'down') {
      boot(ctx, 5, 29, 'front');
      boot(ctx, 11, 29, 'front');
    } else {
      map(ctx, 5, 27, 4, 2, C.bootDark);
      map(ctx, 11, 27, 4, 2, C.bootDark);
      px(ctx, 5, 27, C.boot);
      px(ctx, 11, 27, C.boot);
    }
    // offset feet for the walk
    if (frame === 1) map(ctx, 11, 28, 4, 1, C.bootDark);
    if (frame === 3) map(ctx, 5, 28, 4, 1, C.bootDark);
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

  // belt, rolled cuffs
  if (dir !== 'left' && dir !== 'right') {
    map(ctx, 5, 22, 4, 1, C.denimDark);
    map(ctx, 11, 22, 4, 1, C.denimDark);
  }

  hat(ctx, dir, bob, girl);

  if (dir === 'left' || dir === 'right') {
    // outline the back of the hat and a little nose shadow
    px(ctx, 4, 11 + bob, C.inkSoft);
    px(ctx, 15, 12 + bob, C.hatShade);
  }
}

function finish(source: HTMLCanvasElement, dir: Dir): Sprite {
  const out = outlined(source, C.ink, 1);
  if (dir === 'right') {
    const canvas = createCanvas(out.width, out.height);
    const ctx = context(canvas);
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(out, 0, 0);
    return { canvas, bx: canvas.width / 2, by: canvas.height - 2 };
  }
  return { canvas: out, bx: out.width / 2, by: out.height - 2 };
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
      const source = createCanvas(W + 4, H + 4);
      const ctx = context(source);
      ctx.translate(2, 2);
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
  const size = 2;
  ctx.drawImage(
    frame.canvas,
    Math.round(20 - (frame.canvas.width * size) / 2),
    Math.round(42 - frame.canvas.height * size) + 4,
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
  const scale = 2;
  const w = frame.canvas.width * scale;
  const h = frame.canvas.height * scale;
  ctx.drawImage(frame.canvas, Math.round(24 - w / 2), Math.round(70 - h), w, h);
  return canvas;
}
