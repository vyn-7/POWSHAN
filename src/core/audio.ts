/** The valley's voice: procedural wind, birds, rain, a quiet generative score
 *  and the five real cat meows. Nothing loads until the first gesture. */

export type AudioMood = {
  night: boolean;
  rain: boolean;
};

const MEOWS = ['/audio/meow1.mp3', '/audio/meow2.mp3', '/audio/meow3.mp3', '/audio/meow4.mp3', '/audio/meow5.mp3'];

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private windGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private delay: DelayNode | null = null;
  private meows: HTMLAudioElement[] = [];
  private nextBird = 2;
  private nextCricket = 1;
  private nextMusic = 0;
  private musicStep = 0;
  private unlocked = false;
  muted = false;

  constructor() {
    try {
      this.muted = window.localStorage.getItem('powshan.sound') === 'off';
    } catch {
      this.muted = false;
    }
    for (const src of MEOWS) {
      const audio = new window.Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.3;
      this.meows.push(audio);
    }
  }

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.85;
      this.master.connect(ctx.destination);

      const noise = this.noiseBuffer(ctx, 2.5);
      const wind = ctx.createBufferSource();
      wind.buffer = noise;
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 420;
      windFilter.Q.value = 0.4;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.035;
      wind.connect(windFilter).connect(this.windGain).connect(this.master);
      wind.start();

      const rain = ctx.createBufferSource();
      rain.buffer = this.noiseBuffer(ctx, 2.2);
      rain.loop = true;
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'highpass';
      rainFilter.frequency.value = 1600;
      this.rainGain = ctx.createGain();
      this.rainGain.gain.value = 0;
      rain.connect(rainFilter).connect(this.rainGain).connect(this.master);
      rain.start();

      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.delay = ctx.createDelay(1.2);
      this.delay.delayTime.value = 0.42;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.28;
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      this.musicGain.connect(this.master);
      this.musicGain.connect(this.delay);
      this.delay.connect(feedback).connect(this.delay);
      this.delay.connect(wet).connect(this.master);
      this.musicGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.16, ctx.currentTime + 2.5);

      void ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      window.localStorage.setItem('powshan.sound', muted ? 'off' : 'on');
    } catch {
      // ignore
    }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.85, this.ctx.currentTime + 0.2);
    }
    if (muted) {
      for (const meow of this.meows) meow.pause();
    }
  }

  update(dt: number, mood: AudioMood): void {
    if (!this.ctx || !this.unlocked || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (this.rainGain) {
      const target = mood.rain ? 0.075 : 0;
      this.rainGain.gain.setTargetAtTime(this.muted ? 0 : target, now, 0.8);
    }
    if (this.windGain) {
      const target = mood.night ? 0.024 : 0.036;
      this.windGain.gain.setTargetAtTime(this.muted ? 0 : target, now, 1.4);
    }

    this.nextBird -= dt;
    this.nextCricket -= dt;
    if (this.nextBird <= 0) {
      this.nextBird = 6 + Math.random() * 13;
      if (!mood.night && !mood.rain && !this.muted) this.bird(now);
    }
    if (this.nextCricket <= 0) {
      this.nextCricket = 2.4 + Math.random() * 3.5;
      if (mood.night && !mood.rain && !this.muted) this.cricket(now);
    }

    if (this.nextMusic === 0) this.nextMusic = now + 1.5;
    while (this.nextMusic < now + 1.2) {
      this.scheduleMusicStep(this.nextMusic, mood);
      this.nextMusic += 60 / 64;
    }
  }

  /* ------------------------------- effects -------------------------------- */

  meow(voice: number, volume = 0.35): void {
    if (!this.unlocked || this.muted) return;
    const audio = this.meows[Math.max(0, Math.min(this.meows.length - 1, voice - 1))];
    if (!audio) return;
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.playbackRate = 0.96 + Math.random() * 0.1;
    void audio.play().catch(() => undefined);
  }

  step(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const noise = this.noiseBuffer(ctx, 0.12);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 560;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(now);
    src.stop(now + 0.1);
  }

  hoe(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    this.tone(150, 58, 0.15, 'triangle', 0.1, now);
    const noise = this.noiseBuffer(ctx, 0.16);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(now);
  }

  water(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.42);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(now);
  }

  plant(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    this.tone(420, 720, 0.09, 'sine', 0.05, ctx.currentTime);
  }

  harvest(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    this.tone(620, 880, 0.08, 'triangle', 0.05, now);
    this.tone(880, 1180, 0.1, 'triangle', 0.04, now + 0.06);
  }

  coin(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    this.tone(988, 988, 0.06, 'square', 0.035, now);
    this.tone(1319, 1319, 0.1, 'square', 0.03, now + 0.07);
  }

  quest(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
      this.tone(freq, freq, 0.22, 'sine', 0.045, now + index * 0.09);
    });
  }

  sleepChime(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    [392, 329.63, 261.63].forEach((freq, index) => {
      this.tone(freq, freq, 0.5, 'sine', 0.04, now + index * 0.18);
    });
  }

  purr(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 46;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 28;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.12);
    gain.gain.linearRampToValueAtTime(0, now + 1.1);
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 1.2);
    lfo.stop(now + 1.2);
  }

  click(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    this.tone(660, 880, 0.045, 'square', 0.018, ctx.currentTime);
  }

  /** A two-note whistle that carries across the meadow. */
  call(): void {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;
    this.tone(880, 1180, 0.11, 'sine', 0.05, now);
    this.tone(1180, 990, 0.16, 'sine', 0.045, now + 0.13);
  }

  /* ------------------------------- synthesis ------------------------------ */

  private tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    at: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0005, at + duration);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  private bird(at: number): void {
    const base = 1500 + Math.random() * 900;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.tone(base + i * 80, base + 500 + i * 40, 0.055, 'sine', 0.025, at + i * 0.09);
    }
  }

  private cricket(at: number): void {
    for (let i = 0; i < 3; i++) {
      this.tone(4200, 4300, 0.018, 'square', 0.008, at + i * 0.055);
    }
  }

  private scheduleMusicStep(at: number, mood: AudioMood): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const step = this.musicStep % 32;
    const root = 146.83; // D3
    // Four slow chords, one bar each.
    const chords = [
      [0, 4, 7, 11],
      [-3, 0, 4, 9],
      [-5, -1, 2, 7],
      [-7, -3, 0, 5],
    ];
    if (step % 8 === 0) {
      const chord = chords[Math.floor(step / 8) % chords.length];
      for (const semitone of chord) {
        const freq = root * Math.pow(2, semitone / 12);
        this.pad(freq, at, 3.2, 0.012);
      }
    }
    const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16];
    const pattern = [0, 4, 2, 5, 3, 7, 1, 6];
    if (step % 2 === 0) {
      const index = pattern[Math.floor(step / 2) % pattern.length];
      const octave = step % 16 < 8 ? 2 : 1;
      const freq = root * Math.pow(2, (pentatonic[index] + octave * 12) / 12);
      const level = mood.night ? 0.014 : 0.02;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0004, at + 1.1);
      osc.connect(gain).connect(this.musicGain);
      osc.start(at);
      osc.stop(at + 1.2);
    }
    this.musicStep += 1;
  }

  private pad(freq: number, at: number, duration: number, volume: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.7);
    gain.gain.linearRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain).connect(this.musicGain);
    osc.start(at);
    osc.stop(at + duration + 0.1);
  }

  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
