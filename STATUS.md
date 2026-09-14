# Crane M0 — Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane` (local Vite free path — no Cursor cloud agent)

## Build

| Check | Result |
|-------|--------|
| `npm install` | ✅ passed |
| `npm run build` (`tsc && vite build`) | ✅ passed |
| Ready for `npm run dev` | ✅ yes |

Packages: `@babylonjs/core@^9.26.1`, `vite@^6.3.5`, `typescript@~5.8.3`

## What works

- Vite + TypeScript + Babylon.js project scaffold
- Training yard ~100×100 m (dirt / packed / grass)
- Placeholder tower crane ~40 m with required names:
  `CraneRoot`, `Tracks`, `Turntable`, `Counterweight`, `Cab`, `CabGlass`,
  `BoomRoot`, `Boom`, `JibTip`, `Cable`, `Hook`,
  `OutriggerN`, `OutriggerE`, `OutriggerS`, `OutriggerW`
- ArcRotateCamera: beta ≈ π/3, start radius 100, orbit+zoom, pan disabled, beta/radius clamps keep camera high
- Art palette materials (StandardMaterial) matching brief colors; glass ~40% alpha
- Soft hemisphere + warm directional lighting; light haze fog
- Props: 3 concrete pads, school shed, crates, barrels, cone ring, pad markers A/B
- HTML HUD: Apprentice / Training Yard / look-around objective / pay tease stub
- Career stub module (`src/career/`) — no real progression

## Caveats

- Crane is procedural boxes/cylinders only — no GLB art, no physics, no operator controls
- Pad markers A/B use simple geometric glyphs, not text meshes
- Shadows not enabled (keeps M0 light and friendly)
- Career / pay UI is cosmetic stub only
- Production bundle is large (~Babylon default chunk warning) — fine for M0; tree-shake/split later if needed
- Git push intentionally out of scope (parent handles git)

## Verify

```bash
cd /workspace/crane && npm install && npm run build
npm run dev
```
