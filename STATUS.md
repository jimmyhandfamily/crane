# Crane M3 — Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane` (local Vite free path — no Cursor cloud agent)

## Build

| Check | Result |
|-------|--------|
| `npm install` | ✅ passed (M0) |
| `npm run build` (`tsc && vite build`) | ✅ see verify below |
| Ready for `npm run dev` | ✅ yes |

Packages: `@babylonjs/core@^9.26.1`, `vite@^6.3.5`, `typescript@~5.8.3`

## PHYSICS PASS (this pass)

Kinematic cable/hook pendulum + light boom flex + load mass + load meter HUD.  
Controls (A/D W/S R/F + pad), grab/place, blob shadows, ambient traffic, workers unchanged in behavior — shadows / attach use **actual** swayed hook world position.

### Module
- **`src/crane/cranePhysics.ts`** — spring-damper pendulum (no PhysX)
- Wired via `craneController.sync` → `physics.update` after kinematic `placeHoist`
- Exports: `createCranePhysics`, `setWind`, load-meter helpers, tuning constants

### Pendulum / sway
- Slew, trolley, or hoist velocity changes move the trolley attachment → hook lags and swings
- Settles with damping over ~**1.5–3 s** after motion stops (longer with heavy load)
- Quick moves → visible hang sway; slow careful moves → less sway
- Cable leans from trolley to swayed hook; hook + ring + attached load follow

### Load mass
| Load | Mass |
|------|------|
| Empty hook block | 85 kg (`HOOK_EMPTY_MASS_KG`) |
| Barrel | 260 kg (`BARREL_MASS_KG`) |
| Crate | 480 kg × scale (`CRATE_MASS_KG`) |

Heavier → more sway amplitude, slower settle, slightly slower hoist (`HOIST_LOADED_SPEED_FACTOR` 0.72 at heavy ref).

### Boom tip flex
- Very small spring-damper lag on `BoomRoot` from trolley-local acceleration (≤ ~0.8°)
- Subtle, not rubber

### Wind stub (future weather)
```ts
physics.windForce          // Vector3, default (0,0,0)
physics.setWind(dir, strength)  // stores force; strength ≤ 0 clears
```
Applied as `windForce / mass` in the pendulum integrator. Documented for future weather — no weather sim yet.

### Load meter HUD
- `#hud-load` top-center gauge: **Empty / Light / Heavy** + kg + bar
- Updates on grab/release; no sound (stub comment for future beep)

### Tuning constants (report)
| Constant | Value | Role |
|----------|-------|------|
| `SWAY_DAMPING_ZETA` | **0.20** | Base underdamped zeta (empty); settle ~1.5–2.5 s |
| `SWAY_ACCEL_GAIN` | **0.92** | Support-accel → pendulum coupling |
| `SWAY_LOAD_GAIN` | **0.38** | Extra sway amplitude at heavy load |
| `SWAY_LOAD_DAMP_SOFTEN` | **0.55** | Softens zeta when loaded (longer settle) |
| `SWAY_MAX_ANGLE` | **18°** | Clamp |
| `PHYS_G` | **9.81** | Gravity |
| `BOOM_FLEX_GAIN` | **0.00055** | rad per m/s² |
| `BOOM_FLEX_MAX` | **0.014** rad (~0.8°) | Clamp |
| `BOOM_FLEX_STIFFNESS` / `DAMPING` | **28** / **9** | Tip spring |
| `HOIST_LOADED_SPEED_FACTOR` | **0.72** | Hoist mul at `LOAD_HEAVY_REF_KG` (450) |
| `LOAD_HEAVY_REF_KG` | **450** | Heavy band / hoist ref |

### Files touched
- `src/crane/cranePhysics.ts` (new) · `craneController.ts` · `index.ts`
- `src/loads/types.ts` · `index.ts` · `src/scene/props.ts`
- `src/ui/hud.ts` · `index.ts` · `src/main.ts` · `index.html`
- `STATUS.md`

## Still intact
- Ambient trucks + workers; shed + fence; Pad A/B
- Blob shadows follow actual hook/load
- Camera orbit + zoom; career stub HUD
- Grab attach distance uses swayed `hookRing` world pos

## Future
- Weather / wind driving `setWind`
- Load-meter / strain **sound** (stub only)
- Concrete mixer trucks; GLB art swap

## Caveats
- Procedural meshes; kinematic spring (not full PhysX)
- Git push intentionally out of scope

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```
