import commonjs from "@rollup/plugin-commonjs";
import { builtinModules } from "module";
import { rmSync } from "node:fs";
import path from "node:path";
import modify from "rollup-plugin-modify";
import { defineConfig } from "vite";

rmSync("dist", { recursive: true, force: true });
rmSync("release", { recursive: true, force: true });

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: true,
    reportCompressedSize: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.ts"),
      fileName: "main",
      name: "PaperlibEntryScrapeExtension",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: [...builtinModules],
      output: {
        format: "cjs",
      },
    },
    outDir: "dist",
  },

  esbuild: {
    keepNames: true,
  },

  resolve: {
    alias: {
      "@": path.join(__dirname, "src") + "/",
    },
  },

  plugins: [
    commonjs(),
    modify({
      find: /import\s*{\s*[\s\S]*}\s*from\s*"paperlib-api";?/,
      // find: /import { PLAPI } from "paperlib";/,
      replace: (match, path) => {
        const m = match
          .replace(/PLAPI\s*,?\s*/g, "")
          .replace(/PLExtAPI\s*,?\s*/g, "")
          .replace(/PLMainAPI\s*,?\s*/g, "");
        return m;
      },
    }),
  ],
});
