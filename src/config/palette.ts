/**
 * Art palette — soft cartoon-real training yard colors.
 * Hex values match Milestone 0 brief.
 */
export const Palette = {
  sky: "#A8D4E8",
  haze: "#E8F4F8",
  dirt: "#C4A574",
  packed: "#A8906A",
  grass: "#7BA05B",
  concrete: "#D4CDBF",
  craneYellow: "#E8B84A",
  steel: "#4A5560",
  glass: "#8EC5D8",
  cones: "#E07A3D",
  shedRoof: "#8B6F4E",
  shedWall: "#E8DFD0",
  crate: "#B8956A",
  barrel: "#5A6B7A",
  markerA: "#4A90C8",
  markerB: "#C87A4A",
  warmSun: "#FFF0D0",
} as const;

export type PaletteKey = keyof typeof Palette;
