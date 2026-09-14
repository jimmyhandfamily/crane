# Crane — Milestone 0 (Training Yard)

Vite + TypeScript + Babylon.js free-path scaffold. One unit = one meter.

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

## What’s in M0

- Soft cartoon-real **training yard** (~100×100 m)
- Placeholder **tower crane** (~40 m) with required node names (`CraneRoot`, `Tracks`, `Turntable`, …)
- **ArcRotateCamera**: ~60° look-down, orbit + zoom only
- Props: ground, concrete pads, school shed, crates, barrels, cones, pad markers A/B
- HTML HUD: “Apprentice — Training Yard” + look-around objective
- Career **stub** only (no real progression)

## Layout

```
src/
  main.ts
  config/     # palette, units
  scene/      # ground, props, lights, materials
  camera/     # ArcRotateCamera setup
  crane/      # placeholder crane meshes
  ui/         # HUD helpers
  career/     # progression stub
```

## Out of scope (later milestones)

Crane physics/controls, GLB art, real career progression.
