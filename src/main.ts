import { Game } from './game/game';

const canvas = document.getElementById('game');
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The valley canvas is missing.');

const game = new Game(canvas);

/* The DOM HUD is authored in game units: one unit is one 480x270 pixel. */
const stage = document.getElementById('stage');
const fitUi = (): void => {
  if (!stage) return;
  const unit = Math.max(1.8, Math.min(3.1, stage.clientWidth / 480));
  document.documentElement.style.setProperty('--u', unit.toFixed(3));
};
fitUi();
window.addEventListener('resize', fitUi);

/* Boot card: hold just long enough for the pixel font and first frame. */
const boot = document.getElementById('boot');
const reveal = (): void => {
  boot?.classList.add('is-hidden');
  window.setTimeout(() => boot?.remove(), 800);
};
if (document.fonts?.ready) {
  void document.fonts.ready.then(() => requestAnimationFrame(reveal));
} else {
  requestAnimationFrame(reveal);
}

/* Touch: a floating stick on the left, two verbs on the right. */
const stick = document.getElementById('stick');
const knob = document.getElementById('stick-knob');
const touchUse = document.getElementById('touch-use');
const touchAct = document.getElementById('touch-act');
const touchCall = document.getElementById('touch-call');
let stickPointer: number | null = null;

const resetStick = (): void => {
  stickPointer = null;
  game.setVirtualAxis(0, 0);
  if (knob) knob.style.transform = 'translate(-50%, -50%)';
};

const moveStick = (event: PointerEvent): void => {
  if (!stick) return;
  const rect = stick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const limit = rect.width * 0.32;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const length = Math.hypot(dx, dy);
  if (length > limit) {
    dx = (dx / length) * limit;
    dy = (dy / length) * limit;
  }
  const x = dx / limit;
  const y = dy / limit;
  game.setVirtualAxis(Math.abs(x) < 0.16 ? 0 : x, Math.abs(y) < 0.16 ? 0 : y);
  if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
};

stick?.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  stickPointer = event.pointerId;
  stick.setPointerCapture(event.pointerId);
  moveStick(event);
});
stick?.addEventListener('pointermove', (event) => {
  if (stickPointer !== event.pointerId) return;
  event.preventDefault();
  moveStick(event);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
  stick?.addEventListener(type, (event) => {
    if (stickPointer !== null && event.pointerId !== stickPointer) return;
    resetStick();
  });
}

const tap = (button: HTMLElement | null, press: () => void): void => {
  button?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    press();
  });
};
tap(touchUse, () => game.pressUse());
tap(touchAct, () => game.pressInteract());
tap(touchCall, () => game.pressCall());

/* Losing focus should never leave the farmer walking. */
window.addEventListener('blur', resetStick);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) resetStick();
});

if (import.meta.env.DEV) {
  Object.assign(window, { powshan: game });
}
