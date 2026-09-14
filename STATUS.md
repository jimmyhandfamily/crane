# Crane — Three.js Port Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane`

## Build

| Check | Result |
|-------|--------|
| Engine | **Three.js** + Vite + TypeScript |
| `@babylonjs/*` | Removed |
| `npm run build` | **Passes** |

Packages: `three@^0.186`, `@types/three`, `vite@^6.3.5`, `typescript@~5.8.3`

## Improvements 1–5 (this session)

### 1. localStorage persist
- Key `crane.career.v1`: day rate, jobsCompleted, title, lesson1/2 flags, padA/padB placed.
- Restored on load; HUD title, pay tease, and objective sync from career state.
- Rank stays **Apprentice**.

### 2. Lesson 2
- Lesson 1: place a crate on **Pad A** → pay bump + title → “Training Yard — Lesson 2”.
- Lesson 2 objective: place crates on **both Pad A and Pad B** (✓/○ tracked each).
- When both pads done → Lesson 2 complete, title “Training Yard — Graduated”, second pay bump.
- Lattice crane / grab highlight / mixer / wind unchanged.

### 3. Swing warning
- `getSwayAngle()` on physics; threshold `SWAY_WARN_ANGLE` ≈ 3.2°.
- When loaded and sway above threshold: load meter `data-band="swing"`, label **“Swing high”** (orange).
- Clears when settled or hook empty.

### 4. Soft magnet snap
- Free load in attach range and nearly aligned (`SOFT_MAGNET_ALIGN_FRAC` of horiz max):
  gentle world-XZ nudge via `physics.applySoftMagnet` (capped ~3.5 cm/frame).
- Subtle assist — not sticky teleport; grab highlight still drives aim UX.

### 5. Sky
- `scene/sky.ts`: canvas vertical gradient background + 3 soft cloud planes.
- Friendly cartoon-real look; fog haze preserved.

## Structure pass (prior)

- **Mast:** open 2.2×2.2 m square lattice; yellow chords; X-braces; `mastTopY` unchanged.
- **Ladder / walkway (+Z):** rails, rungs, `CabWalkway`.
- **Boom:** hollow lattice; `JibTip` open end frame.
- **UI:** steel-neutral Grab; pad `z-index: 30`.
- **Hook blob shadow:** surface-aware Y (ground / pad / crate top).

## Grab aim highlight

- Within `ATTACH_DISTANCE` 1.25 m / `ATTACH_HORIZONTAL_MAX` 1.1 m: emissive + outline.
- Cleared when leaving range or after grab.

## Ambient concrete mixer

- `AmbientMixer1` on gravel path, `startWait: 33`.

## Gentle wind

- Strength 0.15–0.35 (empty-hook accel); direction drifts ~0.06 rad/s.

## Physics (mild)

| Constant | Value |
|----------|-------|
| `SWAY_DAMPING_ZETA` | 0.48 |
| `SWAY_ACCEL_GAIN` | 0.30 |
| `SWAY_LOAD_GAIN` | 0.12 |
| `SWAY_MAX_ANGLE` | 7° |
| `SWAY_WARN_ANGLE` | ~3.2° |
| `SOFT_MAGNET_MAX_NUDGE` | 0.035 m |

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```

Do **not** git push from this agent (parent pushes).
