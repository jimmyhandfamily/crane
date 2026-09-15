# Crane — Three.js Port Status

**Date:** 2026-09-15  
**Path:** `/workspace/crane`

## Build

| Check | Result |
|-------|--------|
| Engine | **Three.js** + Vite + TypeScript |
| `@babylonjs/*` | Removed |
| `npm run build` | **Passes** |

Packages: `three@^0.186`, `@types/three`, `vite@^6.3.5`, `typescript@~5.8.3`

## Art pivot → realistic outdoor jobsite (CRITICAL PASS)

Pivot away from flat plate / blocky toy look. **CC0 only** this pass — Poly Haven tree GLBs too heavy (~100MB tex); Kenney zips unavailable. High-detail procedural + canvas PBR used instead.

### A. Cable ghost FIXED
- Root cause: `CableFall2` / `CableFall3` were **siblings** of `Cable`; `applyVisuals` swayed only main Cable → vertical ghost falls on swing.
- Fix: falls + strands are **children of `Cable`** so scale/quaternion inherit each frame; `placeHoist` no longer repositions sibling falls.

### B. Realism
1. **Terrain:** Rolling heightfield (`GroundDirtHF`, 96×96 segs) with flat zones for crane pad, gravel roads, aprons, pads.
2. **Trees:** Perimeter clusters (`PerimeterTrees`) — tapered trunks + layered cone foliage; kill empty void.
3. **Crane:** Slightly thicker lattice chords/braces, denser boom frames (10); steel/yellow **higher metalness** PBR.
4. **Vehicles:** Rounded cabs (roof/nose/hood), wheel hubs + fenders, tapered mixer drum + fins; site speeds unchanged.
5. **Ground mats:** Procedural canvas albedo + roughness maps on dirt/grass/gravel/packed (`MeshStandardMaterial`).
6. **Lighting:** Hemisphere + directional; **PCF soft shadow maps** (2048) on key meshes.
7. **Sky:** Deeper zenith→haze gradient + extra cloud plane.

Gameplay unchanged: controls, physics, loads, road loop, HUD slim.

## Prior session notes

Cab cam (C), gate opens, idle excavator, dust puffs, Junior rank, career persist, Lesson 2, swing warn, soft magnet, mild sway physics — unchanged.

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```

Do **not** git push from this agent (parent pushes).
