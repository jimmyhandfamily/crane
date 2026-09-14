# Crane M1 — Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane` (local Vite free path — no Cursor cloud agent)

## Build

| Check | Result |
|-------|--------|
| `npm install` | ✅ passed (M0) |
| `npm run build` (`tsc && vite build`) | ✅ see verify below |
| Ready for `npm run dev` | ✅ yes |

Packages: `@babylonjs/core@^9.26.1`, `vite@^6.3.5`, `typescript@~5.8.3`

## Milestone 1 — Kinematic crane controls

No physics, no loads. Keys + on-screen hold pad drive the placeholder crane.

### Controls wired

| Action | Keys | Pad button |
|--------|------|------------|
| Slew left / right (Turntable yaw) | **A** / **D** | Left / Right |
| Trolley in / out along Boom | **S** / **W** | In / Out |
| Lower / raise Hook (cable length) | **F** / **R** | Lower / Raise |

- Hold to move (keyboard + pointer hold on pad).
- Mouse orbit + scroll zoom unchanged (pad does not steal left-drag from the camera).
- Career stub / Apprentice HUD retained; objective + hint text updated for M1.

### Animation / hierarchy

- Required mesh names preserved: `CraneRoot`, `Tracks`, `Turntable`, `Counterweight`, `Cab`, `CabGlass`, `BoomRoot`, `Boom`, `JibTip`, `Cable`, `Hook`, `OutriggerN/E/S/W`.
- **Slew:** rotates `SlewingAssembly` + `Turntable` yaw (cab, boom, counterweight follow).
- **Trolley:** `Trolley` node on `BoomRoot` moves along local +Z; `Cable` + `Hook` (+ ring) parented to trolley so they follow.
- **Hoist:** scales/positions `Cable` between boom attachment and `Hook`.

### Clamps chosen

| Axis | Limits |
|------|--------|
| Slew | Free continuous yaw (soft wrap only for numeric hygiene) |
| Trolley Z | **6 m … 36.5 m** along boom (`TROLLEY_Z_MIN` … `TROLLEY_Z_MAX`) |
| Cable length | **2 m min**; max = min(38 m, boomWorldY − ground clearance) so hook/ring cannot go through ground (~0.6 m clearance) or above boom |

Speeds (approx.): slew **0.55 rad/s**, trolley **8 m/s**, hoist **6 m/s**.

### Files added / touched

- `src/crane/craneController.ts` — kinematic state + clamps
- `src/crane/controls.ts` — keyboard + pad input
- `src/crane/placeholderCrane.ts` — trolley hierarchy + `CraneParts` return
- `src/crane/index.ts`, `src/scene/createScene.ts`, `src/main.ts`, `index.html`, `STATUS.md`

## What still works (from M0)

- Training yard ~100×100 m, placeholder tower crane ~40 m
- ArcRotateCamera orbit + zoom, pan disabled, beta/radius clamps
- Art palette, soft lighting, props, career stub HUD

## Caveats

- Still procedural boxes/cylinders — no GLB, no physics, no loads
- Cable is a scaled cylinder (visual only), not a rope sim
- Production Babylon chunk size warning unchanged
- Git push intentionally out of scope (parent handles git)

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```
