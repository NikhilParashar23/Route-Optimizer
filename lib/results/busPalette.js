// One colour per bus, shared by the map lines/markers and the manifest cards
// so a bus always has the same colour everywhere.
export const BUS_COLORS = [
  "#00E5C7", // cyan
  "#FFC93C", // yellow
  "#3B82F6", // blue
  "#B586FF", // purple
  "#FF5470", // red
  "#3ECF8E", // green
  "#F2A65A", // orange
  "#7FA9F5", // periwinkle
];

export function colorForBus(index) {
  return BUS_COLORS[Math.abs(index) % BUS_COLORS.length];
}