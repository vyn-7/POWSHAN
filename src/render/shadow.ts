import type { Ctx } from '../core/canvas';

/** The one contact shadow for the whole valley.
 *
 *  Every sprite used to bake its own half-ellipse at the canvas edge, so the
 *  bottom half was clipped and props ended in a hard dark line. Anchoring the
 *  ellipse to a base line (the ground contact) keeps it whole, and a dithered
 *  rim stops it reading as a flat band at 1x. */
export function softShadow(ctx: Ctx, cx: number, baseY: number, rx: number, ry: number, alpha = 0.2): void {
  const rows = Math.max(1, Math.round(ry));
  const cy = Math.round(baseY) - rows;
  const core = `rgba(35, 43, 25, ${alpha})`;
  const rim = `rgba(35, 43, 25, ${alpha * 0.4})`;
  for (let y = -rows; y <= rows; y++) {
    const t = y / (rows + 0.5);
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    if (span <= 0) continue;
    const left = Math.round(cx) - span;
    const top = cy + y;
    ctx.fillStyle = core;
    ctx.fillRect(left, top, span * 2, 1);
    ctx.fillStyle = rim;
    ctx.fillRect(left - 1, top, 1, 1);
    ctx.fillRect(left + span * 2, top, 1, 1);
  }
}