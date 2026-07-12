// Local dev server: rebuilds src/entry.jsx on every request and serves
// the public/ folder. Run `npm run dev`, then open the printed URL.
const esbuild = require("esbuild");
const path = require("path");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: [path.join(__dirname, "..", "src", "entry.jsx")],
    bundle: true,
    outfile: path.join(__dirname, "..", "public", "app.bundle.js"),
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    sourcemap: "inline",
    target: ["es2020"],
    define: { "process.env.NODE_ENV": '"development"' },
  });

  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: path.join(__dirname, "..", "public"),
    port: 8080,
  });

  console.log(`Dev server running at http://localhost:${port}`);
  console.log("Edit src/AtlasQuiz.jsx — the bundle rebuilds automatically on refresh.");
}

main();
