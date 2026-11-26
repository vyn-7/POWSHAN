import { createCanvas, context, px, rect } from '../core/canvas';
import { clamp } from '../core/rng';
import { C } from './palette';

type Kind = 'dust' | 'drop' | 'sparkle' | 'heart' | 'leaf' | 'firefly' | 'rain' | 'smoke' | 'petal' | 'ripple' | 'note';

interface Particle {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  phase: number;
}

const heartCanvas = (() => {
  const canvas = createCanvas(7, 6);
  const ctx = context(canvas);
  const color = '#e88a83';
  px(ctx, 1, 1, color);
  px(ctx, 2, 1, color);
  px(ctx, 4, 1, color);
  px(ctx, 5, 1, color);
  rect(ctx, 1, 2, 5, 2, color);
  rect(ctx, 2, 4, 3, 1, color);
  px(ctx, 3, 5, color);
  px(ctx, 2, 2, '#f6c4b9');
  return canvas;
})();

export class Particles {
  private readonly items: Particle[] = [];

  private push(particle: Particle): void {
    if (this.items.length > 420) this.items.shift();
    this.items.push(particle);
  }

  dust(x: number, y: number, amount = 4, color = C.pathLight): void {
    for (let i = 0; i < amount; i++) {
      this.push({
        kind: 'dust',
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 8,
        life: 0.4 + Math.random() * 0.25,
        maxLife: 0.65,
        size: 1 + Math.floor(Math.random() * 2),
        color,
        phase: 0,
      });
    }
  }

  soil(x: number, y: number): void {
    for (let i = 0; i < 9; i++) {
      this.push({
        kind: 'dust',
        x: x + (Math.random() - 0.5) * 10,
        y: y - Math.random() * 3,
        vx: (Math.random() - 0.5) * 38,
        vy: -14 - Math.random() * 26,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        size: 1 + Math.floor(Math.random() * 2),
        color: Math.random() < 0.5 ? C.soilDark : C.soilLight,
        phase: 0,
      });
    }
  }

  water(x: number, y: number, direction: number): void {
    for (let i = 0; i < 9; i++) {
      this.push({
        kind: 'drop',
        x: x + (Math.random() - 0.5) * 4,
        y: y - 6 - Math.random() * 3,
        vx: direction * (6 + Math.random() * 16),
        vy: -12 - Math.random() * 14,
        life: 0.5 + Math.random() * 0.2,
        maxLife: 0.7,
        size: 1,
        color: Math.random() < 0.5 ? C.waterLight : C.waterFoam,
        phase: 0,
      });
    }
  }

  sparkle(x: number, y: number, amount = 7): void {
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 30;
      this.push({
        kind: 'sparkle',
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 18,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: Math.random() < 0.4 ? 2 : 1,
        color: Math.random() < 0.5 ? C.gold : '#fff0b0',
        phase: 0,
      });
    }
  }

  heart(x: number, y: number): void {
    this.push({
      kind: 'heart',
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: -18,
      life: 1.3,
      maxLife: 1.3,
      size: 1,
      color: '',
      phase: 0,
    });
  }

  leaf(x: number, y: number): void {
    this.push({
      kind: 'leaf',
      x,
      y,
      vx: 8 + Math.random() * 12,
      vy: 6 + Math.random() * 8,
      life: 3 + Math.random() * 2,
      maxLife: 5,
      size: 1,
      color: Math.random() < 0.6 ? C.leaf[2] : C.leaf[3],
      phase: Math.random() * Math.PI * 2,
    });
  }

  petal(x: number, y: number): void {
    this.push({
      kind: 'petal',
      x,
      y,
      vx: 7 + Math.random() * 10,
      vy: 8 + Math.random() * 8,
      life: 4 + Math.random() * 2,
      maxLife: 6,
      size: 1,
      color: Math.random() < 0.5 ? C.blossomLight : C.blossom,
      phase: Math.random() * Math.PI * 2,
    });
  }

  firefly(x: number, y: number): void {
    this.push({
      kind: 'firefly',
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 4,
      life: 4 + Math.random() * 4,
      maxLife: 8,
      size: 1,
      color: '#f4e59a',
      phase: Math.random() * Math.PI * 2,
    });
  }

  rain(x: number, y: number): void {
    this.push({
      kind: 'rain',
      x,
      y,
      vx: -18 - Math.random() * 10,
      vy: 180 + Math.random() * 70,
      life: 1.3,
      maxLife: 1.3,
      size: 1,
      color: Math.random() < 0.5 ? '#bfe0e2' : '#93bdc7',
      phase: 0,
    });
  }

  smoke(x: number, y: number): void {
    this.push({
      kind: 'smoke',
      x: x + (Math.random() - 0.5) * 3,
      y,
      vx: 3 + Math.random() * 4,
      vy: -7 - Math.random() * 5,
      life: 2.4 + Math.random() * 1.4,
      maxLife: 3.8,
      size: 2 + Math.floor(Math.random() * 3),
      color: '#cfc6b6',
      phase: Math.random() * Math.PI * 2,
    });
  }

  ripple(x: number, y: number): void {
    this.push({
      kind: 'ripple',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.7,
      maxLife: 0.7,
      size: 1,
      color: C.waterFoam,
      phase: 0,
    });
  }

  note(x: number, y: number): void {
    this.push({
      kind: 'note',
      x,
      y,
      vx: 4,
      vy: -10,
      life: 1.6,
      maxLife: 1.6,
      size: 1,
      color: C.gold,
      phase: 0,
    });
  }

  update(dt: number): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      p.phase += dt;
      switch (p.kind) {
        case 'dust':
          p.vx *= Math.exp(-3 * dt);
          p.vy += 22 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'drop':
          p.vy += 90 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'sparkle':
          p.vx *= Math.exp(-2.4 * dt);
          p.vy += 24 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'heart':
          p.x += Math.sin(p.phase * 3) * 6 * dt;
          p.y += p.vy * dt;
          break;
        case 'leaf':
        case 'petal':
          p.x += (p.vx + Math.sin(p.phase * 1.7) * 9) * dt;
          p.y += (p.vy + Math.cos(p.phase * 1.2) * 5) * dt;
          break;
        case 'firefly':
          p.x += (p.vx + Math.sin(p.phase * 1.4) * 7) * dt;
          p.y += (p.vy + Math.cos(p.phase * 1.9) * 5) * dt;
          break;
        case 'rain':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'smoke':
          p.x += (p.vx + Math.sin(p.phase)) * dt;
          p.y += p.vy * dt;
          p.vy *= Math.exp(-0.14 * dt);
          break;
        case 'ripple':
          break;
        case 'note':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, night = false, reducedMotion = false): void {
    for (const p of this.items) {
      const x = Math.round(p.x - cameraX);
      const y = Math.round(p.y - cameraY);
      if (x < -16 || x > 496 || y < -16 || y > 286) continue;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      switch (p.kind) {
        case 'dust':
          ctx.globalAlpha = alpha * 0.8;
          rect(ctx, x, y, p.size, p.size, p.color);
          break;
        case 'drop':
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, 1, 2);
          break;
        case 'sparkle':
          ctx.globalAlpha = alpha;
          if (p.size > 1) {
            ctx.fillStyle = p.color;
            ctx.fillRect(x - 1, y, 3, 1);
            ctx.fillRect(x, y - 1, 1, 3);
          } else {
            ctx.fillStyle = p.color;
            ctx.fillRect(x, y, 1, 1);
          }
          break;
        case 'heart':
          ctx.globalAlpha = alpha;
          ctx.drawImage(heartCanvas, x - 3, y - 3);
          break;
        case 'leaf':
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, 2, 1);
          if (Math.sin(p.phase * 6) > 0) ctx.fillRect(x, y + 1, 1, 1);
          break;
        case 'petal':
          ctx.globalAlpha = alpha * 0.9;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, 2, 2);
          break;
        case 'firefly': {
          const pulse = 0.5 + Math.sin(p.phase * 3.4) * 0.5;
          ctx.globalAlpha = alpha * (0.35 + pulse * 0.65);
          const glow = ctx.createRadialGradient(x + 0.5, y + 0.5, 0, x + 0.5, y + 0.5, 6);
          glow.addColorStop(0, 'rgba(247, 238, 160, 0.7)');
          glow.addColorStop(1, 'rgba(247, 238, 160, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 5, y - 5, 11, 11);
          ctx.fillStyle = '#faf3bb';
          ctx.fillRect(x, y, 1, 1);
          break;
        }
        case 'rain':
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 1, y + 4);
          ctx.stroke();
          break;
        case 'smoke':
          ctx.globalAlpha = alpha * 0.34;
          ctx.fillStyle = p.color;
          ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
          break;
        case 'ripple': {
          ctx.globalAlpha = alpha * 0.7;
          const size = 1 + Math.round((1 - alpha) * 5);
          ctx.fillStyle = p.color;
          ctx.fillRect(x - size, y, size * 2, 1);
          ctx.fillRect(x - size + 1, y - 1, size * 2 - 2, 1);
          break;
        }
        case 'note':
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, 2, 2);
          ctx.fillRect(x + 2, y - 3, 1, 3);
          break;
      }
    }
    ctx.globalAlpha = 1;
    if (night && !reducedMotion) {
      // nothing extra: the fireflies already carry the mood
    }
  }
}
