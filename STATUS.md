# Crane — Three.js Port Status

**Date:** 2026-09-14  
**Path:** `/workspace/crane`

## Build

| Check | Result |
|-------|--------|
| Engine | **Three.js** + Vite + TypeScript |
| `@babylonjs/*` | Removed |
| `npm run build` | Must pass |

Packages: `three@^0.186`, `@types/three`, `vite@^6.3.5`, `typescript@~5.8.3`

## Structure pass (this session)

- **Mast:** solid `MastSection_*` boxes removed → open 2.2×2.2 m square lattice (chords at ±1.1), 4 yellow `#E5B03A` corner chords 0.18×0.18 × full height, ~12×3.0 m bays, per-face X-braces + horizontal rings 0.10 steel `#525C66`. `mastTopY` kept so Turntable/Cab/~40 m heights still work. Names: `CraneRoot`, required nodes intact.
- **Ladder / walkway (+Z):** rails 0.06×0.06, rungs every 0.45 m (`MastLadder`, `MastLadderRung_*`), `CabWalkway` landing under cab.
- **Boom:** hollow group (not solid box); chords 0.12 at ±0.45 (0.9×0.9); 7 X-frames + side diagonals; `JibTip` open 0.9 end frame (not solid cube).
- **UI:** removed stray blue grab-bar look overlapping the pad (steel-neutral Grab); pad `z-index: 30`; mobile pad flush to bottom (no sky-blue body strip).
- **Hook blob shadow:** Y sits on highest surface under hook (ground / pad top / unattached load top) so the disc lands on crate tops and pads for clear aim — not always flat ground.

## Port notes

- Scene graph: `Object3D` / `Mesh` instead of Babylon TransformNode/Mesh
- Camera: `OrbitControls` (polar ≈ ArcRotate beta), pan disabled, zoom clamps
- Materials: `MeshStandardMaterial` (soft cartoon-real)
- Fog: `FogExp2`; lights: Hemisphere + Ambient + Directional
- Blob shadows: canvas radial texture on discs (no shadow maps); surface-aware Y
- Same folder layout as Babylon M3; git history kept

## Physics (milder than Babylon M3 — Jimmy feedback)

Real crane cable feel, not playground swing:

| Constant | Value | Role |
|----------|-------|------|
| `SWAY_DAMPING_ZETA` | **0.48** | Faster settle |
| `SWAY_ACCEL_GAIN` | **0.30** | Mild coupling |
| `SWAY_LOAD_GAIN` | **0.12** | Modest loaded extra sway |
| `SWAY_LOAD_DAMP_SOFTEN` | **0.25** | Slight settle lengthening |
| `SWAY_MAX_ANGLE` | **7°** | Clamp |
| `BOOM_FLEX_GAIN` | **0.00012** | Nearly invisible |
| `BOOM_FLEX_MAX` | **0.004** rad (~0.23°) | Clamp |
| `HOIST_LOADED_SPEED_FACTOR` | **0.72** | Unchanged |

## HUD (Jimmy feedback)

- Objective moved **top-left under rank** — not center of view
- Panels smaller / lower opacity; work area clear
- Control pad stays bottom-right; load meter slim top-center
- Grab button steel-neutral (no blue rectangle over pad)

## Babylon features dropped / changed

- `@babylonjs/core` Engine / Scene / ArcRotateCamera / StandardMaterial / MeshBuilder
- Babylon shadow-generator never used (blob discs kept)
- PhysX never used (kinematic spring kept)
- `DynamicTexture` → canvas `CanvasTexture`
- Mesh `parent` setter → `add` / `remove` + reparent to props root
- Career progression still stub only

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```

Do **not** git push from this agent (parent pushes).
