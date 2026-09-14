/**
 * Art palette — soft cartoon-real training yard colors (Dredge-warmer / friendly).
 * M3 tweak: crane yellow + steel for thicker readable silhouette from high camera.
 */
export const Palette = {
  sky: "#A8D4E8",
  haze: "#E8F4F8",
  dirt: "#C4A574",
  packed: "#A8906A",
  grass: "#7BA05B",
  concrete: "#D4CDBF",
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
} as const;

export type PaletteKey = keyof typeof Palette;
