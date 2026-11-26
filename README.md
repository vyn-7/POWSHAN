<div align="center">

# POWSHAN

**A hand-pixelled farming game about six real cats, a wild field, and a well that has forgotten how to sing.**

[![Play the game](https://img.shields.io/badge/Play-powshan.vercel.app-2f7d32?style=for-the-badge&logo=vercel&logoColor=white)](https://powshan.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/tests-19%20passing-brightgreen?style=for-the-badge)](tests/)

**Play in your browser → [powshan.vercel.app](https://powshan.vercel.app/)** · no install, no account, works on desktop and mobile.

</div>

---

POWSHAN is a small farming game you play at your own pace. You move into a cottage at the edge of a meadow with two cats, **Powi** and **Sean** — the couple the valley is named after. The field is overgrown, the old well has run dry, and four more cats live out there on their own terms. Hoe the field, plant and water crops, sleep to grow them overnight, befriend the cats one by one, and carry three moonflowers to the well to wake the valley.

There is no timer, no fail state, and no wrong way to spend a day.

## Why it exists

Most "cozy game" projects are a stack of downloaded art packs and a game engine. POWSHAN is the opposite: **every pixel is drawn in code**, there are **no runtime dependencies**, and the whole simulation is a few hundred lines of pure TypeScript you can read in an afternoon. It is built to be small enough to understand and complete enough to actually finish.

## What is in the box

- **A hand-drawn valley** — terrain, cottage, cats, crops and props are all painted procedurally with the Canvas 2D API at a 480×270 internal resolution, then nearest-neighbour upscaled. No sprite sheets, no asset pipeline.
- **Six cats with real behaviour** — each cat has a temperament (follow distance, call response, whether it dodges a pat, how long it takes to trust you). Personality is something you observe, not a line of dialogue you read.
- **A complete farm loop** — till, plant, water, sleep, harvest, sell, buy seed. Weather (sun, rain, cloud) changes the day, and rain waters the field for you.
- **A goal that ends** — grow moonflowers, offer three at the old well, and the valley wakes up. A short game with a real ending, not an idle loop.
- **Deterministic and testable** — the simulation is pure and seeded, so the farm, weather and cat logic are covered by [Vitest](tests/) tests that run in CI in seconds.

## Play

Open **[powshan.vercel.app](https://powshan.vercel.app/)**, name your farmer, and open the gate. Progress saves to `localStorage` automatically.

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Walk | `WASD` / arrow keys | floating stick |
| Run | `Shift` | — |
| Use tool | `Space` / `F` / left click | **Use** |
| Talk, read, shop, sleep | `E` / right click | **Talk** |
| Call the cats | `C` | **Call** |
| Select hotbar slot | `1`–`6` | tap slot |
| Field notes | `J` / `Tab` | — |
| Pause | `Esc` | — |
| Mute | `M` | — |

Portrait phones are asked to rotate to landscape.

## Run it locally

```bash
git clone https://github.com/vyn-7/powshan.git
cd powshan
npm install
npm run dev        # http://127.0.0.1:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm test` | Run the Vitest suite (simulation, cats, save) |
| `npm run build` | Typecheck (`tsc --noEmit`) + production bundle into `dist/` |
| `npm run preview` | Serve the production build locally |

**Requirements:** Node 18+ and npm. Nothing else — no global tooling, no native modules.

## Architecture

The codebase is split so the simulation never touches the DOM. `Game` owns state and the update/draw loop; rendering and UI are injected, which is what makes the core testable without a browser.

```
src/
  core/      canvas helpers, input, fixed-step loop, seeded RNG, audio
  data/      crop definitions and the six cat profiles
  render/    palette + every sprite and terrain painter (all procedural)
  systems/   time, farming, quests, save/load
  ui/        DOM HUD, journal, shop, dialogs
  world/     world layout, collision, interaction points
  game/      the Game class: update, draw order, player actions
tests/       Vitest coverage for the pure simulation
legacy-2d/   the original prototype, kept for reference
```

### Design notes

- **Fixed internal resolution.** The world renders at 480×270 and is scaled by an integer-ish factor, so pixel art stays crisp at any window size.
- **Seeded generation.** Terrain and the treeline use a fixed-seed RNG (`Bag`), so the valley is identical on every visit and across machines.
- **Pure simulation core.** Farming, weather and cat temperament are plain functions over state — no `canvas`, no `window` — which is why they can be unit-tested directly.
- **Zero runtime dependencies.** `package.json` ships only `devDependencies`. The shipped bundle is a single HTML file plus one JS and one CSS asset.

## Deploy

The repo is wired for Vercel. `vercel.json` builds with `npm run build` and serves `dist/`:

```json
{ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist", "cleanUrls": true }
```

Import the GitHub repo into Vercel and every push to `main` redeploys. Any static host works — the output of `npm run build` is self-contained.

## Contributing

Issues and pull requests are welcome. A few ground rules:

- Keep the **no-runtime-dependency** rule — dev tooling is fine, shipped code is not.
- New simulation logic goes in `systems/` as pure functions, with a test in `tests/`.
- Sprites and terrain are drawn in code under `render/`; please don't introduce binary art assets.
- Run `npm test` and `npm run build` before opening a PR.

## License

Released under the [MIT License](LICENSE). The cats are real; the valley is drawn from scratch.

<div align="center">
Made with care by <a href="https://github.com/vyn-7">@vyn-7</a>.
</div>