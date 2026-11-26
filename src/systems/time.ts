/** Clock, calendar and weather. Pure functions so the day loop is easy to test
 *  and a save can be restored to the exact minute. */

export const DAY_START = 6 * 60;
export const DAY_END = 26 * 60; // 2:00 AM the following night
/** Two in-game minutes per real second: a full day is ten real minutes. */
export const MINUTES_PER_SECOND = 2;

export type Weather = 'sunny' | 'rain' | 'cloudy';

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export type Season = (typeof SEASONS)[number];

export function seasonFor(day: number): Season {
  return SEASONS[Math.floor((day - 1) / 28) % SEASONS.length];
}

/** Day one is deliberately clear; after that the valley has weather. */
export function weatherFor(day: number): Weather {
  if (day <= 2) return 'sunny';
  let h = Math.imul(day + 7, 2654435761) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 1274126177) >>> 0;
  const roll = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  if (roll < 0.28) return 'rain';
  if (roll < 0.42) return 'cloudy';
  return 'sunny';
}

export function clockLabel(minutes: number): string {
  const total = Math.floor(minutes) % (24 * 60);
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${suffix}`;
}

export function isNight(minutes: number): boolean {
  const hour = (minutes / 60) % 24;
  return hour >= 20 || hour < 5.5;
}

export function isGolden(minutes: number): boolean {
  const hour = (minutes / 60) % 24;
  return (hour >= 17 && hour < 20) || (hour >= 5.5 && hour < 7);
}

/** 0 at midday, 1 at midnight. Drives the light overlay. */
export function nightAmount(minutes: number): number {
  const hour = (minutes / 60) % 24;
  if (hour >= 20 || hour < 5) return 1;
  if (hour >= 18) return (hour - 18) / 2;
  if (hour < 7) return 1 - (hour - 5) / 2;
  return 0;
}
