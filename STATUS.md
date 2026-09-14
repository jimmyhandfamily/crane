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

## REALISM REFINE (this pass)

Visual-only Software Graphics pass. Feature freeze otherwise — controls, loads, hook/load blobShadows, ambient trucks unchanged.

### 1. Workers (priority)
- Replaced peg bodies in `yardDressing.ts` with articulated hierarchy: `WorkerRoot → Hips → Torso/Head/Hat`; `Hips → LegL/R`; `Torso → ArmL/R`
- Part sizes: pelvis 0.42×0.28×0.28, torso 0.48×0.55×0.28, head Ø0.28, hardhat dome+brim, arms/legs/boots; height ~1.75–1.85 m
- Walk: `phase=time*7`; thighs ±sin·0.45; shins `max(0,-sin)·0.35`; arms opposite; bob `abs(sin(phase*2))*0.04`
- Worker blob shadow discs Ø0.9–1.1 under feet
- Variants A/B/C: coveralls `#4A6B8A`/`#6B7A5A`, hat `#E5B03A`/`#E07A3D`, vest `#E8B84A`, skin `#C4A882`, boots `#3A3530`

### 2. Ground
- Crane pad + Pad A/B stay flat (hook shadows); pad lip frames added
- Gravel road raised to y≈0.05–0.06; berms varied 0.4–1.2 m (outside ~25 m of CraneRoot)
- Mottled dirt tint quads; darker fence grass `#6A8F4E`
- Tire track strips on gravel `#7A7160`

### 3. Materials / lights
- Emissive clamped 0–0.015; specular via white scale (dirt 0.02–0.04, concrete `#C8C2B4` @0.18, steel 0.5, yellow 0.3, painted 0.12–0.2)
- `ambientColor ≈ diffuse*0.55` on shared mats
- Hemi 0.7, sun 1.05, sun dir `(-0.55,-0.75,-0.35)`

### Files touched
- `src/config/palette.ts`
- `src/scene/materials.ts` · `lights.ts` · `ground.ts` · `yardDressing.ts` · `ambientTraffic.ts` · `props.ts`
- `STATUS.md`

## Still intact from ambient / M3 / M2 / M1 / M0

- Ambient trucks + gravel driveway path loops + parked van
- Crane M3 detail; shed + fence; A/D slew · W/S trolley · R/F hoist · Space grab/release
- Load manager; Pad A/B; blob shadows (hook/load)
- Camera orbit + zoom; career stub HUD

## Future
- **Concrete mixer trucks** (not this pass)
- GLB art swap for named AmbientTruck* / AmbientWorker* meshes
- Prop density / backdrop buildings

## Caveats

- Still procedural boxes/cylinders — no GLB, no full physics
- Ambient actors are kinematic only
- Git push intentionally out of scope

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```
