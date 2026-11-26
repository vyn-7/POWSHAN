/** One input surface for keyboard, mouse and touch. The game only ever sees
 *  intents, so every verb works on every device. */

export type Dir = 'down' | 'up' | 'left' | 'right';

export interface InputFrame {
  x: number;
  y: number;
  run: boolean;
  use: boolean;
  interact: boolean;
  call: boolean;
  journal: boolean;
  pause: boolean;
  slot: number | null;
  mute: boolean;
}

const MOVE_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'Tab',
]);

export class Input {
  private readonly held = new Set<string>();
  private virtualX = 0;
  private virtualY = 0;
  private use = false;
  private interact = false;
  private call = false;
  private journal = false;
  private pause = false;
  private mute = false;
  private slot: number | null = null;
  private pointerUse = false;
  private pointerInteract = false;
  enabled = true;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clear);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    // Never swallow keys aimed at a text field — the name input needs WASD.
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (MOVE_KEYS.has(event.code)) event.preventDefault();
    if (event.repeat) return;

    this.held.add(event.code);
    switch (event.code) {
      case 'KeyE':
        this.interact = true;
        break;
      case 'KeyC':
        this.call = true;
        break;
      case 'KeyF':
      case 'Space':
        this.use = true;
        break;
      case 'KeyJ':
      case 'Tab':
        this.journal = true;
        break;
      case 'Escape':
        this.pause = true;
        break;
      case 'KeyM':
        this.mute = true;
        break;
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
        this.slot = Number(event.code.slice(5)) - 1;
        break;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.held.delete(event.code);
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return;
    if (event.button === 2) {
      this.pointerInteract = true;
      return;
    }
    if (event.button === 0) this.pointerUse = true;
  };

  private readonly clear = (): void => {
    this.held.clear();
    this.virtualX = 0;
    this.virtualY = 0;
  };

  setVirtualAxis(x: number, y: number): void {
    this.virtualX = x;
    this.virtualY = y;
  }

  pressUse(): void {
    if (this.enabled) this.use = true;
  }

  pressInteract(): void {
    if (this.enabled) this.interact = true;
  }

  pressCall(): void {
    if (this.enabled) this.call = true;
  }

  pressJournal(): void {
    this.journal = true;
  }

  pressPause(): void {
    this.pause = true;
  }

  consume(): InputFrame {
    const left = this.held.has('KeyA') || this.held.has('ArrowLeft');
    const right = this.held.has('KeyD') || this.held.has('ArrowRight');
    const up = this.held.has('KeyW') || this.held.has('ArrowUp');
    const down = this.held.has('KeyS') || this.held.has('ArrowDown');
    let x = (right ? 1 : 0) - (left ? 1 : 0);
    let y = (down ? 1 : 0) - (up ? 1 : 0);
    if (this.virtualX !== 0 || this.virtualY !== 0) {
      x = this.virtualX;
      y = this.virtualY;
    }
    if (!this.enabled) {
      x = 0;
      y = 0;
    }
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }

    const frame: InputFrame = {
      x,
      y,
      run: this.held.has('ShiftLeft') || this.held.has('ShiftRight'),
      use: this.use || this.pointerUse,
      interact: this.interact || this.pointerInteract,
      call: this.call,
      journal: this.journal,
      pause: this.pause,
      slot: this.slot,
      mute: this.mute,
    };

    this.use = false;
    this.interact = false;
    this.call = false;
    this.journal = false;
    this.pause = false;
    this.slot = null;
    this.mute = false;
    this.pointerUse = false;
    this.pointerInteract = false;
    return frame;
  }

  /** Used by the HUD joystick while a modal is closed. */
  get axis(): { x: number; y: number } {
    return { x: this.virtualX, y: this.virtualY };
  }
}
