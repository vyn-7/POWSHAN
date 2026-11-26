export type QuestId = 'till' | 'plant' | 'cats' | 'harvest' | 'well';

export interface QuestDef {
  id: QuestId;
  title: string;
  hint: string;
  goal: number;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'till',
    title: 'Wake the soil',
    hint: 'The old field is fenced and waiting. Hoe six patches of grass inside it.',
    goal: 6,
  },
  {
    id: 'plant',
    title: 'Put something in the ground',
    hint: 'Choose seeds from the hotbar and plant four of them in tilled soil.',
    goal: 4,
  },
  {
    id: 'cats',
    title: 'Meet the neighbours',
    hint: 'Sean and Powi came with you. Four more cats keep their own hours out here — walk up, or call them with C.',
    goal: 6,
  },
  {
    id: 'harvest',
    title: 'A good harvest',
    hint: 'Water your crops, sleep, and bring in four ripe things.',
    goal: 4,
  },
  {
    id: 'well',
    title: 'The heart of the valley',
    hint: 'Grow moonflowers and offer three blooms to the old well.',
    goal: 3,
  },
];

export type QuestProgress = Record<QuestId, number>;

export const emptyQuests = (): QuestProgress => ({
  till: 0,
  plant: 0,
  cats: 0,
  harvest: 0,
  well: 0,
});

export function questDone(progress: QuestProgress, id: QuestId): boolean {
  const def = QUESTS.find((quest) => quest.id === id);
  return def ? progress[id] >= def.goal : false;
}

export function completedCount(progress: QuestProgress): number {
  return QUESTS.filter((quest) => questDone(progress, quest.id)).length;
}

export function totalProgress(progress: QuestProgress): number {
  return QUESTS.reduce((sum, quest) => sum + Math.min(progress[quest.id], quest.goal), 0);
}
export function totalGoal(): number {
  return QUESTS.reduce((sum, quest) => sum + quest.goal, 0);
}
