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

## Milestone 3 — Visual upgrade (Software Graphics P1–P3)

Still Dredge-warmer / friendly; readable from high ~60° camera. Required node names unchanged. Gameplay (controls, grab/place, blob shadows) intact.

### Priority 1 — Crane detail

- **Boom:** thicker outer silhouette + chord rails; **4 X-frame** cross-brace child boxes under `Boom`
- **Cab:** roof overhang box; `CabGlass` inset + darker tint (`glassDark`); side glass hints
- **Cable:** thicker primary cylinder + dual parallel strand children (scale with hoist)
- **Hook:** yellow block + steel cheek plates + sheave (children of `Hook`)
- **Palette:** crane yellow `#E5B03A`, steel `#525C66`

### Priority 2 — Outriggers + tracks

- **OutriggerN/E/S/W:** TransformNodes with beam, outer sleeve, pad + lip children
- **Tracks:** thicker base + left/right shoes + thin **grouser ridge** boxes
- **Counterweight:** stacked plate children; **Turntable** thin yellow/steel collar ring

### Priority 3 — Shed + fence

- **Shed:** door recess + panel, window quads, stronger roof overhang + ridge, porch slab, HVAC box
- **Fence:** chunky post+rail along yard edge (`YardFence`), gate gaps on axes

Skipped this pass: prop density, ground berms, backdrop buildings.

### Files touched

- `src/config/palette.ts` — M3 yellow/steel + shed/fence/glassDark hexes
- `src/scene/materials.ts` — `glassDark`, `shedDoor`, `shedWindow`, `fence`
- `src/crane/placeholderCrane.ts` — P1/P2 mesh detail (required names kept)
- `src/scene/props.ts` — shed upgrade + yard fence
- `STATUS.md`

## Still intact from M2 / M1 / M0

- Required crane mesh/node names
- A/D slew · W/S trolley · R/F hoist · Space grab/release
- Load manager attach/place; Pad A/B win condition
- Blob shadows (`HookGroundShadow` / `LoadGroundShadow`)
- Camera orbit + zoom; career stub HUD

## Caveats

- Still procedural boxes/cylinders — no GLB, no full physics
- Cable strands are children of scaled `Cable` (visual only)
- Placed loads stay put (no stacking physics)
- Git push intentionally out of scope

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```
