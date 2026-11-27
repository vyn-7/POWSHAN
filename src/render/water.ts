import type { Ctx } from '../core/canvas';
import { POND, STREAM } from '../world/layout';

/** Living water on top of the painted terrain: travelling stream dashes, pond
 *  ripples and a breathing waterfall. Everything is drawn in world pixels, so
 *  it stays locked to the banks while the camera moves. */
export function drawWater(ctx: Ctx, camX: number, camY: number, time: number): void {
  const cx = POND.cx - camX;
  const cy = POND.cy - camY;

  // ---- pond: slow bands drifting down the surface ----
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, POND.rx - 5, POND.ry - 4, 0, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 8; i++) {
    const phase = (time * 0.13 + i / 8) % 1;
    const y = cy - POND.ry + 4 + phase * (POND.ry * 2 - 8);
    const width = Math.sin(phase * Math.PI) * POND.rx * 1.15;
    if (width <= 0) continue;
    const x = cx - width / 2 + Math.sin(time * 0.6 + i * 1.7) * 6;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(207, 228, 212, 0.16)' : 'rgba(125, 184, 184, 0.2)';
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), 1);
  }
  // a soft darker trough at the bottom of the pond, for depth
  const depth = ctx.createLinearGradient(0, cy - POND.ry, 0, cy + POND.ry);
  depth.addColorStop(0, 'rgba(38, 108, 124, 0)');
  depth.addColorStop(0.62, 'rgba(28, 82, 99, 0.08)');
  depth.addColorStop(1, 'rgba(20, 58, 74, 0.3)');
  ctx.fillStyle = depth;
  ctx.fillRect(cx - POND.rx, cy - POND.ry, POND.rx * 2, POND.ry * 2);
  ctx.restore();

  // ---- pond: sparkles that catch the light and fade ----
  for (let i = 0; i < 16; i++) {
    const angle = i * 2.39 + Math.sin(time * 0.3 + i) * 0.08;
    const radius = 0.25 + ((i * 37) % 100) / 150;
    const x = cx + Math.cos(angle) * POND.rx * radius;
    const y = cy + Math.sin(angle) * POND.ry * radius;
    const blink = Math.sin(time * 1.5 + i * 1.9);
    if (blink < 0.35) continue;
    ctx.fillStyle = `rgba(214, 236, 222, ${0.18 + blink * 0.34})`;
    ctx.fillRect(Math.round(x), Math.round(y), 2, 1);
    if (blink > 0.85) ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1);
  }

  // ---- stream: dashes carried along each bend ----
  for (let s = 0; s < STREAM.length - 1; s++) {
    const [x1, y1] = STREAM[s];
    const [x2, y2] = STREAM[s + 1];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    const count = Math.max(2, Math.floor(length / 14));
    for (let i = 0; i < count; i++) {
      const t = (time * 0.16 + i / count + s * 0.17) % 1;
      const along = Math.sin(t * Math.PI);
      if (along <= 0) continue;
      const px = x1 + (x2 - x1) * t - camX;
      const py = y1 + (y2 - y1) * t - camY;
      const offset = Math.sin(t * Math.PI * 3 + time * 1.4 + i) * 3.5;
      const alpha = along * 0.42;
      ctx.fillStyle = `rgba(207, 228, 212, ${alpha})`;
      ctx.fillRect(Math.round(px + nx * offset), Math.round(py + ny * offset), 4, 1);
      ctx.fillStyle = `rgba(125, 184, 184, ${alpha * 0.8})`;
      ctx.fillRect(Math.round(px - nx * offset * 0.6), Math.round(py - ny * offset * 0.6) + 1, 3, 1);
    }
  }

  // ---- waterfall: falling streaks and a breathing pool ----
  const [tx, ty] = STREAM[0];
  const wx = tx - camX;
  const wy = ty - camY;
  for (let i = 0; i < 7; i++) {
    const phase = (time * 0.55 + i / 7) % 1;
    const x = wx - 9 + ((i * 37) % 18);
    const y = wy - 17 + phase * 30;
    ctx.fillStyle = `rgba(232, 244, 236, ${0.4 * (1 - phase)})`;
    ctx.fillRect(Math.round(x), Math.round(y), 2, 7);
  }
  const pulse = 0.5 + Math.sin(time * 1.8) * 0.2;
  ctx.fillStyle = `rgba(232, 244, 236, ${0.16 * pulse})`;
  ctx.fillRect(Math.round(wx - 13), Math.round(wy + 18), 26, 1);
  ctx.fillRect(Math.round(wx - 9), Math.round(wy + 20), 18, 1);
}
