// maplibre-gl 6 ships its web worker as a separate file and cannot locate it
// under Next.js. Copy it into /public so the map can load it from "/".
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const destDir = path.join(__dirname, "..", "public");
const dest = path.join(destDir, "maplibre-gl-worker.js");

if (!fs.existsSync(src)) {
  console.warn("[maplibre] worker not found - run `npm install maplibre-gl` first.");
  process.exit(0);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("[maplibre] copied worker -> public/maplibre-gl-worker.js");