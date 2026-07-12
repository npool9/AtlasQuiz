/**
 * Builds data/countries.json — the simplified country-shape dataset baked
 * into the app (as the COUNTRIES constant in src/AtlasQuiz.jsx).
 *
 * Pipeline:
 *  1. Start from world-atlas's 50m-resolution country topology.
 *  2. Merge multi-part features that share an ISO numeric id (Natural
 *     Earth sometimes codes overseas territories under the parent
 *     country's id, e.g. French Guiana under France).
 *  3. Keep only sovereign/independent countries (world-countries'
 *     `independent` flag) — drops dependent territories.
 *  4. Drop "exclave" polygons far from a country's main landmass (e.g.
 *     Réunion, French Guiana) so continent maps don't zoom out to fit
 *     a colonial holding on another continent — but keep genuinely
 *     integral, if distant, territory like Alaska/Hawaii for the US.
 *  5. Simplify + round coordinates, but keep tiny nations (Vatican,
 *     Nauru, ...) at full detail so they don't collapse to zero area.
 *
 * Run with: npm run build-data (needs the devDependencies installed).
 */
const topojson = require("topojson-client");
const worldData = require("world-atlas/countries-50m.json");
const wc = require("world-countries/countries.json");
const d3 = require("d3");

const byNum = {};
for (const c of wc) if (c.ccn3) byNum[String(parseInt(c.ccn3, 10))] = c;

function mapContinent(region, subregion) {
  if (region === "Africa") return "Africa";
  if (region === "Oceania") return "Oceania";
  if (region === "Americas") return subregion === "South America" ? "South America" : "North America";
  if (region === "Europe") return "Europe";
  if (region === "Asia") return "Asia";
  return "Other";
}

function polyArea(poly) { return Math.abs(d3.geoArea({ type: "Polygon", coordinates: poly })); }
function polyCentroid(poly) { return d3.geoCentroid({ type: "Polygon", coordinates: poly }); }
function wrapDist(a, b) {
  let dLng = Math.abs(a[0] - b[0]) % 360;
  if (dLng > 180) dLng = 360 - dLng;
  const dLat = a[1] - b[1];
  return Math.hypot(dLng, dLat);
}

// --- Douglas-Peucker on a single ring of [lng,lat] points ---
function perpDist(p, a, b) {
  const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(x - cx, y - cy);
}
function dp(points, epsilon) {
  if (points.length < 3) return points.slice();
  let maxD = -1, idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > epsilon) {
    const left = dp(points.slice(0, idx + 1), epsilon);
    const right = dp(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}
function simplifyRing(ring, epsilon) {
  const simplified = dp(ring, epsilon);
  return simplified.length >= 4 ? simplified : ring;
}
function simplifyPolys(polys, epsilon) {
  return polys.map(poly => poly.map(ring => simplifyRing(ring, epsilon)));
}
function round(coords, depth, dp) {
  const m = Math.pow(10, dp);
  if (depth === 0) return coords.map(n => Math.round(n * m) / m);
  return coords.map(c => round(c, depth - 1, dp));
}
function totalArea(polys) {
  return polys.reduce((s, p) => s + polyArea(p), 0);
}

const EXCLAVE_THRESHOLD_DEG = 65; // drop polygons this far from the country's main landmass
const AREA_THRESHOLD = 0.0006; // steradians; below this, keep full coordinate detail
const EPSILON = 0.08; // degrees, DP simplification tolerance for large countries

const geo = topojson.feature(worldData, worldData.objects.countries);
const mergedById = new Map();
for (const f of geo.features) {
  if (!f.geometry) continue;
  const id = String(parseInt(f.id, 10));
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  if (!mergedById.has(id)) mergedById.set(id, []);
  mergedById.get(id).push(...polys);
}

const features = [];
const droppedLog = [];
for (const [id, rawPolys] of mergedById) {
  const meta = byNum[id];
  if (!meta || !meta.independent) continue;
  const name = meta.name.common;
  const continent = mapContinent(meta.region, meta.subregion);
  if (continent === "Other") continue;

  // Find the largest polygon as the anchor, then keep anything within range.
  let anchor = rawPolys[0], anchorArea = polyArea(rawPolys[0]);
  for (const p of rawPolys) {
    const a = polyArea(p);
    if (a > anchorArea) { anchorArea = a; anchor = p; }
  }
  const anchorCentroid = polyCentroid(anchor);
  const kept = [];
  const dropped = [];
  for (const p of rawPolys) {
    const c = polyCentroid(p);
    if (wrapDist(c, anchorCentroid) <= EXCLAVE_THRESHOLD_DEG) kept.push(p);
    else dropped.push(p);
  }
  if (dropped.length) droppedLog.push(`${name}: dropped ${dropped.length} distant piece(s)`);

  const a = totalArea(kept);
  const processedPolys = a < AREA_THRESHOLD ? kept : simplifyPolys(kept, EPSILON);
  const roundDp = a < AREA_THRESHOLD ? 3 : 2;
  const coords = round(processedPolys, 3, roundDp);

  features.push({ id, name, continent, coordinates: coords });
}

features.sort((a, b) => a.name.localeCompare(b.name));

console.log(droppedLog.join("\n"));
console.log("total:", features.length);

const zero = features.filter(f => Math.abs(d3.geoArea({ type: "MultiPolygon", coordinates: f.coordinates })) === 0);
console.log("zero-area:", zero.length, zero.map(f => f.name));

const dupes = {};
features.forEach(f => (dupes[f.name] = (dupes[f.name] || 0) + 1));
console.log("dupes:", Object.entries(dupes).filter(([, v]) => v > 1));

const fs = require("fs");
const path = require("path");
const out = JSON.stringify(features);
const outPath = path.join(__dirname, "countries.json");
fs.writeFileSync(outPath, out);
console.log("size KB:", (out.length / 1024).toFixed(1));
console.log("Wrote", outPath);
console.log(
  "\nNote: src/AtlasQuiz.jsx has this same data embedded inline (as the\n" +
  "COUNTRIES constant) so the app is a single self-contained bundle.\n" +
  "If you change anything here, splice the new data/countries.json\n" +
  "contents back into that COUNTRIES constant to keep them in sync."
);
