/**
 * Art palette — soft cartoon-real training yard colors (Dredge-warmer / friendly).
 * M3 tweak: crane yellow + steel for thicker readable silhouette from high camera.
 * Ambient liveliness: vehicles, gravel roads, berms, workers.
 * REALISM REFINE: concrete / grass-dark / tire-track / boots / skin hexes.
 */
export const Palette = {
  sky: "#A8D4E8",
  haze: "#E8F4F8",
  dirt: "#C4A574",
  dirtMottle: "#B89560",
  dirtMottle2: "#D0B07E",
  packed: "#A8906A",
  grass: "#7BA05B",
  /** Darker grass strip at fence line. */
  grassDark: "#6A8F4E",
  concrete: "#C8C2B4",
  craneYellow: "#E5B03A",
  steel: "#525C66",
  glass: "#8EC5D8",
  /** Darker inset cab glass (M3). */
  glassDark: "#4A7A8E",
  cones: "#E07A3D",
  shedRoof: "#8B6F4E",
  shedWall: "#E8DFD0",
  shedDoor: "#6B5A48",
  shedWindow: "#6A9BB0",
  fence: "#6E6256",
  crate: "#B8956A",
  barrel: "#5A6B7A",
  markerA: "#4A90C8",
  markerB: "#C87A4A",
  warmSun: "#FFF0D0",
  // Ambient vehicles
  truckWhite: "#E8E0D4",
  truckBlue: "#7A9BB0",
  truckBox: "#E8DFD0",
  wheel: "#3A3A3A",
  // Gravel road (readable from high cam)
  gravel: "#9A8F7A",
  gravelLight: "#B0A48C",
  /** Tire track strips on gravel. */
  tireTrack: "#7A7160",
  // Dirt piles / berms
  berm: "#A8906A",
  bermDark: "#8B7355",
  // Workers (variants A/B/C)
  coverallsBlue: "#4A6B8A",
  coverallsGreen: "#6B7A5A",
  hardhatOrange: "#E07A3D",
  hardhatYellow: "#E5B03A",
  vest: "#E8B84A",
  skin: "#C4A882",
  boots: "#3A3530",
} as const;

export type PaletteKey = keyof typeof Palette;
