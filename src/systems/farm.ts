import type { CropId } from '../data/crops';
import { CROPS } from '../data/crops';

export interface Plot {
  x: number;
  y: number;
  tilled: boolean;
  watered: boolean;
  crop: CropId | null;
  growth: number;
}

export const plotKey = (x: number, y: number): string => `${x},${y}`;

/** Four readable silhouettes: seed, sprout, bush, ripe. */
export function stageFor(crop: CropId, growth: number): 0 | 1 | 2 | 3 {
  const days = CROPS[crop].days;
  if (growth <= 0) return 0;
  if (growth >= days) return 3;
  const t = growth / days;
  if (t < 0.34) return 1;
  return 2;
}

export function isRipe(plot: Plot): boolean {
  return plot.crop !== null && stageFor(plot.crop, plot.growth) === 3;
}

/** One night in the field. Rain both waters the crop and leaves the soil wet
 *  for the morning. Nothing dies: a dry crop simply waits. */
export function growOvernight(plots: readonly Plot[], rained: boolean): Plot[] {
  return plots.map((plot) => {
    if (!plot.tilled) return plot;
    const fed = plot.crop !== null && (plot.watered || rained);
    return {
      ...plot,
      crop: plot.crop,
      growth: fed ? plot.growth + 1 : plot.growth,
      watered: rained,
    };
  });
}

export function plant(plot: Plot, crop: CropId): Plot {
  if (plot.crop) return plot;
  return { ...plot, crop, growth: 0 };
}

export function harvest(plot: Plot): Plot {
  return { ...plot, crop: null, growth: 0 };
}
