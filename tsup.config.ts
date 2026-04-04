import { defineConfig } from "tsup";
import { copyFileSync } from "fs";

export default defineConfig({
  entry: {
    "bin/index": "src/bin/index.ts",
  },
  format: ["esm"],
  target: "node18",
  shims: true,
  clean: true,
  sourcemap: false,
  dts: false,
  onSuccess: async () => {
    copyFileSync("src/bin/ascii.txt", "dist/bin/ascii.txt");
  },
});
