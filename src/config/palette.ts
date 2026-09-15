/**
 * Art palette — outdoor jobsite (realistic lean, still readable from high cam).
 * FINAL: crane yellow / steel / glass / dark-steel hexes locked.
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
  /** Oil stain / pad joint dark. */
  oilStain: "#6B5E4E",
  craneYellow: "#E5B03A",
  steel: "#525C66",
  /** Darker steel (connectors, interior, AC). */
  steelDark: "#3A424A",
  glass: "#8EC5D8",
  /** Darker inset cab glass. */
  glassDark: "#4A7A8E",
  cones: "#E07A3D",
  coneStripe: "#F2F0EA",
  shedRoof: "#8B6F4E",
  shedWall: "#E8DFD0",
  shedDoor: "#6B5A48",
  shedWindow: "#6A9BB0",
  fence: "#6E6256",
  crate: "#B8956A",
  crateLabel: "#3A5A78",
  barrel: "#5A6B7A",
  barrelLid: "#4A5560",
  markerA: "#4A90C8",
  markerB: "#C87A4A",
  warmSun: "#FFF0D0",
  // Ambient vehicles
  truckWhite: "#E8E0D4",
  truckBlue: "#7A9BB0",
  truckBox: "#E8DFD0",
  wheel: "#3A3A3A",
  brakeLight: "#A03028",
  // Gravel road (readable from high cam)
  gravel: "#9A8F7A",
  gravelLight: "#B0A48C",
  gravelEdge: "#8A8070",
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
