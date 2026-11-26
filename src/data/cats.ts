export type CatId = 'sean' | 'powi' | 'uling' | 'adidas' | 'mingkay' | 'mumu';

/** How a cat actually behaves in the valley. The sim reads these, so a
 *  personality shows up as something you watch, not a sentence you read. */
export interface Temperament {
  /** 0..1 — how often the cat picks a wander target near the farmer. */
  follow: number;
  /** Distance at which the cat keeps away from the farmer. 0 = never. */
  keepAway: number;
  /** 0..1+ — chance of answering a call. Above 1 always answers. */
  answers: number;
  /** Steps aside instead of being touched. */
  dodgesPat: boolean;
  /** Seconds of quiet company before trust rises. 0 = never by proximity. */
  settles: number;
}

export interface CatProfile {
  id: CatId;
  name: string;
  pronoun: 'he' | 'she';
  note: string;
  /** Grounded observations from the owner. No invented biography. */
  line: string;
  colors: {
    fur: string;
    furDark: string;
    belly: string;
    patch?: string;
    eyes: string;
    accent?: string;
    /** Whole tail in one colour, for cats like Mumu. */
    tail?: string;
    tailDark?: string;
    /** Paw tips in a contrasting colour, for cats like Sean. */
    toes?: string;
  };
  /** Some cats carry their dark markings on the body only. */
  headPatch?: boolean;
  /** Where the cat likes to be, in tiles. */
  home: { x: number; y: number };
  roam: number;
  sleepiness: number;
  energy: number;
  /** Meow file index, 1-5. */
  voice: number;
  temperament: Temperament;
}

export const CATS: CatProfile[] = [
  {
    id: 'sean',
    name: 'Sean',
    pronoun: 'he',
    note: 'the very cuddly one',
    line: 'Sean leans into your hand before you have even reached him. The valley\u2019s softest hello.',
    colors: {
      fur: '#e07b2e',
      furDark: '#bf5f1d',
      belly: '#f6efe3',
      patch: '#f0a24a',
      eyes: '#3a2f28',
      accent: '#f6efe3',
      toes: '#f6efe3',
    },
    home: { x: 12.5, y: 12.2 },
    roam: 3.2,
    sleepiness: 0.45,
    energy: 0.55,
    voice: 1,
    temperament: { follow: 0.8, keepAway: 0, answers: 1, dodgesPat: false, settles: 0 },
  },
  {
    id: 'powi',
    name: 'Powi',
    pronoun: 'she',
    note: 'sleepy and shy',
    line: 'Powi opens one blue eye, considers you, and goes back to sleep. You take the hint \u2014 and leave a warm hand behind.',
    colors: {
      fur: '#ae9982',
      furDark: '#8c7a66',
      belly: '#ddd4c9',
      patch: '#c8beb3',
      eyes: '#4552a2',
      accent: '#e0d6ca',
    },
    home: { x: 28.6, y: 27.6 },
    roam: 1.6,
    sleepiness: 0.9,
    energy: 0.28,
    voice: 2,
    temperament: { follow: 0.2, keepAway: 12, answers: 0.45, dodgesPat: false, settles: 9 },
  },
  {
    id: 'uling',
    name: 'Uling',
    pronoun: 'he',
    note: 'all energy, all alone',
    line: 'Uling is already three steps away. He stops, checks that you are watching, and sprints off. That is his version of hello.',
    colors: {
      fur: '#35302c',
      furDark: '#211d1a',
      belly: '#514942',
      eyes: '#e8e18c',
      accent: '#7c2424',
    },
    home: { x: 49.5, y: 12.5 },
    roam: 6.5,
    sleepiness: 0.2,
    energy: 1,
    voice: 4,
    temperament: { follow: 0.1, keepAway: 44, answers: 0.2, dodgesPat: false, settles: 0 },
  },
  {
    id: 'adidas',
    name: 'Adidas',
    pronoun: 'she',
    note: 'cuddly on her own terms',
    line: 'Adidas accepts exactly one pat. Then another. Then she remembers she is busy and trots off with her tail high.',
    colors: {
      fur: '#302f2d',
      furDark: '#1e1d1c',
      belly: '#4d4840',
      patch: '#c3bcba',
      eyes: '#c8c07a',
      accent: '#8e8782',
    },
    home: { x: 32.5, y: 15.4 },
    roam: 3.8,
    sleepiness: 0.5,
    energy: 0.55,
    voice: 3,
    temperament: { follow: 0.35, keepAway: 26, answers: 0.55, dodgesPat: false, settles: 0 },
  },
  {
    id: 'mingkay',
    name: 'Mingkay',
    pronoun: 'she',
    note: 'the all-rounder',
    line: 'Mingkay follows you for a while, as if making sure you are really settling in. Then she finds a sunbeam and stays there.',
    colors: {
      fur: '#e3d6c7',
      furDark: '#c2b2a0',
      belly: '#f6efe4',
      patch: '#a5651f',
      eyes: '#a37839',
      accent: '#e9dfd2',
    },
    home: { x: 35.6, y: 16.9 },
    roam: 4.2,
    sleepiness: 0.5,
    energy: 0.6,
    voice: 5,
    temperament: { follow: 0.8, keepAway: 10, answers: 0.7, dodgesPat: false, settles: 0 },
  },
  {
    id: 'mumu',
    name: 'Mumu',
    pronoun: 'she',
    note: 'white with a dark saddle and a black tail',
    line: 'Mumu crosses the grass to you, tail up, and stops a whisker short of your hand. Close is good. Touch is not.',
    colors: {
      fur: '#f2ece1',
      furDark: '#cfc5b6',
      belly: '#fffaf1',
      patch: '#3b3532',
      eyes: '#7fa6c8',
      accent: '#2b2724',
      tail: '#332e2a',
      tailDark: '#211d1a',
    },
    headPatch: false,
    home: { x: 41.5, y: 30.5 },
    roam: 2.4,
    sleepiness: 0.35,
    energy: 0.6,
    voice: 2,
    temperament: { follow: 0.6, keepAway: 0, answers: 1.4, dodgesPat: true, settles: 7 },
  },
];

export const CAT_BY_ID = new Map(CATS.map((cat) => [cat.id, cat]));

export const CAT_TOTAL = CATS.length;