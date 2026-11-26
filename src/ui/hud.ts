import { CROPS, HOTBAR, ITEMS, type CropId, type ItemId } from '../data/crops';
import { CATS } from '../data/cats';
import { coinIcon, itemIcon, leafSprite, weatherIcon } from '../render/icons';
import { catPortrait } from '../render/cats';
import { farmerBust, type FarmerAvatar } from '../render/farmer';
import { QUESTS, completedCount, questDone, type QuestProgress } from '../systems/quests';
import type { SaveData, SaveSummary } from '../systems/save';
import type { Weather } from '../systems/time';
import { clockLabel, seasonFor } from '../systems/time';

export interface HudBridge {
  start(): void;
  beginValley(name: string, avatar: FarmerAvatar): void;
  resume(): void;
  openJournal(tab?: 'notes' | 'cats' | 'build'): void;
  selectSlot(index: number): void;
  toggleMute(): boolean;
  buySeed(crop: CropId): void;
  sellProduce(): void;
  sleep(): void;
  newValley(): void;
  returnToTitle(): void;
  letterDone(): void;
  finaleDone(): void;
}

export interface HudView {
  energy: number;
  gold: number;
  water: number;
  minutes: number;
  day: number;
  weather: Weather;
  quests: QuestProgress;
  selected: number;
  seeds: Record<CropId, number>;
  basket: number;
  prompt: string | null;
}

const must = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
};

const query = <T extends HTMLElement>(selector: string): T => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Missing element ${selector}`);
  return node as T;
};

const SEED_ITEM: Record<CropId, ItemId> = {
  turnip: 'turnipSeed',
  carrot: 'carrotSeed',
  moonflower: 'moonSeed',
};

const SEED_LABEL: Record<CropId, string> = {
  turnip: 'Turnip',
  carrot: 'Carrot',
  moonflower: 'Moonflower',
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });

export class Hud {
  private bridge: HudBridge | null = null;
  private readonly title = must<HTMLElement>('title');
  private readonly hud = must<HTMLElement>('hud');
  private readonly titleSave = must<HTMLElement>('title-save');
  private readonly play = must<HTMLButtonElement>('play');
  private readonly fresh = must<HTMLButtonElement>('fresh');
  private readonly journal = must<HTMLDialogElement>('journal');
  private readonly shop = must<HTMLDialogElement>('shop');
  private readonly pause = must<HTMLDialogElement>('pause');
  private readonly confirm = must<HTMLDialogElement>('confirm');
  private readonly sleepDialog = must<HTMLDialogElement>('sleep');
  private readonly intro = must<HTMLDialogElement>('intro');
  private readonly letter = must<HTMLDialogElement>('letter');
  private readonly finale = must<HTMLDialogElement>('finale');
  private readonly shopBody = must<HTMLElement>('shop-body');
  private readonly shopGold = must<HTMLElement>('shop-gold');
  private readonly prompt = must<HTMLElement>('prompt');
  private readonly promptText = must<HTMLElement>('prompt-text');
  private readonly toastEl = must<HTMLElement>('toast');
  private readonly dialogue = must<HTMLElement>('dialogue');
  private readonly dialogueName = must<HTMLElement>('dialogue-name');
  private readonly dialogueText = must<HTMLElement>('dialogue-text');
  private readonly dialoguePortrait = must<HTMLElement>('dialogue-portrait');
  private readonly daycard = must<HTMLElement>('daycard');
  private readonly fadeEl = must<HTMLElement>('fade');
  private readonly energyFill = must<HTMLElement>('energy-fill');
  private readonly clockLabel = must<HTMLElement>('clock-label');
  private readonly dayLabel = must<HTMLElement>('day-label');
  private readonly seasonLabel = must<HTMLElement>('season-label');
  private readonly weatherLabel = must<HTMLElement>('weather-label');
  private readonly goldLabel = must<HTMLElement>('gold-count');
  private readonly waterLabel = must<HTMLElement>('water-count');
  private readonly goalCount = must<HTMLElement>('goal-count');
  private readonly hint = must<HTMLElement>('hint');
  private readonly hotbar = must<HTMLElement>('hotbar');
  private readonly journalButton = must<HTMLButtonElement>('journal-btn');
  private readonly muteButton = query<HTMLButtonElement>('#pause [data-action="mute"]');
  private readonly sleepForecast = must<HTMLElement>('sleep-forecast');
  private readonly finaleStats = must<HTMLElement>('finale-stats');
  private readonly farmerName = must<HTMLInputElement>('farmer-name');
  private readonly avatarButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-avatar]'));
  private avatar: FarmerAvatar = 'boy';
  private readonly tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
  private readonly panes = Array.from(document.querySelectorAll<HTMLElement>('.tabpane'));
  private readonly slots: HTMLButtonElement[] = [];
  private lastWeather: Weather | null = null;
  private shopSave: SaveData | null = null;
  private dialogueTimer = 0;
  private toastTimer = 0;
  private cardTimer = 0;

  constructor() {
    this.buildHotbar();
    this.bind();
    this.drawIcon('coin-icon', coinIcon());
    this.drawIcon('shop-coin', coinIcon());
    this.drawIcon('water-icon', itemIcon('can'));
    this.drawAvatarArt();
    const leaf = leafSprite(9);
    leaf.setAttribute('aria-hidden', 'true');
    const leafHolder = this.journalButton.querySelector('.chip__leaf');
    if (leafHolder) leafHolder.append(leaf);
  }

  setBridge(bridge: HudBridge): void {
    this.bridge = bridge;
  }

  private pickAvatar(avatar: FarmerAvatar): void {
    this.avatar = avatar;
    for (const button of this.avatarButtons) {
      const active = button.dataset.avatar === avatar;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-picked', active);
    }
  }

  private beginValley(): void {
    const name = this.farmerName.value.trim().slice(0, 16) || 'Rowan';
    this.intro.close();
    this.bridge?.beginValley(name, this.avatar);
  }

  openIntro(name: string, avatar: FarmerAvatar): void {
    this.closeAll();
    this.farmerName.value = name || 'Rowan';
    this.pickAvatar(avatar);
    this.open(this.intro);
    window.setTimeout(() => {
      this.farmerName.focus();
      this.farmerName.select();
    }, 80);
  }

  get modalOpen(): boolean {
    return [
      this.journal,
      this.shop,
      this.pause,
      this.confirm,
      this.sleepDialog,
      this.intro,
      this.letter,
      this.finale,
    ].some((dialog) => dialog.open);
  }

  get titleVisible(): boolean {
    return !this.title.classList.contains('is-hidden');
  }

  /* ------------------------------- chrome -------------------------------- */

  private drawIcon(id: string, icon: HTMLCanvasElement): void {
    const canvas = document.getElementById(id) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== icon.width || canvas.height !== icon.height) {
      canvas.width = icon.width;
      canvas.height = icon.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(icon, 0, 0);
  }

  private drawAvatarArt(): void {
    for (const canvas of Array.from(document.querySelectorAll<HTMLCanvasElement>('[data-avatar-art]'))) {
      const avatar = canvas.dataset.avatarArt === 'girl' ? 'girl' : 'boy';
      const art = farmerBust(avatar);
      canvas.width = art.width;
      canvas.height = art.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(art, 0, 0);
    }
  }

  private buildHotbar(): void {
    for (let index = 0; index < HOTBAR.length; index++) {
      const item = HOTBAR[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot';
      button.dataset.index = String(index);
      button.setAttribute('aria-label', ITEMS[item].label);
      button.setAttribute('aria-pressed', 'false');
      const key = document.createElement('span');
      key.className = 'slot__key';
      key.textContent = String(index + 1);
      const icon = itemIcon(item);
      icon.setAttribute('aria-hidden', 'true');
      const count = document.createElement('span');
      count.className = 'slot__count';
      button.append(key, icon, count);
      button.addEventListener('click', () => {
        this.bridge?.selectSlot(index);
      });
      this.hotbar.append(button);
      this.slots.push(button);
    }
  }

  private bind(): void {
    this.play.addEventListener('click', () => this.bridge?.start());
    this.fresh.addEventListener('click', () => {
      this.closeAll();
      this.open(this.confirm);
    });
    this.journalButton.addEventListener('click', () => this.bridge?.openJournal());
    must<HTMLButtonElement>('about-title').addEventListener('click', () => this.bridge?.openJournal('build'));

    for (const tab of this.tabs) {
      tab.addEventListener('click', () => this.selectTab(tab.dataset.tab ?? 'notes'));
    }

    for (const button of document.querySelectorAll<HTMLButtonElement>('[data-close]')) {
      button.addEventListener('click', () => {
        const dialog = button.closest('dialog');
        if (dialog) dialog.close();
      });
    }

    for (const dialog of [this.journal, this.shop, this.pause, this.confirm, this.sleepDialog, this.letter, this.finale]) {
      dialog.addEventListener('close', () => {
        if (this.titleVisible) return;
        if (!this.modalOpen) this.bridge?.resume();
      });
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close();
      });
    }

    this.pause.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'resume') {
        this.pause.close();
      } else if (action === 'journal') {
        this.pause.close();
        this.bridge?.openJournal();
      } else if (action === 'about') {
        this.pause.close();
        this.bridge?.openJournal('build');
      } else if (action === 'mute') {
        const muted = this.bridge?.toggleMute() ?? false;
        target.textContent = muted ? 'Sound: off' : 'Sound: on';
      } else if (action === 'title') {
        this.closeAll();
        this.bridge?.returnToTitle();
      } else if (action === 'reset') {
        this.pause.close();
        this.open(this.confirm);
      }
    });

    must<HTMLButtonElement>('confirm-yes').addEventListener('click', () => {
      this.closeAll();
      this.bridge?.newValley();
    });

    must<HTMLButtonElement>('sleep-yes').addEventListener('click', () => {
      this.sleepDialog.close();
      this.bridge?.sleep();
    });

    must<HTMLButtonElement>('letter-begin').addEventListener('click', () => {
      this.letter.close();
      this.bridge?.letterDone();
    });

    must<HTMLButtonElement>('finale-close').addEventListener('click', () => {
      this.finale.close();
      this.bridge?.finaleDone();
    });

    for (const button of this.avatarButtons) {
      button.addEventListener('click', () => {
        const avatar = button.dataset.avatar === 'girl' ? 'girl' : 'boy';
        this.pickAvatar(avatar);
      });
    }
    const begin = (): void => this.beginValley();
    must<HTMLButtonElement>('intro-begin').addEventListener('click', begin);
    this.farmerName.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        begin();
      }
    });
    this.intro.addEventListener('cancel', (event) => event.preventDefault());

    this.shopBody.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-buy]');
      if (target) {
        const crop = target.dataset.buy as CropId | undefined;
        if (crop && crop in CROPS) this.bridge?.buySeed(crop);
        return;
      }
      if ((event.target as HTMLElement).closest('[data-sell]')) this.bridge?.sellProduce();
    });
  }

  /* -------------------------------- title -------------------------------- */

  showTitle(hasSave: boolean, summary: SaveSummary | null): void {
    this.title.classList.remove('is-hidden');
    this.hud.classList.add('is-hidden');
    this.play.textContent = hasSave ? 'Continue in the valley' : 'Step into the meadow';
    this.setFreshVisible(hasSave);
    if (hasSave && summary) {
      const bits = [`Day ${summary.day}`, `${summary.gold}g`, `${summary.cats} / ${CATS.length} cats`];
      if (summary.awake) bits.push('the well is awake');
      this.titleSave.textContent = bits.join('  ·  ');
      this.titleSave.classList.remove('is-hidden');
    } else {
      this.titleSave.textContent = '';
      this.titleSave.classList.add('is-hidden');
    }
  }

  private setFreshVisible(visible: boolean): void {
    this.fresh.classList.toggle('is-hidden', !visible);
  }

  hideTitle(): void {
    this.title.classList.add('is-hidden');
  }

  showHud(): void {
    this.hud.classList.remove('is-hidden');
  }

  hideHud(): void {
    this.hud.classList.add('is-hidden');
    this.hideDialogue();
    this.setPrompt(null);
  }

  setFade(on: boolean): void {
    this.fadeEl.classList.toggle('is-on', on);
  }

  hideBoot(): void {
    const boot = document.getElementById('boot');
    if (!boot) return;
    boot.classList.add('is-hidden');
    window.setTimeout(() => boot.remove(), 700);
  }

  /* --------------------------------- hud --------------------------------- */

  update(view: HudView): void {
    const season = seasonFor(view.day);
    this.clockLabel.textContent = clockLabel(view.minutes);
    this.dayLabel.textContent = `Day ${view.day}`;
    this.seasonLabel.textContent = season;
    this.weatherLabel.textContent = view.weather === 'sunny' ? 'Sunny' : view.weather === 'rain' ? 'Rain' : 'Cloudy';
    this.energyFill.style.width = `${Math.max(0, Math.min(100, view.energy))}%`;
    this.energyFill.classList.toggle('is-low', view.energy <= 34 && view.energy > 12);
    this.energyFill.classList.toggle('is-empty', view.energy <= 12);
    this.goldLabel.textContent = String(view.gold);
    this.waterLabel.textContent = String(view.water);
    const done = completedCount(view.quests);
    this.goalCount.textContent = `${done} / ${QUESTS.length}`;
    this.setPrompt(view.prompt);

    if (this.lastWeather !== view.weather) {
      this.lastWeather = view.weather;
      this.drawIcon('weather-icon', weatherIcon(view.weather));
    }

    for (let index = 0; index < this.slots.length; index++) {
      const slot = this.slots[index];
      const item = HOTBAR[index];
      const selected = index === view.selected;
      slot.classList.toggle('is-selected', selected);
      slot.setAttribute('aria-pressed', selected ? 'true' : 'false');
      const count = slot.querySelector<HTMLElement>('.slot__count');
      if (!count) continue;
      if (item === 'turnipSeed') count.textContent = String(view.seeds.turnip);
      else if (item === 'carrotSeed') count.textContent = String(view.seeds.carrot);
      else if (item === 'moonSeed') count.textContent = String(view.seeds.moonflower);
      else if (item === 'hand') count.textContent = view.basket > 0 ? String(view.basket) : '';
      else count.textContent = '';
      slot.classList.toggle(
        'is-empty',
        (item === 'turnipSeed' && view.seeds.turnip === 0) ||
          (item === 'carrotSeed' && view.seeds.carrot === 0) ||
          (item === 'moonSeed' && view.seeds.moonflower === 0),
      );
    }
  }

  setPrompt(text: string | null): void {
    if (!text || this.modalOpen || this.titleVisible) {
      this.prompt.classList.add('is-hidden');
      return;
    }
    if (this.promptText.textContent !== text) this.promptText.textContent = text;
    this.prompt.classList.remove('is-hidden');
  }

  fadeHint(): void {
    this.hint.classList.add('is-faded');
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('is-visible'), 2600);
  }

  say(name: string, text: string, portrait?: HTMLCanvasElement | null): void {
    this.dialogueName.textContent = name;
    this.dialogueText.textContent = text;
    this.dialoguePortrait.replaceChildren();
    if (portrait) this.dialoguePortrait.append(portrait);
    this.dialogue.classList.remove('is-hidden');
    window.clearTimeout(this.dialogueTimer);
    this.dialogueTimer = window.setTimeout(() => this.hideDialogue(), 7000);
  }

  hideDialogue(): void {
    this.dialogue.classList.add('is-hidden');
  }

  showDayCard(kicker: string, title: string, sub: string): void {
    must<HTMLElement>('daycard-kicker').textContent = kicker;
    must<HTMLElement>('daycard-title').textContent = title;
    must<HTMLElement>('daycard-sub').textContent = sub;
    this.daycard.classList.add('is-visible');
    window.clearTimeout(this.cardTimer);
    this.cardTimer = window.setTimeout(() => this.daycard.classList.remove('is-visible'), 2600);
  }

  setMuted(muted: boolean): void {
    this.muteButton.textContent = muted ? 'Sound: off' : 'Sound: on';
  }

  /* -------------------------------- panels -------------------------------- */

  private closeAll(): void {
    for (const dialog of [
      this.journal,
      this.shop,
      this.pause,
      this.confirm,
      this.sleepDialog,
      this.intro,
      this.letter,
      this.finale,
    ]) {
      if (dialog.open) dialog.close();
    }
  }

  private open(dialog: HTMLDialogElement): void {
    if (!dialog.open) dialog.showModal();
  }

  selectTab(tab: string): void {
    for (const button of this.tabs) {
      const active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    for (const pane of this.panes) {
      pane.classList.toggle('is-active', pane.dataset.pane === tab);
    }
  }

  openJournal(save: SaveData, tab: 'notes' | 'cats' | 'build' = 'notes'): void {
    this.closeAll();
    this.renderNotes(save);
    this.renderCats(save);
    this.renderBuild();
    this.selectTab(tab);
    this.open(this.journal);
  }

  private renderNotes(save: SaveData): void {
    const pane = this.panes.find((item) => item.dataset.pane === 'notes');
    if (!pane) return;
    const done = completedCount(save.quests);
    const next = QUESTS.find((quest) => !questDone(save.quests, quest.id));
    const rows = QUESTS.map((quest) => {
      const value = Math.min(save.quests[quest.id], quest.goal);
      const complete = value >= quest.goal;
      return `
        <li class="goal ${complete ? 'is-done' : ''}">
          <span class="goal__box" aria-hidden="true">${complete ? '✓' : ''}</span>
          <div>
            <p class="goal__title">${quest.title}</p>
            <p class="goal__hint">${quest.hint}</p>
          </div>
          <span class="goal__meta">${complete ? 'done' : `${value} / ${quest.goal}`}</span>
        </li>`;
    }).join('');

    const basket = save.inventory.turnip + save.inventory.carrot + save.inventory.moonflower;
    pane.innerHTML = `
      <div class="notes__intro">
        <p><b>${escapeHtml(save.farmer.name)}</b> · ${next ? `up next: ${next.title.toLowerCase()}.` : 'every note is complete. The valley is yours.'}</p>
        <span class="notes__count">${done} / ${QUESTS.length}</span>
      </div>
      <ul class="goals">${rows}</ul>
      <div class="stats">
        <div class="stat"><span class="stat__value">${save.stats.harvests}</span><span class="stat__label">Harvests</span></div>
        <div class="stat"><span class="stat__value">${save.stats.pets}</span><span class="stat__label">Pats given</span></div>
        <div class="stat"><span class="stat__value">${basket}</span><span class="stat__label">In the basket</span></div>
      </div>
      <p class="build__note">Watered soil grows overnight. Rain does the watering for you. Sleep at the farmhouse door.</p>
    `;
  }

  private renderCats(save: SaveData): void {
    const pane = this.panes.find((item) => item.dataset.pane === 'cats');
    if (!pane) return;
    pane.innerHTML = '<div class="catlist"></div>';
    const list = pane.querySelector('.catlist');
    if (!list) return;
    for (const cat of CATS) {
      const state = save.cats[cat.id];
      const card = document.createElement('article');
      card.className = `catcard ${state.met ? 'is-met' : ''}`;
      const portrait = document.createElement('div');
      portrait.className = 'catcard__portrait';
      portrait.append(catPortrait(cat));
      const body = document.createElement('div');
      const trust = Math.min(5, state.trust);
      body.innerHTML = `
        <h3 class="catcard__name">${cat.name}</h3>
        <p class="catcard__note">${state.met ? cat.line : `${cat.note}. Not met yet — look for ${cat.pronoun === 'he' ? 'him' : 'her'} around the valley.`}</p>
        <div class="hearts" aria-label="${trust} of 5 hearts">${Array.from({ length: 5 }, (_, index) => `<span class="${index < trust ? 'is-full' : ''}"></span>`).join('')}</div>
      `;
      const badge = document.createElement('span');
      badge.className = 'catcard__badge';
      badge.textContent = state.met ? 'met' : 'somewhere';
      card.append(portrait, body, badge);
      list.append(card);
    }
  }

  private renderBuild(): void {
    const pane = this.panes.find((item) => item.dataset.pane === 'build');
    if (!pane) return;
    pane.innerHTML = `
      <div class="build">
        <p class="build__lead">Powshan is a small valley game about coming home: a wild field, a dry well, and the cats who have been waiting for someone with softer hands.</p>
        <h3>What to do</h3>
        <ul>
          <li><b>Keep the field.</b> Hoe the fenced paddock, plant seeds from the stand, and water them. Sleep at the cottage door and the valley grows overnight. Rain does the watering for you.</li>
          <li><b>Meet the cats.</b> Sean and Powi came with you. Four more live out here. Walk close to say hello, or press <b>C</b> to call. Mumu will come running — but she does not want to be touched.</li>
          <li><b>Wake the well.</b> Grow moonflowers and offer three blooms at the old well. The valley has been quiet for a long time.</li>
        </ul>
        <h3>The cats</h3>
        <p>Sean leans on you. Powi warms up if you sit still. Uling keeps his distance. Adidas decides when a pat is allowed. Mingkay follows for a while, then finds a sunbeam. Mumu comes close, then slips out from under your hand.</p>
        <h3>The valley</h3>
        <p>A cottage, an overgrown field, a pond, a stream, an old oak and a seed stand run on trust. There is no timer and no wrong way to keep a day.</p>
        <p class="build__note">The cats are real; the valley is drawn by hand.</p>
      </div>
    `;
  }

  openShop(save: SaveData): void {
    this.closeAll();
    this.shopSave = save;
    this.renderShop();
    this.open(this.shop);
  }

  refreshShop(save: SaveData): void {
    this.shopSave = save;
    if (this.shop.open) this.renderShop();
  }

  private renderShop(): void {
    const save = this.shopSave;
    if (!save) return;
    this.shopGold.textContent = String(save.gold);
    const rows = (Object.keys(CROPS) as CropId[])
      .map((crop) => {
        const def = CROPS[crop];
        const owned = save.seeds[crop];
        const affordable = save.gold >= def.buy;
        return `
          <article class="seed">
            <div class="seed__art" aria-hidden="true" data-art="${SEED_ITEM[crop]}"></div>
            <div>
              <h3 class="seed__name">${SEED_LABEL[crop]} seeds</h3>
              <p class="seed__desc">${def.blurb}</p>
              <p class="seed__meta">${def.days} watered nights · ${def.sellable ? `sells for ${def.sell}g` : 'for the old well'} · ${owned} in your bag</p>
            </div>
            <button class="btn seed__buy" type="button" data-buy="${crop}" ${affordable ? '' : 'disabled'}>
              ${def.buy}g
            </button>
          </article>`;
      })
      .join('');

    const basket = (['turnip', 'carrot'] as const)
      .map((id) => ({ id, count: save.inventory[id], value: CROPS[id].sell }))
      .filter((entry) => entry.count > 0);
    const total = basket.reduce((sum, entry) => sum + entry.count * entry.value, 0);
    const basketText =
      basket.length === 0
        ? 'Your basket is empty. Ripen something and bring it back.'
        : basket.map((entry) => `${entry.count} ${entry.id}${entry.count === 1 ? '' : 's'}`).join(', ');
    const moons = save.inventory.moonflower;

    this.shopBody.innerHTML = `
      <div class="seedlist">${rows}</div>
      <div class="sell">
        <p class="sell__text">${basketText}<br /><span class="muted">${moons > 0 ? `${moons} moonflower${moons === 1 ? '' : 's'} saved for the well.` : 'Moonflowers are not for sale.'}</span></p>
        <button class="btn" type="button" data-sell ${total > 0 ? '' : 'disabled'}>Sell for ${total}g</button>
      </div>
    `;
    for (const holder of Array.from(this.shopBody.querySelectorAll<HTMLElement>('[data-art]'))) {
      const item = holder.dataset.art as ItemId;
      const canvas = itemIcon(item);
      canvas.setAttribute('aria-hidden', 'true');
      holder.append(canvas);
    }
  }

  openPause(muted: boolean): void {
    this.closeAll();
    this.setMuted(muted);
    this.open(this.pause);
  }

  openSleep(forecast: Weather): void {
    this.closeAll();
    const label = forecast === 'sunny' ? 'Sunny' : forecast === 'rain' ? 'Rain' : 'Cloudy';
    this.sleepForecast.textContent = label;
    this.open(this.sleepDialog);
  }

  openLetter(name: string): void {
    this.closeAll();
    const title = document.getElementById('letter-title');
    if (title) title.textContent = `Dear ${name},`;
    this.open(this.letter);
  }

  openFinale(save: SaveData): void {
    this.closeAll();
    this.finaleStats.innerHTML = `
      <div class="stat"><span class="stat__value">${save.day}</span><span class="stat__label">Days kept</span></div>
      <div class="stat"><span class="stat__value">${save.stats.harvests}</span><span class="stat__label">Harvests</span></div>
      <div class="stat"><span class="stat__value">${save.stats.pets}</span><span class="stat__label">Cat pats</span></div>
    `;
    this.open(this.finale);
  }

  closeFinale(): void {
    if (this.finale.open) this.finale.close();
  }

  closeJournal(): void {
    if (this.journal.open) this.journal.close();
  }
}
