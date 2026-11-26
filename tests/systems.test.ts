import { describe, expect, it } from 'vitest';
import { growOvernight, isRipe, plant, stageFor, type Plot } from '../src/systems/farm';
import { completedCount, emptyQuests, questDone } from '../src/systems/quests';
import { SAVE_KEY, loadSave, parseSave, storeSave, type StorageLike } from '../src/systems/save';
import { clockLabel, nightAmount, seasonFor, weatherFor } from '../src/systems/time';

const plot = (over: Partial<Plot> = {}): Plot => ({
  x: 18,
  y: 13,
  tilled: true,
  watered: false,
  crop: 'turnip',
  growth: 0,
  ...over,
});

describe('crop growth', () => {
  it('only grows when watered or rained on', () => {
    expect(growOvernight([plot()], false)[0].growth).toBe(0);
    expect(growOvernight([plot({ watered: true })], false)[0].growth).toBe(1);
    expect(growOvernight([plot()], true)[0].growth).toBe(1);
  });

  it('dries the soil overnight unless it rained', () => {
    expect(growOvernight([plot({ watered: true })], false)[0].watered).toBe(false);
    expect(growOvernight([plot()], true)[0].watered).toBe(true);
  });

  it('moves through four stages and ripens at the crop day count', () => {
    expect(stageFor('turnip', 0)).toBe(0);
    expect(stageFor('turnip', 1)).toBe(1);
    expect(stageFor('turnip', 2)).toBe(2);
    expect(stageFor('turnip', 3)).toBe(3);
    expect(isRipe(plot({ growth: 2 }))).toBe(false);
    expect(isRipe(plot({ growth: 3 }))).toBe(true);
    expect(isRipe(plot({ crop: null }))).toBe(false);
  });

  it('never plants over a crop', () => {
    expect(plant(plot(), 'carrot').crop).toBe('turnip');
    expect(plant(plot({ crop: null }), 'carrot').crop).toBe('carrot');
  });
});

describe('saves', () => {
  it('falls back to a new morning on garbage', () => {
    expect(parseSave('not json').day).toBe(1);
    expect(parseSave(null).started).toBe(false);
    expect(parseSave('{"day":-4,"energy":900,"water":99}').energy).toBe(100);
    expect(parseSave('{"day":-4}').day).toBe(1);
    expect(parseSave('{"water":99}').water).toBe(20);
  });

  it('drops invalid plots and crops instead of crashing', () => {
    const raw = JSON.stringify({
      plots: [
        { x: 18, y: 13, tilled: true, crop: 'turnip', growth: 2 },
        { x: 'nope' },
        { x: 20, y: 13, tilled: true, crop: 'pumpkin', growth: 999 },
      ],
    });
    const plots = parseSave(raw).plots;
    expect(plots).toHaveLength(2);
    expect(plots[0].growth).toBe(2);
    expect(plots[1].crop).toBeNull();
    expect(plots[1].growth).toBe(30);
  });

  it('round-trips through storage', () => {
    const store = new Map<string, string>();
    const storage: StorageLike = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => void store.set(key, value),
    };
    const save = loadSave(storage);
    save.day = 9;
    save.gold = 240;
    expect(storeSave(storage, save)).toBe(true);
    expect(store.has(SAVE_KEY)).toBe(true);
    expect(loadSave(storage).gold).toBe(240);
    expect(loadSave(storage).day).toBe(9);
  });

  it('survives storage that throws', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    };
    expect(loadSave(broken).day).toBe(1);
    expect(storeSave(broken, loadSave(null))).toBe(false);
    expect(loadSave(null).day).toBe(1);
  });
});

describe('time and weather', () => {
  it('formats the clock across noon and midnight', () => {
    expect(clockLabel(6 * 60)).toBe('6:00 AM');
    expect(clockLabel(12 * 60 + 5)).toBe('12:05 PM');
    expect(clockLabel(25 * 60)).toBe('1:00 AM');
  });

  it('darkens the valley at night and not at noon', () => {
    expect(nightAmount(12 * 60)).toBe(0);
    expect(nightAmount(19 * 60)).toBeCloseTo(0.5);
    expect(nightAmount(23 * 60)).toBe(1);
  });

  it('rolls seasons every 28 days and keeps day one clear', () => {
    expect(seasonFor(1)).toBe('Spring');
    expect(seasonFor(29)).toBe('Summer');
    expect(seasonFor(85)).toBe('Winter');
    expect(weatherFor(1)).toBe('sunny');
    expect(weatherFor(2)).toBe('sunny');
    const forecast = Array.from({ length: 40 }, (_, index) => weatherFor(index + 3));
    expect(new Set(forecast).size).toBeGreaterThan(1);
  });
});

describe('quests', () => {
  it('counts a quest only once its goal is met', () => {
    const progress = emptyQuests();
    expect(completedCount(progress)).toBe(0);
    expect(questDone(progress, 'till')).toBe(false);
    progress.till = 6;
    expect(questDone(progress, 'till')).toBe(true);
    expect(completedCount(progress)).toBe(1);
  });
});
