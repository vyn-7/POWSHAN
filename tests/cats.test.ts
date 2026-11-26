import { describe, expect, it } from 'vitest';
import { CATS, CAT_TOTAL, type CatId } from '../src/data/cats';
import { QUESTS } from '../src/systems/quests';
import { defaultSave, parseSave } from '../src/systems/save';

const byId = (id: CatId) => CATS.find((cat) => cat.id === id);

describe('the valley cats', () => {
  it('keeps six distinct cats with real behaviour knobs', () => {
    expect(CAT_TOTAL).toBe(6);
    expect(new Set(CATS.map((cat) => cat.id)).size).toBe(CAT_TOTAL);
    for (const cat of CATS) {
      expect(cat.name.length).toBeGreaterThan(1);
      expect(cat.temperament.answers).toBeGreaterThanOrEqual(0);
      expect(cat.temperament.keepAway).toBeGreaterThanOrEqual(0);
    }
  });

  it('draws Mumu white, with a dark saddle and one black tail', () => {
    const mumu = byId('mumu');
    expect(mumu).toBeDefined();
    if (!mumu) return;
    expect(mumu.colors.tail).toBeTruthy();
    expect(mumu.colors.tailDark).toBeTruthy();
    expect(mumu.headPatch).toBe(false);
    expect(mumu.temperament.dodgesPat).toBe(true);
    expect(mumu.temperament.answers).toBeGreaterThan(1);
    expect(mumu.temperament.follow).toBeGreaterThan(0.4);
  });

  it('makes the other cats answer a call differently', () => {
    expect(byId('sean')?.temperament.answers).toBeGreaterThan(0.9);
    expect(byId('uling')?.temperament.answers).toBeLessThan(0.3);
    expect(byId('uling')?.temperament.keepAway).toBeGreaterThan(30);
    expect(byId('powi')?.temperament.settles).toBeGreaterThan(0);
  });

  it('counts all six cats in the neighbours quest', () => {
    const quest = QUESTS.find((entry) => entry.id === 'cats');
    expect(quest?.goal).toBe(CAT_TOTAL);
  });
});

describe('farmer identity in saves', () => {
  it('starts with Sean and Powi already home', () => {
    const save = defaultSave();
    expect(save.farmer.name).toBe('Rowan');
    expect(save.farmer.avatar).toBe('boy');
    expect(save.cats.sean.met).toBe(true);
    expect(save.cats.powi.met).toBe(true);
    expect(save.quests.cats).toBe(2);
    expect(Object.keys(save.cats)).toHaveLength(CAT_TOTAL);
  });

  it('round-trips a chosen name and avatar', () => {
    const save = defaultSave();
    save.farmer = { name: 'Wren', avatar: 'girl' };
    const parsed = parseSave(JSON.stringify(save));
    expect(parsed.farmer).toEqual({ name: 'Wren', avatar: 'girl' });
  });

  it('sanitises missing or broken identity fields', () => {
    expect(parseSave('{"farmer":{"name":"   ","avatar":"wizard"}}').farmer).toEqual({
      name: 'Rowan',
      avatar: 'boy',
    });
    expect(parseSave('{"farmer":{"name":"A very long farmer name indeed"}}').farmer.name).toHaveLength(16);
  });
});
