/** Fixed 60 Hz simulation. Rendering is free to run at any refresh rate, and a
 *  backgrounded tab resumes without teleporting the farmer across the map. */

export const STEP = 1 / 60;
const MAX_FRAME = 0.1;
const MAX_STEPS = 6;

export class Loop {
  private accumulator = 0;
  private last = 0;
  private running = false;
  private frameId = 0;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: (alpha: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const elapsed = Math.min((now - this.last) / 1000, MAX_FRAME);
    this.last = now;
    this.accumulator += elapsed;

    let steps = 0;
    while (this.accumulator >= STEP && steps < MAX_STEPS) {
      this.update(STEP);
      this.accumulator -= STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS) this.accumulator = 0;

    this.render(this.accumulator / STEP);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
