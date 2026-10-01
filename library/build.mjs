// Bundles the library to dist/ (ESM, React external) and a standalone demo.
import { build } from "esbuild";
const common = { bundle: true, jsx: "automatic", loader: { ".png": "dataurl" }, logLevel: "warning", target: "es2020" };
await build({ ...common, entryPoints: ["src/index.ts"], format: "esm", outfile: "dist/index.js",
  external: ["react", "react-dom", "react/jsx-runtime"] });
await build({ ...common, entryPoints: ["demo/demo.tsx"], format: "iife", outfile: "demo/demo.js" });
console.log("built dist/index.js and demo/demo.js");
