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

## Ambient liveliness (this pass)

Other equipment working; trucks randomly coming and going. **Concrete mixer trucks = future — NOT this pass.**

### Gravel driveway
- Warm gray-tan gravel strip (`#9A8F7A` + lighter center `#B0A48C`) through **west gate → west edge → shed spur → north exit**
- Readable from high cam; named `GravelDriveway` / segment meshes

### Ambient trucks (kinematic)
| Mesh | Type | Look |
|------|------|------|
| `AmbientTruck1` | Pickup ~5.5×2×1.9 | White `#E8E0D4` cab + steel bed |
| `AmbientTruck2` | Flatbed ~7×2.4×2.2 | Blue `#7A9BB0` cab + steel deck |
| `AmbientTruck3` | Box truck ~8×2.5×3.2 | Yellow cab + cream box |
| `AmbientVanParked` | Idle van | Blue, parked near shed |

**Path behavior:** Drive in west gate → along west fence (clear of Pad A/B) → brief pause near shed (~2.5–4.5s) → continue out north gate → wait offsite 8–18s (staggered) → loop. Chunky wheels; no physics.

### Dirt berms
- `DirtBerm1`–`DirtBerm5` chunky mounds (`#A8906A` / `#8B7355`) at fence corners / edges

### Workers (kinematic)
- `AmbientWorker1`–`AmbientWorker4`: box people, hardhats (`#E5B03A` / `#E07A3D`), coveralls (`#4A6B8A` / `#6B7A5A`), optional vest `#E8B84A`
- Walk loops near shed, north fence, Pad A edge, east/Pad B edge — clear of crane center

### Files touched
- `src/config/palette.ts` — gravel / berm / vehicle / worker hexes
- `src/scene/materials.ts` — matching mats
- `src/scene/ambientTraffic.ts` — gravel road + trucks + parked van
- `src/scene/yardDressing.ts` — berms + workers
- `src/scene/createScene.ts` / `main.ts` / `scene/index.ts`
- `STATUS.md`

## Still intact from M3 / M2 / M1 / M0

- Crane M3 detail (boom X-frames, cab glass, cable, hook, outriggers, tracks)
- Shed + yard fence
- A/D slew · W/S trolley · R/F hoist · Space grab/release
- Load manager; Pad A/B; blob shadows
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
