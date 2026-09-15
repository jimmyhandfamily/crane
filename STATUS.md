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

## FINAL realism pass (tonight)

### Crane (less toy-like from high cam)
- Kept open lattice mast / ladder / hollow boom; thinner braces (0.08 / 0.07)
- **Sheaves:** jib-tip pulley + dual trolley sheaves + hook sheave
- **Multi-part cable:** `Cable` + `CableFall2`/`CableFall3` (scaled together in `placeHoist`)
- **Trolley wheels** on boom chords
- **Cab:** window frames, door+handle, roof AC, seat/console interior, rails
- **Lattice counter-jib** + stacked counterweight plates/straps/label
- **Mast→collar tie-ins** (yellow stubs + dark gussets)
- Hex lock: `#E5B03A` / `#525C66` / `#4A7A8E` / `#3A424A` (`steelDark`)
- Required node names + controls/physics unchanged

### Roads (FIRST PRIORITY — coherent site loop)
- Continuous gravel: **W gate apron (10×8) → west lane (x=-42) → NW corner → N connector (z=42) → N gate apron (8×10)**
- **Shed spur** (~5.5 m) off west lane at z=28; parked van on spur only
- Movers follow **loop path only** (no spur, no pad cut-through)
- Lane ~6.5 m, center strip, shoulders, tire tracks, slight raise
- No orphan strips; grass corridors cleared off road path
- Berm strips along west/north outer shoulders

### Trucks (logic + speed)
- Max speeds **4.5–7 m/s** (site pace); shed zone ~45% of max
- Accel ~2.2 / decel ~3.6 m/s²; yaw lerp toward path
- **Pause at west/north gates until open ≥0.72** (`yardGates.getOpenAmounts()`)
- Shed pause ~2–4 s; staggered start waits (1.5 / 18 / 36 / 55 s)
- Optional **brake lights** (per-truck cloned mats, light on decel/stop)
- Main loop: gates update from poses → traffic honors open amounts

### Ground / props
- Crane pad **joints + oil stains**; extra dirt mottles (road-clear)
- Shed: corner trim, door handle, foundation skirt
- Crates: top rim + label block; barrels: lid + hoops + label; cones: stripe + base
- Fence **caps**; pipe stacks + pallets; pad surface joints
- Workers: feet on ground (`baseHipY` 0.98, milder bob); paths off N road

### HUD
- Kept slim (no center blocking card)

## Prior session notes

Cab cam (C), gate opens, idle excavator, dust puffs, Junior rank, career persist, Lesson 2, swing warn, soft magnet, sky, mild sway physics — unchanged.

## Verify

```bash
cd /workspace/crane && npm run build
npm run dev
```

Do **not** git push from this agent (parent pushes).
