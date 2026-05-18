import esbuild from "esbuild";
import {copyFile, mkdir} from "node:fs/promises";

const prod = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const watch = process.argv.includes("--watch");

const context = await esbuild.context({
  entryPoints: ["src/publish.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2022",
  mainFields: ["browser", "module", "main"],
  external: ["obsidian", "electron"],
  outfile: "dist/main.js",
  sourcemap: prod ? false : "inline",
  minify: prod,
  logLevel: "info",
});

await mkdir("dist", {recursive: true});
await copyFile("manifest.json", "dist/manifest.json");

if (watch) {
  await context.watch();
} else {
  await context.rebuild();
  await context.dispose();
}
