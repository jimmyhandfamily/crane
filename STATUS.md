# Crane M2 — Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane` (local Vite free path — no Cursor cloud agent)

## Build

| Check | Result |
|-------|--------|
| `npm install` | ✅ passed (M0) |
| `npm run build` (`tsc && vite build`) | ✅ see verify below |
| Ready for `npm run dev` | ✅ yes |

Packages: `@babylonjs/core@^9.26.1`, `vite@^6.3.5`, `typescript@~5.8.3`

## Milestone 2 — Pick up & place loads

Kinematic attach (no physics engine). Builds on M1 slew / trolley / hoist.

### Gameplay

- **Pickable loads:** Crate1–4 + Barrel1 in the training yard.
- **Grab:** when the hook ring is within **~1.25 m** of a free load’s top and roughly above it (horizontal ≤ **1.1 m**), press **Space** or the on-screen **Grab** button to attach.
- **Carry:** load is parented under `Hook` and follows slew / trolley / hoist.
- **Release:** Space / Grab again detaches. If the load is over/near a concrete pad (Pad A/B or Pad 3, with **0.75 m** margin), it counts as placed.
- **M2 win:** place at least **one crate** onto a **marked** pad (Pad A or Pad B). HUD objective updates through the flow.

### Controls (M1 + M2)

| Action | Keys | Pad button |
|--------|------|------------|
| Slew left / right | **A** / **D** | Left / Right |
| Trolley in / out | **S** / **W** | In / Out |
| Lower / raise Hook | **F** / **R** | Lower / Raise |
| Grab / Release load | **Space** | **Grab** / **Release** |

- Hold to move (keyboard + pointer hold on pad).
- Mouse orbit + scroll zoom unchanged.
- Grab is edge-triggered (does not steal camera left-drag).

### Attach parameters

| Parameter | Value |
|-----------|-------|
| `ATTACH_DISTANCE` | **1.25 m** (hook ring → load top) |
| `ATTACH_HORIZONTAL_MAX` | **1.1 m** |
| `PAD_PLACE_MARGIN` | **0.75 m** beyond pad half-extent |

### Files added / touched

- `src/loads/types.ts`, `src/loads/loadManager.ts`, `src/loads/index.ts` — load/pad model + grab/place
- `src/scene/props.ts` — returns pickable `loads` + `pads` (Pad A/B marked)
- `src/crane/controls.ts` — Space + `#btn-grab` edge trigger
- `src/scene/createScene.ts`, `src/main.ts`, `src/crane/index.ts`
- `index.html` — Grab/Release button + HUD copy
- `STATUS.md`

### Still intact from M1 / M0

- Required crane mesh names
- Graphics palette / soft yard look
- Camera orbit + zoom; A/D W/S R/F + hold pad
- Career stub HUD

## Caveats

- Still procedural boxes/cylinders — no GLB, no full physics
- Cable is a scaled cylinder (visual only)
- Placed loads stay put (no stacking physics)
- Git push intentionally out of scope (parent handles git)

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```
