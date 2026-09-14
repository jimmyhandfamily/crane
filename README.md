# Crane — Training Yard (Three.js)

Vite + TypeScript + Three.js free-path crane sim. One unit = one meter.

## Quick start

```bash
cd /workspace/crane
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview the production build |

## What’s in

- Soft cartoon-real **training yard** (~100×100 m), Dredge-warmer palette
- Procedural **tower crane** (~40 m) with named nodes (`CraneRoot`, `Tracks`, `Turntable`, …)
- **OrbitControls**: ~60° look-down, orbit + zoom only (ArcRotate-like)
- Controls: A/D slew, W/S trolley, R/F hoist + on-screen pad; Space grab/release
- Mild spring-damper **hook sway**; load mass; wind stub; near-invisible boom flex
- Crates/barrels grab/place on pads; win by placing crate on Pad A/B
- Hook/load ground blob shadows; ambient trucks, berms, walking workers
- Slim HUD: apprentice card + objective under it (top-left), load meter, control pad

## Layout

```
src/
  main.ts
  config/     # palette, units
  scene/      # ground, props, lights, materials, ambient, shadows
  camera/     # OrbitControls setup
  crane/      # meshes, controls, physics, controller
  loads/      # grab/place manager
  ui/         # HUD helpers
  career/     # progression stub
```

## Engine

Rebuilt on **Three.js** (Babylon.js removed). Gameplay preserved; rendering/scene graph rewritten.
