// Bundles src/entry.jsx (React + ReactDOM + D3 + app code + country data)
// into a single minified file at public/app.bundle.js, ready to serve
// alongside the rest of public/ as a static site / PWA.
const esbuild = require("esbuild");
const path = require("path");

esbuild.buildSync({
  entryPoints: [path.join(__dirname, "..", "src", "entry.jsx")],
  bundle: true,
  outfile: path.join(__dirname, "..", "public", "app.bundle.js"),
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
});

console.log("Built public/app.bundle.js");
console.log("Serve the public/ folder as-is (e.g. `npx serve public`) or deploy it directly.");
