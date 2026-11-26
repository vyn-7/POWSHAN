import { AudioSystem } from '../core/audio';
import { tinyText } from '../core/canvas';
import { clamp, damp } from '../core/rng';
import { Input, type Dir, type InputFrame } from '../core/input';
import { Loop } from '../core/loop';
import { CATS, type CatId, type CatProfile } from '../data/cats';
import { CROPS, HOTBAR, ITEMS, SEED_CROP, type CropId, type ItemId } from '../data/crops';
import { catPortrait, catSprites, type CatSprites } from '../render/cats';
import { cropSprites, drawPlot } from '../render/crops';
import { farmerSprites, type FarmerAvatar } from '../render/farmer';
import {
  makeBarrel,
  makeBeehive,
  makeBench,
  makeClothesline,
  makeCrate,
  makeHouse,
  makeLantern,
  makeMailbox,
  makeMilkCan,
  makeScarecrow,
  makeSign,
  makeStand,
  makeStones,
  makeWell,
} from '../render/house';
import { itemIcon } from '../render/icons';
import {
  drawAtBase,
  makeBush,
  makeCattailCluster,
  makeCushion,
  makeFlowerBush,
  makeLily,
  makeRock,
  makeTree,
  makeStump,
  makeWeed,
  type Sprite,
} from '../render/nature';
import { Particles } from '../render/particles';
import { softShadow } from '../render/shadow';
import { renderTerrain } from '../render/terrain';
import {
  growOvernight,
  harvest as harvestCrop,
  isRipe,
  plant as plantInPlot,
  plotKey,
  stageFor,
  type Plot,
} from '../systems/farm';
import { QUESTS, type QuestId } from '../systems/quests';
import { defaultSave, loadSave, storeSave, summarise, type SaveData } from '../systems/save';
import {
  DAY_END,
  DAY_START,
  MINUTES_PER_SECOND,
  isGolden,
  isNight,
  nightAmount,
  seasonFor,
  weatherFor,
  type Weather,
} from '../systems/time';
import { Hud, type HudBridge, type HudView } from '../ui/hud';
import {
  BEEHIVES,
  BENCH,
  CAT_SPOTS,
  HOUSE,
  INTERACT,
  LANTERNS,
  PLAYER_START,
  RUN_SPEED,
  SCARECROW,
  SIGN,
  STAND,
  TILE,
  TREES,
  VIEW_H,
  VIEW_W,
  WALK_SPEED,
  WEEDS,
  WELL,
  WORLD_H,
  WORLD_W,
  blocked,
  catBlocked,
  inField,
  nearWater,
} from '../world/layout';

type Mode = 'title' | 'playing' | 'cinematic';

interface Prop {
  sprite: Sprite;
  x: number;
  y: number;
  flip: boolean;
  /** Depth-sort anchor, when it differs from the draw base (e.g. the house). */
  sortY?: number;
}

interface CatActor {
  profile: CatProfile;
  sprites: CatSprites;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  dir: 1 | -1;
  pose: 'idle' | 'walk' | 'sit' | 'sleep';
  frame: number;
  frameClock: number;
  timer: number;
  moving: boolean;
  targetX: number;
  targetY: number;
  /** Seconds spent quietly near the farmer, for cats who warm up slowly. */
  settleClock: number;
  /** How long this cat is still answering a call. */
  callClock: number;
  /** Cooldown before the cat re-plans a called approach. */
  retargetClock: number;
  /** A short hop away after a refused pat. */
  dodgeClock: number;
  /** A little pixel emote above the cat: !, ?, Z. */
  emote: string;
  emoteClock: number;
}

interface Drawable {
  sprite: Sprite;
  x: number;
  y: number;
  flip: boolean;
  sortY?: number;
}

type Near =
  | { kind: 'cat'; cat: CatActor; label: string; distance: number }
  | { kind: 'door' | 'stand' | 'well' | 'sign'; label: string; distance: number }
  | null;

const ACTION_TIME = 0.34;

const PET_LINES: Record<CatId, string[]> = {
  sean: [
    'Sean purrs before your hand even lands. Zero dignity, total trust.',
    'A warm, heavy boy. He leans so hard you have to brace your knees.',
  ],
  powi: [
    'Powi presses her head into your palm, then pretends she did not.',
    'One blue eye opens. She shifts half an inch closer and goes back to sleep.',
  ],
  uling: [
    'Uling allows exactly one pat, then remembers he is a wild animal.',
    'He is already three steps away, looking back to check that you saw him leave.',
  ],
  adidas: [
    'Adidas accepts a second pat. Her tail says thank you; her face says nothing.',
    'She trots off with her tail high, thoroughly satisfied with her own mystery.',
  ],
  mingkay: [
    'Mingkay supervises the whole interaction, then headbutts your knee.',
    'A sunbeam cat. She finds the warmest patch and expects you to admire it too.',
  ],
  mumu: [
    'Mumu leans in until her whiskers almost touch your hand — then pours herself sideways, out of reach.',
    'She accepts the space beside you, not the hand. You leave it at that.',
  ],
};

const DODGE_LINES: Partial<Record<CatId, string[]>> = {
  mumu: [
    'Mumu slips aside like water, then settles a tail-length away. Close is the whole point; touch is not.',
    'Not a flinch, exactly. A decision. She watches your hand from a safe little distance.',
    'She lets you get near enough to hear the purr, then steps neatly out from under the pat.',
  ],
};

const DAY_SUBS: Record<Weather, string[]> = {
  sunny: ['Sun on the meadow.', 'The valley is warm today.', 'A good day to be outside.'],
  rain: ['Rain on the roof. The field waters itself.', 'Soft rain, and the smell of wet soil.'],
  cloudy: ['A grey, gentle morning.', 'Clouds over the wood. Good digging weather.'],
};

export class Game implements HudBridge {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hud: Hud;
  private readonly input: Input;
  private readonly audio: AudioSystem;
  private readonly particles = new Particles();
  private readonly loop: Loop;
  private farmer: Record<Dir, Sprite[]>;
  private readonly itemArt = new Map<ItemId, HTMLCanvasElement>();
  private terrain: HTMLCanvasElement;
  private props: Prop[] = [];
  private wellProp!: Prop;
  private cats: CatActor[] = [];
  private plots = new Map<string, Plot>();
  private save: SaveData;
  private selected = 0;
  private mode: Mode = 'title';
  private busy = false;
  private near: Near = null;
  private attractClock = 0;
  private hintTimer = 28;
  private saveClock = 0;
  private rainAccumulator = 0;
  private fireflyAccumulator = 0;
  private petalAccumulator = 0;
  private smokeAccumulator = 0;
  private nudgeClock = 0;
  private callCooldown = 0;
  private calledMumu = false;
  private cinematic = 0;
  private camera = { x: 0, y: 0 };
  private player = {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    dir: 'down' as Dir,
    moving: false,
    frame: 0,
    walkClock: 0,
    action: 0,
    actionItem: null as ItemId | null,
    actionTile: null as { x: number; y: number } | null,
    stepClock: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available.');
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = false;

    this.save = loadSave(this.storage());
    this.hud = new Hud();
    this.input = new Input(canvas);
    this.audio = new AudioSystem();
    this.terrain = renderTerrain();
    this.farmer = farmerSprites(this.save.farmer.avatar);
    for (const item of HOTBAR) this.itemArt.set(item, itemIcon(item));

    this.buildProps();
    this.syncPlots();
    this.respawnIfStuck();
    this.player.x = this.save.player.x;
    this.player.y = this.save.player.y;
    this.normaliseSave();
    this.buildCats();

    this.hud.setBridge(this);
    this.hud.setMuted(this.audio.muted);
    this.showTitle();
    this.hud.update(this.view());

    this.loop = new Loop(this.step, this.draw);
    this.loop.start();

    window.addEventListener('beforeunload', () => {
      if (this.save.started) this.persist();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.save.started) this.persist();
    });
  }

  /* ------------------------------- lifecycle ------------------------------- */

  private storage(): Storage | null {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  private normaliseSave(): void {
    const met = Object.values(this.save.cats).filter((cat) => cat.met).length;
    this.save.quests.cats = Math.max(this.save.quests.cats, met);
  }

  /** A save can outlive a layout change. Never leave the farmer in a wall or pond. */
  private respawnIfStuck(): void {
    const { x, y } = this.save.player;
    const outside = x < 16 || y < 16 || x > WORLD_W - 16 || y > WORLD_H - 16;
    if (outside || blocked(x, y)) {
      this.save.player = { x: PLAYER_START.x, y: PLAYER_START.y };
    }
  }

  private syncPlots(): void {
    this.plots.clear();
    for (const plot of this.save.plots) this.plots.set(plotKey(plot.x, plot.y), plot);
  }

  private persist(): void {
    this.save.player = { x: Math.round(this.player.x), y: Math.round(this.player.y) };
    this.save.minutes = Math.max(DAY_START, Math.min(DAY_END, Math.round(this.save.minutes)));
    storeSave(this.storage(), this.save);
    this.saveClock = 0;
  }

  private showTitle(): void {
    this.mode = 'title';
    this.busy = false;
    this.cinematic = 0;
    this.attractClock = 0;
    this.hud.hideHud();
    this.hud.showTitle(this.save.started, this.save.started ? summarise(this.save) : null);
    this.snapCamera();
    this.hud.update(this.view());
  }

  start(): void {
    this.audio.unlock();
    this.audio.click();
    if (this.save.started) this.enterValley();
    else this.hud.openIntro(this.save.farmer.name, this.save.farmer.avatar);
  }

  beginValley(name: string, avatar: FarmerAvatar): void {
    this.audio.unlock();
    this.audio.click();
    this.startNewValley(name, avatar);
  }

  private enterValley(): void {
    this.mode = 'playing';
    this.busy = false;
    this.respawnIfStuck();
    this.farmer = farmerSprites(this.save.farmer.avatar);
    this.player.x = this.save.player.x;
    this.player.y = this.save.player.y;
    this.syncPlots();
    this.hud.hideTitle();
    this.hud.showHud();
    this.hud.closeJournal();
    this.snapCamera();
    this.hud.update(this.view());
    if (this.save.day > 1) this.hud.fadeHint();
  }

  private startNewValley(name: string, avatar: FarmerAvatar): void {
    this.save = defaultSave();
    this.save.farmer = { name, avatar };
    this.save.started = true;
    this.save.player = { x: PLAYER_START.x, y: PLAYER_START.y };
    this.farmer = farmerSprites(avatar);
    this.player = {
      x: PLAYER_START.x,
      y: PLAYER_START.y,
      dir: 'down',
      moving: false,
      frame: 0,
      walkClock: 0,
      action: 0,
      actionItem: null,
      actionTile: null,
      stepClock: 0,
    };
    this.selected = 0;
    this.plots.clear();
    this.wellProp.sprite = makeWell(false);
    this.buildCats();
    this.mode = 'playing';
    this.busy = false;
    this.near = null;
    this.hintTimer = 28;
    this.callCooldown = 0;
    this.calledMumu = false;
    this.hud.hideTitle();
    this.hud.showHud();
    this.hud.closeJournal();
    this.snapCamera();
    this.hud.update(this.view());
    this.hud.openLetter(name);
    this.persist();
  }

  newValley(): void {
    this.audio.unlock();
    this.hud.openIntro(this.save.farmer.name, this.save.farmer.avatar);
  }

  returnToTitle(): void {
    if (this.save.started) this.persist();
    this.hud.hideDialogue();
    this.showTitle();
  }

  resume(): void {
    if (this.mode === 'title') return;
    if (this.busy) return;
    this.mode = 'playing';
  }

  letterDone(): void {
    this.mode = 'playing';
    this.audio.unlock();
    this.audio.click();
    this.showDayCard();
    this.persist();
    window.setTimeout(() => this.hud.fadeHint(), 9000);
  }

  finaleDone(): void {
    this.mode = 'playing';
    this.hud.toast('The well is awake. The valley hums.');
    this.persist();
  }

  openJournal(tab: 'notes' | 'cats' | 'build' = 'notes'): void {
    this.audio.unlock();
    if (this.save.started) this.persist();
    this.hud.openJournal(this.save, tab);
  }

  selectSlot(index: number): void {
    if (index < 0 || index >= HOTBAR.length) return;
    this.selected = index;
    this.audio.click();
    this.hud.update(this.view());
  }

  setVirtualAxis(x: number, y: number): void {
    this.input.setVirtualAxis(x, y);
  }

  pressUse(): void {
    this.audio.unlock();
    this.input.pressUse();
  }

  pressInteract(): void {
    this.audio.unlock();
    this.input.pressInteract();
  }

  pressCall(): void {
    this.audio.unlock();
    this.input.pressCall();
  }

  toggleMute(): boolean {
    this.audio.setMuted(!this.audio.muted);
    this.hud.setMuted(this.audio.muted);
    return this.audio.muted;
  }

  buySeed(crop: CropId): void {
    const def = CROPS[crop];
    if (this.save.gold < def.buy) {
      this.hud.toast(`Not enough gold for ${def.seedName.toLowerCase()}.`);
      return;
    }
    this.save.gold -= def.buy;
    this.save.seeds[crop] += 1;
    this.audio.coin();
    this.hud.toast(`${def.seedName} tucked into your bag.`);
    this.hud.refreshShop(this.save);
    this.persist();
  }

  sellProduce(): void {
    let total = 0;
    const parts: string[] = [];
    for (const crop of ['turnip', 'carrot'] as const) {
      const count = this.save.inventory[crop];
      if (count <= 0) continue;
      total += count * CROPS[crop].sell;
      parts.push(`${count} ${CROPS[crop].name.toLowerCase()}${count === 1 ? '' : 's'}`);
      this.save.inventory[crop] = 0;
    }
    if (total <= 0) return;
    this.save.gold += total;
    this.audio.coin();
    this.hud.toast(`Sold ${parts.join(' and ')} for ${total}g.`);
    this.hud.refreshShop(this.save);
    this.persist();
  }

  sleep(): void {
    if (this.busy) return;
    this.busy = true;
    this.hud.hideDialogue();
    this.hud.setFade(true);
    this.audio.sleepChime();
    window.setTimeout(() => {
      this.advanceDay();
      this.busy = false;
      this.mode = 'playing';
      this.hud.setFade(false);
      this.showDayCard();
      this.persist();
    }, 560);
  }

  private advanceDay(): void {
    const nextWeather = weatherFor(this.save.day + 1);
    const grown = growOvernight([...this.plots.values()], nextWeather === 'rain');
    this.plots = new Map(grown.map((plot) => [plotKey(plot.x, plot.y), plot]));
    this.save.plots = grown;
    this.save.day += 1;
    this.save.minutes = DAY_START;
    this.save.weather = nextWeather;
    this.save.energy = 100;
    this.save.water = 20;
    this.save.stats.days += 1;
    this.player.x = PLAYER_START.x;
    this.player.y = PLAYER_START.y;
    this.player.dir = 'down';
    this.save.player = { x: PLAYER_START.x, y: PLAYER_START.y };
    this.buildCats();
    this.snapCamera();
  }

  private showDayCard(): void {
    const season = seasonFor(this.save.day);
    const subs = DAY_SUBS[this.save.weather];
    const sub = this.save.day === 1 ? 'A good day to begin.' : subs[(this.save.day + this.save.day) % subs.length];
    this.hud.showDayCard(season, `Day ${this.save.day}`, sub);
  }

  /* --------------------------------- props --------------------------------- */

  private buildProps(): void {
    const props: Prop[] = [];
    const add = (sprite: Sprite, x: number, y: number, flip = false): void => {
      props.push({ sprite, x, y, flip });
    };

    // The house sorts by the foot of its steps, not its full sprite base, so the
    // farmer standing at the door (south of the collision) draws in front of it.
    props.push({ sprite: makeHouse(), x: HOUSE.x + HOUSE.w / 2, y: HOUSE.y + HOUSE.h + 2, flip: false, sortY: HOUSE.y + HOUSE.h - 8 });
    add(makeStand(), STAND.x, STAND.y + 18);
    this.wellProp = { sprite: makeWell(this.save.awake), x: WELL.x, y: WELL.y + 12, flip: false };
    props.push(this.wellProp);
    add(makeBench(), BENCH.x, BENCH.y + 6);
    add(makeSign(), SIGN.x, SIGN.y + 2);
    add(makeScarecrow(), SCARECROW.x, SCARECROW.y + 6);
    add(makeCushion(), 28.9 * TILE, 27.2 * TILE);
    add(makeClothesline(), 7.3 * TILE, 18.9 * TILE);
    add(makeMailbox(), 13.05 * TILE, 13.25 * TILE);
    add(makeBarrel(), 11.95 * TILE, 13.5 * TILE);
    add(makeCrate(), 12.75 * TILE, 13.6 * TILE);
    add(makeMilkCan(), 38.9 * TILE, 14.55 * TILE);
    add(makeStones(3), 20.8 * TILE, 30.2 * TILE);
    add(makeStones(8), 41.2 * TILE, 19.1 * TILE);

    for (const lantern of LANTERNS) add(makeLantern(), lantern.x, lantern.y);
    BEEHIVES.forEach((hive, index) => add(makeBeehive(index + 4), hive.x, hive.y + 3));

    add(makeFlowerBush(11), 3.7 * TILE, 11.8 * TILE);
    add(makeFlowerBush(19), 15.3 * TILE, 17.4 * TILE);
    add(makeFlowerBush(31), 44.8 * TILE, 21.2 * TILE);
    add(makeFlowerBush(43), 20.2 * TILE, 35.2 * TILE);
    add(makeFlowerBush(55), 56.3 * TILE, 29.2 * TILE);
    add(makeBush(1.1, 7), 46.7 * TILE, 31.1 * TILE);
    add(makeBush(0.9, 13), 5.5 * TILE, 26.5 * TILE);
    add(makeBush(1.2, 21), 30.9 * TILE, 23.9 * TILE);
    add(makeBush(1, 29), 51.1 * TILE, 31.7 * TILE);
    add(makeBush(0.8, 37), 21.4 * TILE, 37.6 * TILE);
    add(makeRock(1.15, 5), 42.4 * TILE, 24.9 * TILE);
    add(makeRock(0.9, 17), 57.6 * TILE, 33.1 * TILE);
    add(makeRock(1, 23), 15.4 * TILE, 25.4 * TILE);
    add(makeRock(0.8, 33), 60.2 * TILE, 39.1 * TILE);
    add(makeCattailCluster(2), 45.4 * TILE, 25.7 * TILE);
    add(makeCattailCluster(9), 44.8 * TILE, 28.6 * TILE);
    add(makeCattailCluster(14), 59.6 * TILE, 24.2 * TILE);
    add(makeCattailCluster(20), 52.1 * TILE, 9.2 * TILE);
    add(makeCattailCluster(26), 52.2 * TILE, 19.1 * TILE);
    add(makeLily(4), 49.3 * TILE, 26.1 * TILE);
    add(makeLily(12), 53.6 * TILE, 28.7 * TILE);

    TREES.forEach((tree, index) => add(makeTree(tree.kind, tree.scale, 101 + index * 37), tree.x, tree.y));
    WEEDS.forEach((weed, index) => {
      if (weed.kind === 'stone') add(makeRock(0.85, index + 50), weed.x, weed.y);
      else if (weed.kind === 'stump') add(makeStump(1, index + 70), weed.x, weed.y);
      else add(makeWeed(index + 90), weed.x, weed.y);
    });

    this.props = props;
  }

  private buildCats(): void {
    this.cats = CATS.map((profile) => {
      const spot = CAT_SPOTS.find((item) => item.id === profile.id);
      const homeX = spot ? spot.x : profile.home.x * TILE;
      const homeY = spot ? spot.y : profile.home.y * TILE;
      const x = homeX + (Math.random() - 0.5) * 20;
      const y = homeY + (Math.random() - 0.5) * 12;
      return {
        profile,
        sprites: catSprites(profile),
        x,
        y,
        homeX,
        homeY,
        dir: Math.random() < 0.5 ? -1 : 1,
        pose: 'idle',
        frame: 0,
        frameClock: 0,
        timer: 1 + Math.random() * 4,
        moving: false,
        targetX: x,
        targetY: y,
        settleClock: 0,
        callClock: 0,
        retargetClock: 0,
        dodgeClock: 0,
        emote: '',
        emoteClock: 0,
      };
    });
  }
  /* -------------------------------- update --------------------------------- */

  private readonly step = (dt: number): void => {
    const frame = this.input.consume();
    this.audio.update(dt, {
      night: isNight(this.visualMinutes()),
      rain: this.visualWeather() === 'rain',
    });

    if (this.mode === 'title') {
      this.input.enabled = false;
      this.attractClock += dt;
      this.updateCats(dt);
      this.updateAmbient(dt);
      this.particles.update(dt);
      this.updateCamera(dt);
      this.hud.update(this.view());
      return;
    }

    if (this.hud.modalOpen) {
      this.input.enabled = false;
      return;
    }

    if (this.mode === 'cinematic') {
      this.input.enabled = false;
      this.updateCinematic(dt);
      return;
    }

    if (this.busy) {
      this.input.enabled = false;
      this.updateAmbient(dt);
      this.particles.update(dt);
      this.updateCamera(dt);
      return;
    }

    this.input.enabled = true;
    if (frame.mute) this.toggleMute();
    if (frame.pause) {
      this.audio.click();
      this.persist();
      this.hud.openPause(this.audio.muted);
      return;
    }
    if (frame.journal) {
      this.openJournal();
      return;
    }
    if (frame.slot !== null) this.selectSlot(frame.slot);

    this.player.action = Math.max(0, this.player.action - dt);
    this.updatePlayer(dt, frame);
    this.near = this.findNear();
    if (frame.use) this.useTool();
    if (frame.interact) this.interact();

    this.save.minutes += dt * MINUTES_PER_SECOND;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.hud.fadeHint();
    }
    this.nudgeClock = Math.max(0, this.nudgeClock - dt);
    this.callCooldown = Math.max(0, this.callCooldown - dt);
    if (frame.call) this.callCats();
    this.updateCats(dt);
    this.updateAmbient(dt);
    this.particles.update(dt);
    this.updateCamera(dt);

    this.saveClock += dt;
    if (this.saveClock > 18 && this.save.started) this.persist();

    this.hud.update(this.view());
    if (this.save.minutes >= DAY_END) this.sleep();
  };

  private updatePlayer(dt: number, frame: InputFrame): void {
    const player = this.player;
    const x = frame.x;
    const y = frame.y;
    player.moving = x !== 0 || y !== 0;

    if (player.moving) {
      if (Math.abs(x) > Math.abs(y)) player.dir = x > 0 ? 'right' : 'left';
      else if (y !== 0) player.dir = y > 0 ? 'down' : 'up';
      const speed = (frame.run ? RUN_SPEED : WALK_SPEED) * dt;
      const nx = player.x + x * speed;
      const ny = player.y + y * speed;
      if (!blocked(nx, player.y)) player.x = nx;
      if (!blocked(player.x, ny)) player.y = ny;
      player.walkClock += dt;
      player.frame = Math.floor(player.walkClock * 7) % 4;
      player.stepClock -= dt;
      if (player.stepClock <= 0) {
        player.stepClock = frame.run ? 0.24 : 0.36;
        this.audio.step();
        if (Math.random() < 0.25) this.particles.dust(player.x, player.y - 1, 1);
      }
    } else {
      player.walkClock = 0;
      player.frame = 0;
      player.stepClock = 0;
    }
  }

  private visualMinutes(): number {
    return this.mode === 'title' ? 18 * 60 + 40 : this.save.minutes;
  }

  private visualWeather(): Weather {
    return this.mode === 'title' ? 'sunny' : this.save.weather;
  }

  private view(): HudView {
    const basket = this.save.inventory.turnip + this.save.inventory.carrot + this.save.inventory.moonflower;
    const prompt =
      this.mode === 'playing' && !this.busy && !this.hud.modalOpen && this.near ? this.near.label : null;
    return {
      energy: this.save.energy,
      gold: this.save.gold,
      water: this.save.water,
      minutes: this.mode === 'title' ? this.visualMinutes() : this.save.minutes,
      day: this.save.day,
      weather: this.save.weather,
      quests: this.save.quests,
      selected: this.selected,
      seeds: this.save.seeds,
      basket,
      prompt,
    };
  }

  /* -------------------------------- actions -------------------------------- */

  private targetTile(): { x: number; y: number } {
    const dx = this.player.dir === 'left' ? -1 : this.player.dir === 'right' ? 1 : 0;
    const dy = this.player.dir === 'up' ? -1 : this.player.dir === 'down' ? 1 : 0;
    const px = Math.floor(this.player.x / TILE);
    const py = Math.floor((this.player.y - 3) / TILE);
    return { x: px + dx, y: py + dy };
  }

  private nearWaterSource(): boolean {
    if (nearWater(this.player.x, this.player.y)) return true;
    return this.save.awake && Math.hypot(this.player.x - WELL.x, this.player.y - WELL.y) < 38;
  }

  private beginAction(item: ItemId, tile: { x: number; y: number } | null): void {
    this.player.action = ACTION_TIME;
    this.player.actionItem = item;
    this.player.actionTile = tile;
  }

  private spend(energy: number): boolean {
    if (this.save.energy < energy) {
      this.nudge('You are worn out. Sleep at the farmhouse and start fresh.');
      return false;
    }
    this.save.energy = Math.max(0, this.save.energy - energy);
    return true;
  }

  private nudge(text: string): void {
    if (this.nudgeClock > 0) return;
    this.nudgeClock = 2.4;
    this.hud.toast(text);
  }

  private commitPlots(): void {
    this.save.plots = [...this.plots.values()];
  }

  private useTool(): void {
    if (this.player.action > 0.08) return;
    const item = HOTBAR[this.selected];
    if (item === 'can' && this.nearWaterSource() && this.save.water < 20) {
      this.save.water = 20;
      this.audio.water();
      this.beginAction('can', null);
      this.hud.toast('The can is full again.');
      this.particles.sparkle(this.player.x, this.player.y - 8, 4);
      return;
    }
    const tile = this.targetTile();
    const key = plotKey(tile.x, tile.y);
    const plot = this.plots.get(key);
    const insideField = inField(tile.x * TILE + 8, tile.y * TILE + 8);

    if (item === 'hoe') {
      if (!insideField) {
        this.nudge('The old field is the place for digging.');
        return;
      }
      if (plot) {
        this.nudge('That patch is already tilled.');
        return;
      }
      if (!this.spend(ITEMS.hoe.energy)) return;
      const fresh: Plot = { x: tile.x, y: tile.y, tilled: true, watered: false, crop: null, growth: 0 };
      this.plots.set(key, fresh);
      this.commitPlots();
      this.bumpQuest('till', 1);
      this.audio.hoe();
      this.particles.soil(tile.x * TILE + 8, tile.y * TILE + 14);
      this.beginAction('hoe', tile);
      this.persist();
      return;
    }

    if (item === 'can') {
      if (!plot || !plot.tilled) {
        this.nudge('Water goes on tilled soil.');
        return;
      }
      if (this.save.water <= 0) {
        this.nudge('The can is empty. Fill it at the pond.');
        return;
      }
      if (plot.watered) {
        this.nudge('This soil is already dark with water.');
        return;
      }
      if (!this.spend(ITEMS.can.energy)) return;
      this.save.water -= 1;
      this.plots.set(key, { ...plot, watered: true });
      this.commitPlots();
      this.audio.water();
      this.particles.water(
        tile.x * TILE + 8,
        tile.y * TILE + 7,
        this.player.dir === 'left' ? -1 : this.player.dir === 'right' ? 1 : 0,
      );
      this.beginAction('can', tile);
      return;
    }

    if (item === 'hand') {
      if (!plot || !plot.crop) return;
      if (!isRipe(plot)) {
        const crop = CROPS[plot.crop];
        const left = Math.max(0, crop.days - plot.growth);
        this.nudge(`${crop.name} needs ${left} more watered night${left === 1 ? '' : 's'}.`);
        return;
      }
      if (!this.spend(ITEMS.hand.energy)) return;
      const crop = plot.crop;
      this.save.inventory[crop] += 1;
      this.save.stats.harvests += 1;
      this.plots.set(key, harvestCrop(plot));
      this.commitPlots();
      this.bumpQuest('harvest', 1);
      this.audio.harvest();
      this.particles.sparkle(tile.x * TILE + 8, tile.y * TILE + 8, 9);
      this.beginAction('hand', tile);
      this.persist();
      return;
    }

    const crop = SEED_CROP[item];
    if (!crop) return;
    if (!plot || !plot.tilled) {
      this.nudge('Till the soil first, then plant.');
      return;
    }
    if (plot.crop) {
      this.nudge('Something is already growing here.');
      return;
    }
    if (this.save.seeds[crop] <= 0) {
      this.nudge(`No ${CROPS[crop].seedName.toLowerCase()} left. The stand sells more.`);
      return;
    }
    if (!this.spend(ITEMS[item].energy)) return;
    this.save.seeds[crop] -= 1;
    this.plots.set(key, plantInPlot(plot, crop));
    this.commitPlots();
    this.save.stats.plantings += 1;
    this.bumpQuest('plant', 1);
    this.audio.plant();
    this.particles.sparkle(tile.x * TILE + 8, tile.y * TILE + 11, 4);
    this.beginAction(item, tile);
    this.persist();
  }

  private bumpQuest(id: QuestId, amount: number): void {
    const def = QUESTS.find((quest) => quest.id === id);
    if (!def) return;
    const before = this.save.quests[id];
    if (before >= def.goal) return;
    this.save.quests[id] = Math.min(def.goal, before + amount);
    if (this.save.quests[id] >= def.goal) {
      this.audio.quest();
      this.hud.toast(`Field note complete — ${def.title}.`);
    }
  }

  private findNear(): Near {
    const options: Array<NonNullable<Near>> = [];
    for (const cat of this.cats) {
      const distance = Math.hypot(this.player.x - cat.x, this.player.y - (cat.y - 6));
      if (distance < 34) {
        const met = this.save.cats[cat.profile.id].met;
        const label = !met
          ? `Say hello to ${cat.profile.name}`
          : cat.profile.temperament.dodgesPat
            ? `Reach for ${cat.profile.name}`
            : `Pet ${cat.profile.name}`;
        options.push({ kind: 'cat', cat, label, distance });
      }
    }
    const door = Math.hypot(this.player.x - INTERACT.door.x, this.player.y - INTERACT.door.y);
    if (door < 28) options.push({ kind: 'door', label: 'Go inside and rest', distance: door });
    const stand = Math.hypot(this.player.x - INTERACT.stand.x, this.player.y - INTERACT.stand.y);
    if (stand < 34) options.push({ kind: 'stand', label: 'Browse the seed stand', distance: stand });
    const well = Math.hypot(this.player.x - INTERACT.well.x, this.player.y - INTERACT.well.y);
    if (well < 40) {
      const label = this.save.awake
        ? 'Look into the well'
        : this.save.inventory.moonflower >= 3
          ? 'Offer three moonflowers'
          : 'Look at the old well';
      options.push({ kind: 'well', label, distance: well });
    }
    const sign = Math.hypot(this.player.x - INTERACT.sign.x, this.player.y - INTERACT.sign.y);
    if (sign < 26) options.push({ kind: 'sign', label: 'Read the old sign', distance: sign });
    options.sort((a, b) => a.distance - b.distance);
    return options[0] ?? null;
  }

  private interact(): void {
    const near = this.near;
    if (!near) return;
    this.audio.click();
    if (near.kind === 'cat') {
      this.petCat(near.cat);
      return;
    }
    if (near.kind === 'door') {
      this.persist();
      this.hud.openSleep(weatherFor(this.save.day + 1));
      return;
    }
    if (near.kind === 'stand') {
      this.persist();
      this.hud.openShop(this.save);
      return;
    }
    if (near.kind === 'sign') {
      this.hud.say(
        'The old sign',
        'POWSHAN — a little valley, named for Powi and Sean, the couple who came with the farmer. Population: one farmer, six cats, and an oak that has seen better centuries. The field is west of the gate; the well is south of the seed stand.',
      );
      return;
    }
    this.wellInteract();
  }

  private petCat(cat: CatActor): void {
    const state = this.save.cats[cat.profile.id];
    const first = !state.met;

    if (cat.profile.temperament.dodgesPat) {
      state.met = true;
      if (first) this.bumpQuest('cats', 1);
      const lines = DODGE_LINES[cat.profile.id] ?? ['She steps neatly out of reach.'];
      const line = first
        ? 'You reach out. Mumu closes the last few steps, tail up — then pours herself sideways, just out of reach. Close is good. Touch is not.'
        : lines[(state.trust + this.save.stats.pets) % lines.length];
      this.audio.meow(cat.profile.voice, 0.26);
      this.hud.say(cat.profile.name, line, catPortrait(cat.profile));
      this.particles.sparkle(cat.x, cat.y - 10, 3);
      const angle = Math.atan2(cat.y - this.player.y, cat.x - this.player.x) || Math.random() * Math.PI * 2;
      cat.targetX = cat.x + Math.cos(angle) * 28;
      cat.targetY = cat.y + Math.sin(angle) * 20;
      cat.moving = true;
      cat.pose = 'walk';
      cat.timer = 2;
      cat.callClock = 0;
      cat.dodgeClock = 1.4;
      cat.emote = '!';
      cat.emoteClock = 1.4;
      cat.dir = this.player.x >= cat.x ? 1 : -1;
      this.persist();
      return;
    }

    state.met = true;
    state.trust = Math.min(9, state.trust + 1);
    this.save.stats.pets += 1;
    if (first) this.bumpQuest('cats', 1);

    const lines = PET_LINES[cat.profile.id];
    const line = first ? cat.profile.line : lines[(state.trust - 1) % lines.length];
    this.audio.meow(cat.profile.voice, 0.3);
    this.audio.purr();
    this.hud.say(cat.profile.name, line, catPortrait(cat.profile));
    this.particles.heart(cat.x, cat.y - 13);
    this.particles.sparkle(cat.x, cat.y - 10, 3);
    cat.pose = 'sit';
    cat.moving = false;
    cat.timer = 4.5;
    cat.dir = this.player.x >= cat.x ? 1 : -1;
    this.persist();
  }

  private wellInteract(): void {
    if (this.save.awake) {
      this.hud.say(
        'The old well',
        'The water is high and warm, and it smells faintly of rain even on clear days. When you look in, the whole valley looks back.',
      );
      return;
    }
    if (this.save.inventory.moonflower >= 3) {
      this.beginFinale();
      return;
    }
    const have = this.save.inventory.moonflower;
    this.hud.toast(
      have === 0
        ? 'The well is dry. Three moonflowers would wake it.'
        : `The well is dry. ${have} of 3 moonflowers in your basket.`,
    );
  }

  private beginFinale(): void {
    this.save.inventory.moonflower -= 3;
    this.save.awake = true;
    this.save.quests.well = 3;
    this.wellProp.sprite = makeWell(true);
    this.mode = 'cinematic';
    this.busy = true;
    this.cinematic = 4.2;
    this.player.action = 0;
    this.hud.hideDialogue();
    this.audio.quest();
    this.audio.meow(3, 0.25);
    this.particles.sparkle(WELL.x, WELL.y - 18, 26);
    this.particles.sparkle(WELL.x, WELL.y - 8, 18);
    this.persist();
  }

  private updateCinematic(dt: number): void {
    this.cinematic -= dt;
    this.particles.update(dt);
    this.updateAmbient(dt);
    this.updateCamera(dt);
    if (Math.random() < 0.55) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 18 + Math.random() * 34;
      this.particles.sparkle(
        WELL.x + Math.cos(angle) * radius,
        WELL.y - 12 + Math.sin(angle) * radius * 0.45,
        1,
      );
    }
    if (Math.random() < 0.1) this.particles.heart(WELL.x + (Math.random() - 0.5) * 26, WELL.y - 26);
    this.hud.update(this.view());
    if (this.cinematic <= 0) {
      this.mode = 'playing';
      this.busy = false;
      this.hud.openFinale(this.save);
      this.persist();
    }
  }
  /* --------------------------------- cats ---------------------------------- */

  /** A whistle across the meadow. Each cat decides for herself whether it is
   *  worth getting up; Mumu almost always thinks it is. */
  private callCats(): void {
    if (this.callCooldown > 0) return;
    this.callCooldown = 1.4;
    this.audio.call();
    let answered = 0;
    let mumuFirst = false;
    for (const cat of this.cats) {
      const distance = Math.hypot(this.player.x - cat.x, this.player.y - cat.y);
      if (distance > 190) continue;
      const temperament = cat.profile.temperament;
      const eager = cat.profile.id === 'mumu' || cat.profile.id === 'sean';
      if (!eager && Math.random() > temperament.answers) {
        // Close enough to hear it, not moved enough to get up.
        if (distance < 110) {
          cat.emote = '?';
          cat.emoteClock = 1.2;
        }
        continue;
      }
      answered += 1;
      if (cat.profile.id === 'mumu' && !this.calledMumu) {
        this.calledMumu = true;
        mumuFirst = true;
      }
      cat.callClock = 4.5 + Math.random() * 2;
      cat.retargetClock = 0;
      cat.timer = 7;
      cat.pose = 'walk';
      cat.moving = true;
      cat.dodgeClock = 0;
      cat.emote = '!';
      cat.emoteClock = 1.6;
      window.setTimeout(() => this.audio.meow(cat.profile.voice, 0.16 + Math.random() * 0.12), 140 + Math.random() * 240);
    }
    if (mumuFirst) {
      this.hud.toast('Mumu\u2019s ears turn first. She is already on her way.');
    } else if (answered === 0) {
      this.nudge('Only the wind answers. Get a little closer.');
    }
  }

  private updateCats(dt: number): void {
    const night = isNight(this.visualMinutes());
    for (const cat of this.cats) {
      const profile = cat.profile;
      const temperament = profile.temperament;
      cat.frameClock += dt;
      cat.timer -= dt;
      cat.callClock = Math.max(0, cat.callClock - dt);
      cat.retargetClock = Math.max(0, cat.retargetClock - dt);
      cat.dodgeClock = Math.max(0, cat.dodgeClock - dt);
      cat.emoteClock = Math.max(0, cat.emoteClock - dt);
      if (cat.emoteClock === 0) cat.emote = '';

      const toPlayerX = this.player.x - cat.x;
      const toPlayerY = this.player.y - cat.y;
      const playerDistance = Math.hypot(toPlayerX, toPlayerY);

      // Quiet company is its own kind of trust. Cats with a `settles` value
      // warm up if you simply stand still nearby, no hand required.
      if (
        this.mode === 'playing' &&
        temperament.settles > 0 &&
        !this.player.moving &&
        cat.pose !== 'sleep' &&
        playerDistance < 46
      ) {
        cat.settleClock += dt;
        if (cat.settleClock >= temperament.settles) {
          cat.settleClock = 0;
          const state = this.save.cats[profile.id];
          if (state.met && state.trust < 9) {
            state.trust += 1;
            this.audio.purr();
            this.particles.heart(cat.x, cat.y - 13);
            this.hud.toast(`${profile.name} settles a little closer.`);
            this.persist();
          }
        }
      } else {
        cat.settleClock = Math.max(0, cat.settleClock - dt * 0.7);
      }

      if (cat.callClock > 0 && this.mode === 'playing') {
        // Answer the call: walk to a comfortable distance from the farmer.
        const stand = Math.max(18, temperament.keepAway + 10);
        if (cat.retargetClock <= 0) {
          cat.retargetClock = 0.55;
          const angle = Math.atan2(cat.y - this.player.y, cat.x - this.player.x) || Math.random() * Math.PI * 2;
          let tx = this.player.x + Math.cos(angle) * stand;
          let ty = this.player.y + Math.sin(angle) * stand;
          if (catBlocked(tx, ty)) {
            for (let attempt = 0; attempt < 8; attempt++) {
              const a = angle + (Math.PI / 4) * (attempt % 2 === 0 ? 1 : -1) * Math.ceil(attempt / 2);
              tx = this.player.x + Math.cos(a) * stand;
              ty = this.player.y + Math.sin(a) * stand;
              if (!catBlocked(tx, ty)) break;
            }
          }
          cat.targetX = tx;
          cat.targetY = ty;
          cat.moving = true;
          cat.pose = 'walk';
        }
        if (Math.hypot(cat.targetX - cat.x, cat.targetY - cat.y) < 5) {
          cat.callClock = 0;
          cat.moving = false;
          cat.pose = playerDistance < 26 ? 'sit' : 'idle';
          cat.timer = 2.5 + Math.random() * 2.5;
        }
      } else if (
        cat.dodgeClock <= 0 &&
        cat.pose !== 'sleep' &&
        temperament.keepAway > 0 &&
        playerDistance < temperament.keepAway &&
        cat.timer > 0.25
      ) {
        // Shy or independent cats keep their bubble without being asked.
        const angle = Math.atan2(cat.y - this.player.y, cat.x - this.player.x) || Math.random() * Math.PI * 2;
        const distance = temperament.keepAway + 12;
        const tx = this.player.x + Math.cos(angle) * distance;
        const ty = this.player.y + Math.sin(angle) * distance;
        if (!catBlocked(tx, ty)) {
          cat.targetX = tx;
          cat.targetY = ty;
          cat.moving = true;
          cat.pose = 'walk';
          cat.timer = 1.2;
        }
      }

      if (cat.moving) {
        const dx = cat.targetX - cat.x;
        const dy = cat.targetY - cat.y;
        const length = Math.hypot(dx, dy);
        if (length < 4) {
          cat.moving = false;
          cat.pose = 'idle';
          cat.timer = 0.9 + Math.random() * 2.4;
        } else {
          const speed = 11 + profile.energy * 8 + (cat.dodgeClock > 0 ? 8 : 0);
          const step = Math.min(length, speed * dt);
          const nx = cat.x + (dx / length) * step;
          const ny = cat.y + (dy / length) * step;
          if (catBlocked(nx, ny)) {
            cat.moving = false;
            cat.pose = 'idle';
            cat.timer = 1 + Math.random() * 2;
          } else {
            cat.x = nx;
            cat.y = ny;
            cat.dir = dx >= 0 ? 1 : -1;
            cat.frame = Math.floor(cat.frameClock * 8) % 4;
          }
        }
      } else if (cat.timer <= 0) {
        const sleepChance = (night ? 0.52 : 0.15) + profile.sleepiness * 0.24;
        const roll = Math.random();
        if (roll < sleepChance) {
          cat.pose = 'sleep';
          cat.timer = 7 + Math.random() * 9;
          cat.frame = 0;
        } else if (roll < sleepChance + 0.34) {
          cat.pose = 'sit';
          cat.timer = 3 + Math.random() * 5;
          cat.frame = 0;
        } else {
          cat.pose = 'walk';
          cat.moving = true;
          cat.timer = 7;
          const company = Math.random() < temperament.follow && playerDistance < 170;
          const stand = Math.max(20, temperament.keepAway + 10);
          let targetX = cat.homeX;
          let targetY = cat.homeY;
          if (company) {
            const angle = Math.random() * Math.PI * 2;
            targetX = this.player.x + Math.cos(angle) * stand;
            targetY = this.player.y + Math.sin(angle) * stand;
          }
          for (let attempt = 0; attempt < 8; attempt++) {
            if (!catBlocked(targetX, targetY)) break;
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * profile.roam * TILE * 0.7;
            targetX = (company ? this.player.x : cat.homeX) + Math.cos(angle) * distance;
            targetY = (company ? this.player.y : cat.homeY) + Math.sin(angle) * distance * 0.68;
          }
          if (catBlocked(targetX, targetY)) {
            targetX = cat.homeX;
            targetY = cat.homeY;
          }
          cat.targetX = targetX;
          cat.targetY = targetY;
        }
      }

      if (this.mode === 'playing' && cat.pose !== 'sleep') {
        const distance = Math.hypot(this.player.x - cat.x, this.player.y - cat.y);
        if (distance < 46) cat.dir = this.player.x >= cat.x ? 1 : -1;
      }
    }
  }

  private catSprite(cat: CatActor): Sprite {
    const set = cat.dir > 0 ? cat.sprites : (cat.sprites.flip ?? cat.sprites);
    if (cat.pose === 'sleep') return set.sleep;
    if (cat.pose === 'sit') return set.sit;
    if (cat.pose === 'walk' && cat.moving) return set.walk[cat.frame % 4];
    return set.idle;
  }

  /* ------------------------------- ambience -------------------------------- */

  private updateAmbient(dt: number): void {
    const camX = this.camera.x;
    const camY = this.camera.y;
    const minutes = this.visualMinutes();
    const weather = this.visualWeather();

    if (weather === 'rain') {
      this.rainAccumulator += dt * 62;
      while (this.rainAccumulator >= 1) {
        this.rainAccumulator -= 1;
        this.particles.rain(camX - 30 + Math.random() * (VIEW_W + 60), camY - 30 + Math.random() * 50);
      }
      if (Math.random() < 0.26) {
        this.particles.ripple(camX + Math.random() * VIEW_W, camY + 20 + Math.random() * (VIEW_H - 30));
      }
    } else if (!isNight(minutes)) {
      this.petalAccumulator += dt * 1.35;
      while (this.petalAccumulator >= 1) {
        this.petalAccumulator -= 1;
        this.particles.petal(camX + Math.random() * VIEW_W, camY - 8 + Math.random() * 70);
      }
    }

    if (isNight(minutes) || this.mode === 'cinematic') {
      this.fireflyAccumulator += dt * 3.2;
      while (this.fireflyAccumulator >= 1) {
        this.fireflyAccumulator -= 1;
        const x = camX + Math.random() * VIEW_W;
        const y = camY + 20 + Math.random() * (VIEW_H - 30);
        this.particles.firefly(x, y);
      }
    }

    this.smokeAccumulator += dt;
    if (this.smokeAccumulator >= 0.58) {
      this.smokeAccumulator = 0;
      this.particles.smoke(176, 56);
    }
  }

  /* -------------------------------- camera --------------------------------- */

  private smooth(t: number): number {
    const v = clamp(t, 0, 1);
    return v * v * (3 - 2 * v);
  }

  private cameraTarget(): { x: number; y: number } {
    let x: number;
    let y: number;
    if (this.mode === 'title') {
      const t = (this.attractClock % 84) / 84;
      const ease = t < 0.5 ? this.smooth(t * 2) : this.smooth((1 - t) * 2);
      x = 16 + ease * (WORLD_W - VIEW_W - 16);
      y = 0 + ease * (WORLD_H - VIEW_H);
    } else if (this.mode === 'cinematic') {
      x = WELL.x - VIEW_W / 2;
      y = WELL.y - 38 - VIEW_H / 2;
    } else {
      x = this.player.x - VIEW_W / 2;
      y = this.player.y - 154;
    }
    return {
      x: clamp(x, 0, WORLD_W - VIEW_W),
      y: clamp(y, 0, WORLD_H - VIEW_H),
    };
  }

  private updateCamera(dt: number): void {
    const target = this.cameraTarget();
    const rate = this.mode === 'title' ? 0.8 : this.mode === 'cinematic' ? 2.2 : 6.5;
    this.camera.x = damp(this.camera.x, target.x, rate, dt);
    this.camera.y = damp(this.camera.y, target.y, rate, dt);
  }

  private snapCamera(): void {
    const target = this.cameraTarget();
    this.camera.x = target.x;
    this.camera.y = target.y;
  }

  /* --------------------------------- draw ---------------------------------- */

  private visible(sprite: Sprite, x: number, y: number, camX: number, camY: number): boolean {
    const left = x - sprite.bx;
    const top = y - sprite.by;
    return (
      left < camX + VIEW_W + 12 &&
      left + sprite.canvas.width > camX - 12 &&
      top < camY + VIEW_H + 16 &&
      top + sprite.canvas.height > camY - 16
    );
  }

  private groundShadow(cx: number, cy: number, rx: number, ry: number, alpha = 0.22): void {
    softShadow(this.ctx, cx, cy, rx, ry, alpha);
  }

  private drawSoil(camX: number, camY: number): void {
    for (const plot of this.plots.values()) {
      const px0 = plot.x * TILE;
      const py0 = plot.y * TILE;
      if (px0 + TILE < camX || px0 > camX + VIEW_W || py0 + TILE < camY || py0 > camY + VIEW_H) continue;
      const neighbours = {
        up: this.plots.has(plotKey(plot.x, plot.y - 1)),
        down: this.plots.has(plotKey(plot.x, plot.y + 1)),
        left: this.plots.has(plotKey(plot.x - 1, plot.y)),
        right: this.plots.has(plotKey(plot.x + 1, plot.y)),
      };
      drawPlot(this.ctx, plot, px0 - camX, py0 - camY, neighbours, plot.x * 31 + plot.y * 7 + 1);
    }
  }

  private drawHighlight(camX: number, camY: number): void {
    if (this.hud.modalOpen) return;
    const tile = this.targetTile();
    if (!inField(tile.x * TILE + 8, tile.y * TILE + 8)) return;
    const plot = this.plots.get(plotKey(tile.x, tile.y));
    const item = HOTBAR[this.selected];
    let valid = false;
    if (item === 'hoe') valid = !plot;
    else if (item === 'can') valid = Boolean(plot?.tilled && !plot.watered && this.save.water > 0);
    else if (item === 'hand') valid = Boolean(plot && plot.crop && isRipe(plot));
    else {
      const crop = SEED_CROP[item];
      valid = Boolean(crop && plot?.tilled && !plot.crop && this.save.seeds[crop] > 0);
    }
    const ctx = this.ctx;
    const x = tile.x * TILE - camX;
    const y = tile.y * TILE - camY;
    ctx.fillStyle = 'rgba(255, 247, 214, 0.055)';
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = valid ? 'rgba(255, 243, 197, 0.62)' : 'rgba(220, 143, 120, 0.42)';
    const corner = 4;
    ctx.fillRect(x, y, corner, 1);
    ctx.fillRect(x, y, 1, corner);
    ctx.fillRect(x + TILE - corner, y, corner, 1);
    ctx.fillRect(x + TILE - 1, y, 1, corner);
    ctx.fillRect(x, y + TILE - 1, corner, 1);
    ctx.fillRect(x, y + TILE - corner, 1, corner);
    ctx.fillRect(x + TILE - corner, y + TILE - 1, corner, 1);
    ctx.fillRect(x + TILE - 1, y + TILE - corner, 1, corner);
  }

  private drawActionOverlay(camX: number, camY: number): void {
    const item = this.player.actionItem;
    if (this.player.action <= 0 || !item) return;
    const art = this.itemArt.get(item);
    if (!art) return;
    const progress = 1 - this.player.action / ACTION_TIME;
    let cx: number;
    let cy: number;
    if (this.player.actionTile) {
      cx = this.player.actionTile.x * TILE + 8;
      cy = this.player.actionTile.y * TILE + 8;
    } else {
      const dx = this.player.dir === 'left' ? -11 : this.player.dir === 'right' ? 11 : 0;
      const dy = this.player.dir === 'up' ? -14 : this.player.dir === 'down' ? 8 : -6;
      cx = this.player.x + dx;
      cy = this.player.y + dy;
    }
    const bob = Math.sin(progress * Math.PI) * 5;
    const ctx = this.ctx;
    ctx.globalAlpha = progress > 0.82 ? Math.max(0, (1 - progress) / 0.18) : 1;
    ctx.drawImage(
      art,
      Math.round(cx - camX - art.width / 2),
      Math.round(cy - camY - art.height / 2 - 5 - bob),
    );
    ctx.globalAlpha = 1;
  }

  private glow(x: number, y: number, radius: number, color: string, alpha: number): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(${color}, ${alpha * 0.36})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  private drawLighting(camX: number, camY: number): void {
    const ctx = this.ctx;
    const minutes = this.visualMinutes();
    const weather = this.visualWeather();
    const night = nightAmount(minutes);

    if (weather === 'rain') {
      ctx.fillStyle = 'rgba(49, 67, 78, 0.16)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    } else if (weather === 'cloudy') {
      ctx.fillStyle = 'rgba(84, 92, 78, 0.06)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (isGolden(minutes)) {
      ctx.fillStyle = 'rgba(255, 156, 82, 0.055)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (night <= 0.02) return;

    ctx.fillStyle = `rgba(25, 35, 64, ${night * 0.52})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.globalCompositeOperation = 'lighter';
    const strength = this.save.awake ? 1 : 0.72;
    for (const lantern of LANTERNS) {
      const x = lantern.x - camX;
      const y = lantern.y - 13 - camY;
      if (x < -50 || x > VIEW_W + 50 || y < -50 || y > VIEW_H + 50) continue;
      this.glow(x, y, 42, '255, 202, 118', 0.34 * night * strength);
    }
    this.glow(111 - camX, 120 - camY, 28, '255, 198, 110', 0.3 * night);
    this.glow(177 - camX, 120 - camY, 28, '255, 198, 110', 0.3 * night);
    if (this.save.awake) {
      this.glow(WELL.x - camX, WELL.y - 26 - camY, 46, '138, 233, 213', 0.3 * night);
    }
    if (this.mode === 'cinematic') {
      const pulse = 0.4 + Math.sin(this.attractClock * 5 + this.cinematic) * 0.1;
      this.glow(WELL.x - camX, WELL.y - 22 - camY, 70, '255, 240, 173', pulse * 0.55);
      this.glow(WELL.x - camX, WELL.y - 22 - camY, 120, '142, 236, 214', pulse * 0.28);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Small pixel thought bubbles above cats: a surprised "!", a curious "?". */
  private drawEmotes(camX: number, camY: number): void {
    const ctx = this.ctx;
    for (const cat of this.cats) {
      if (!cat.emote) continue;
      const x = Math.round(cat.x - camX);
      const y = Math.round(cat.y - camY - 26);
      if (x < -16 || x > VIEW_W + 16 || y < -16 || y > VIEW_H + 16) continue;
      const bob = Math.round(Math.sin(cat.emoteClock * 10) * 1);
      const top = y + bob;
      ctx.fillStyle = 'rgba(43, 30, 22, 0.88)';
      ctx.fillRect(x - 5, top - 5, 11, 10);
      ctx.fillRect(x - 1, top + 5, 3, 2);
      tinyText(ctx, cat.emote, x, top - 3, '#f6ecd2', 1, 'center');
    }
  }

  private readonly draw = (): void => {
    const ctx = this.ctx;
    const camX = Math.round(this.camera.x);
    const camY = Math.round(this.camera.y);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(this.terrain, camX, camY, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

    this.drawSoil(camX, camY);
    if (this.mode === 'playing') this.drawHighlight(camX, camY);

    for (const cat of this.cats) {
      if (this.visible(this.catSprite(cat), cat.x, cat.y, camX, camY)) {
        this.groundShadow(cat.x - camX, cat.y - 1 - camY, 5.5, 2.2, 0.18);
      }
    }
    if (this.mode !== 'title') this.groundShadow(this.player.x - camX, this.player.y - 1 - camY, 7, 2.8, 0.24);

    const list: Drawable[] = [];
    for (const prop of this.props) {
      if (this.visible(prop.sprite, prop.x, prop.y, camX, camY)) {
        list.push({ sprite: prop.sprite, x: prop.x, y: prop.y, flip: prop.flip, sortY: prop.sortY });
      }
    }
    for (const cat of this.cats) {
      const sprite = this.catSprite(cat);
      if (this.visible(sprite, cat.x, cat.y, camX, camY)) {
        list.push({ sprite, x: cat.x, y: cat.y, flip: cat.dir < 0 });
      }
    }
    if (this.mode !== 'title') {
      const frame = this.player.moving ? this.player.frame : 0;
      const sprite = this.farmer[this.player.dir][frame] ?? this.farmer[this.player.dir][0];
      list.push({ sprite, x: this.player.x, y: this.player.y, flip: false });
    }
    for (const plot of this.plots.values()) {
      const crop = plot.crop;
      if (!crop) continue;
      const sprite = cropSprites(crop)[stageFor(crop, plot.growth)];
      const x = plot.x * TILE + 8;
      const y = plot.y * TILE + 16;
      if (this.visible(sprite, x, y, camX, camY)) {
        list.push({ sprite, x, y, flip: false });
      }
    }

    list.sort((a, b) => (a.sortY ?? a.y) - (b.sortY ?? b.y));
    for (const item of list) drawAtBase(ctx, item.sprite, item.x - camX, item.y - camY, item.flip);

    this.drawEmotes(camX, camY);
    this.drawActionOverlay(camX, camY);
    this.drawLighting(camX, camY);
    this.particles.draw(ctx, camX, camY, isNight(this.visualMinutes()), false);
  };
}
