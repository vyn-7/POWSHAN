export type CropId = 'turnip' | 'carrot' | 'moonflower';

export interface CropDef {
  id: CropId;
  name: string;
  seedName: string;
  /** Watered nights needed to reach full size. */
  days: number;
  buy: number;
  sell: number;
  blurb: string;
  /** Can be sold at the stand. Moonflowers are for the well. */
  sellable: boolean;
}

export const CROPS: Record<CropId, CropDef> = {
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    seedName: 'Turnip seeds',
    days: 3,
    buy: 8,
    sell: 18,
    blurb: 'Fast, dependable, and good with butter.',
    sellable: true,
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    seedName: 'Carrot seeds',
    days: 4,
    buy: 14,
    sell: 30,
    blurb: 'Slow to start, sweet at the end.',
    sellable: true,
  },
  moonflower: {
    id: 'moonflower',
    name: 'Moonflower',
    seedName: 'Moonflower seeds',
    days: 2,
    buy: 40,
    sell: 0,
    blurb: 'Opens after dusk. The old well remembers them.',
    sellable: false,
  },
};

export type ItemId = 'hoe' | 'can' | 'turnipSeed' | 'carrotSeed' | 'moonSeed' | 'hand';

export interface ItemDef {
  id: ItemId;
  label: string;
  hint: string;
  /** Energy spent on a successful use. */
  energy: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  hoe: { id: 'hoe', label: 'Hoe', hint: 'turn grass into soil', energy: 3 },
  can: { id: 'can', label: 'Watering can', hint: 'water tilled soil', energy: 2 },
  turnipSeed: { id: 'turnipSeed', label: 'Turnip seeds', hint: 'plant in tilled soil', energy: 1 },
  carrotSeed: { id: 'carrotSeed', label: 'Carrot seeds', hint: 'plant in tilled soil', energy: 1 },
  moonSeed: { id: 'moonSeed', label: 'Moonflower seeds', hint: 'plant in tilled soil', energy: 1 },
  hand: { id: 'hand', label: 'Harvest', hint: 'pick ripe crops', energy: 1 },
};

export const HOTBAR: ItemId[] = ['hoe', 'can', 'turnipSeed', 'carrotSeed', 'moonSeed', 'hand'];

export type ProduceId = 'turnip' | 'carrot' | 'moonflower';

export const SEED_CROP: Partial<Record<ItemId, CropId>> = {
  turnipSeed: 'turnip',
  carrotSeed: 'carrot',
  moonSeed: 'moonflower',
};

export const CROP_ITEM: Record<CropId, ProduceId> = {
  turnip: 'turnip',
  carrot: 'carrot',
  moonflower: 'moonflower',
};
