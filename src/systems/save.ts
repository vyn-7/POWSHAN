import type { CatId } from '../data/cats';
import type { CropId, ProduceId } from '../data/crops';
import type { Plot } from './farm';
import { emptyQuests, type QuestId, type QuestProgress } from './quests';
import type { Weather } from './time';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SAVE_KEY = 'powshan.save.v3';
export const SAVE_VERSION = 3;

export interface CatSave {
  met: boolean;
  trust: number;
}

export interface FarmerSave {
  name: string;
  avatar: 'boy' | 'girl';
}

export interface SaveData {
  version: number;
  started: boolean;
  farmer: FarmerSave;
  awake: boolean;
  day: number;
  minutes: number;
  weather: Weather;
  gold: number;
  energy: number;
  player: { x: number; y: number };
  inventory: Record<ProduceId, number>;
  seeds: Record<CropId, number>;
  water: number;
  plots: Plot[];
  quests: QuestProgress;
  cats: Record<CatId, CatSave>;
  stats: { harvests: number; plantings: number; pets: number; days: number };
}

export const defaultSave = (): SaveData => ({
  version: SAVE_VERSION,
  started: false,
  farmer: { name: 'Rowan', avatar: 'boy' },
  awake: false,
  day: 1,
  minutes: 6 * 60,
  weather: 'sunny',
  gold: 80,
  energy: 100,
  player: { x: 10.5 * 16, y: 12.4 * 16 },
  inventory: { turnip: 0, carrot: 0, moonflower: 0 },
  seeds: { turnip: 5, carrot: 2, moonflower: 0 },
  water: 20,
  plots: [],
  quests: { ...emptyQuests(), cats: 2 },
  cats: {
    sean: { met: true, trust: 1 },
    powi: { met: true, trust: 1 },
    uling: { met: false, trust: 0 },
    adidas: { met: false, trust: 0 },
    mingkay: { met: false, trust: 0 },
    mumu: { met: false, trust: 0 },
  },
  stats: { harvests: 0, plantings: 0, pets: 0, days: 0 },
});

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const bool = (value: unknown): boolean => value === true;

const validPlot = (raw: unknown): Plot | null => {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Plot>;
  if (typeof p.x !== 'number' || typeof p.y !== 'number') return null;
  const crop = p.crop === 'turnip' || p.crop === 'carrot' || p.crop === 'moonflower' ? p.crop : null;
  return {
    x: Math.round(p.x),
    y: Math.round(p.y),
    tilled: bool(p.tilled),
    watered: bool(p.watered),
    crop,
    growth: Math.max(0, Math.min(30, Math.round(num(p.growth, 0)))),
  };
};

/** Forgiving by design: a corrupt save becomes a new morning, never a crash. */
export function parseSave(raw: string | null): SaveData {
  const base = defaultSave();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || typeof parsed !== 'object') return base;
    const cats = { ...base.cats };
    for (const id of Object.keys(cats) as CatId[]) {
      const stored = parsed.cats?.[id];
      if (!stored) continue;
      cats[id] = { met: bool(stored.met), trust: Math.max(0, Math.min(9, Math.round(num(stored.trust, 0)))) };
    }
    const quests = { ...emptyQuests() };
    for (const id of Object.keys(quests) as QuestId[]) {
      quests[id] = Math.max(0, Math.round(num(parsed.quests?.[id], 0)));
    }
    return {
      version: SAVE_VERSION,
      started: bool(parsed.started),
      farmer: {
        name:
          typeof parsed.farmer?.name === 'string' && parsed.farmer.name.trim()
            ? parsed.farmer.name.trim().slice(0, 16)
            : base.farmer.name,
        avatar: parsed.farmer?.avatar === 'girl' ? 'girl' : 'boy',
      },
      awake: bool(parsed.awake),
      day: Math.max(1, Math.round(num(parsed.day, 1))),
      minutes: Math.max(6 * 60, Math.min(26 * 60, num(parsed.minutes, 6 * 60))),
      weather:
        parsed.weather === 'rain' || parsed.weather === 'cloudy' || parsed.weather === 'sunny'
          ? parsed.weather
          : 'sunny',
      gold: Math.max(0, Math.round(num(parsed.gold, base.gold))),
      energy: Math.max(0, Math.min(100, Math.round(num(parsed.energy, 100)))),
      player: {
        x: Math.max(16, num(parsed.player?.x, base.player.x)),
        y: Math.max(16, num(parsed.player?.y, base.player.y)),
      },
      inventory: {
        turnip: Math.max(0, Math.round(num(parsed.inventory?.turnip, 0))),
        carrot: Math.max(0, Math.round(num(parsed.inventory?.carrot, 0))),
        moonflower: Math.max(0, Math.round(num(parsed.inventory?.moonflower, 0))),
      },
      seeds: {
        turnip: Math.max(0, Math.round(num(parsed.seeds?.turnip, 0))),
        carrot: Math.max(0, Math.round(num(parsed.seeds?.carrot, 0))),
        moonflower: Math.max(0, Math.round(num(parsed.seeds?.moonflower, 0))),
      },
      water: Math.max(0, Math.min(20, Math.round(num(parsed.water, 20)))),
      plots: Array.isArray(parsed.plots)
        ? parsed.plots.map(validPlot).filter((plot): plot is Plot => plot !== null).slice(0, 400)
        : [],
      quests,
      cats,
      stats: {
        harvests: Math.max(0, Math.round(num(parsed.stats?.harvests, 0))),
        plantings: Math.max(0, Math.round(num(parsed.stats?.plantings, 0))),
        pets: Math.max(0, Math.round(num(parsed.stats?.pets, 0))),
        days: Math.max(0, Math.round(num(parsed.stats?.days, 0))),
      },
    };
  } catch {
    return base;
  }
}

export function loadSave(storage: StorageLike | null): SaveData {
  if (!storage) return defaultSave();
  try {
    return parseSave(storage.getItem(SAVE_KEY));
  } catch {
    return defaultSave();
  }
}

export function storeSave(storage: StorageLike | null, data: SaveData): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | null): void {
  try {
    storage?.setItem(SAVE_KEY, '');
  } catch {
    // ignore
  }
}

export interface SaveSummary {
  day: number;
  gold: number;
  harvests: number;
  cats: number;
  awake: boolean;
}

export function summarise(data: SaveData): SaveSummary {
  return {
    day: data.day,
    gold: data.gold,
    harvests: data.stats.harvests,
    cats: Object.values(data.cats).filter((cat) => cat.met).length,
    awake: data.awake,
  };
}
