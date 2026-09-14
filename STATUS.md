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

## Improvements 6–10 (this session)

### 6. Cab camera toggle
- Key **C** switches orbit jobsite cam ↔ cab-ish view near `Cab` node looking along boom (+Z slewing).
- C again restores saved orbit position/target; OrbitControls disabled while in cab.
- HUD hint includes `C cab cam`.

### 7. Gate opens for trucks
- `scene/yardGates.ts`: west entry + north exit gate leaves (fence gap).
- Opens when AmbientTruck/Mixer within ~14 m; closes after ~22 m.
- Driven each frame from `ambientTraffic.getTruckPoses()`.

### 8. Idle excavator
- `AmbientExcavator1` low-poly excavator parked SE yard edge.
- Light idle boom/bucket bob.

### 9. Dust puff on load place
- `scene/dustPuffs.ts`: 3 expanding translucent discs on release (ground/pad).
- Auto-fade ~0.55–0.8 s; wired from load manager.

### 10. Junior rank
- After Lesson 2: title → **Junior Operator**, rank → `Junior` (persisted in `crane.career.v1`).
- Migrates prior “Training Yard — Graduated” saves.
- HUD title + role update on win and on load.

## Improvements 1–5 (prior)

### 1. localStorage persist
- Key `crane.career.v1`: day rate, jobsCompleted, title, lesson1/2 flags, padA/padB placed.
- Restored on load; HUD title, pay tease, and objective sync from career state.

### 2. Lesson 2
- Lesson 1: place a crate on **Pad A** → pay bump + title → “Training Yard — Lesson 2”.
- Lesson 2: both Pad A and Pad B → Junior Operator + second pay bump.

### 3. Swing warning
- `getSwayAngle()`; threshold `SWAY_WARN_ANGLE` ≈ 3.2°.
- Loaded + high sway → load meter `data-band="swing"`, **“Swing high”**.

### 4. Soft magnet snap
- Gentle world-XZ nudge via `physics.applySoftMagnet` when nearly aligned.

### 5. Sky
- Canvas vertical gradient + 3 soft cloud planes; fog haze preserved.

## Structure pass (prior)

- **Mast:** open 2.2×2.2 m square lattice; yellow chords; X-braces; `mastTopY` unchanged.
- **Ladder / walkway (+Z):** rails, rungs, `CabWalkway`.
- **Boom:** hollow lattice; `JibTip` open end frame.
- **UI:** steel-neutral Grab; pad `z-index: 30`.
- **Hook blob shadow:** surface-aware Y (ground / pad / crate top).

## Grab aim highlight

- Within `ATTACH_DISTANCE` 1.25 m / `ATTACH_HORIZONTAL_MAX` 1.1 m: emissive + outline.

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
