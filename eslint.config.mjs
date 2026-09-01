import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ["node_modules/", ".next/", "apps/mobile/**", "public/sw.js", "next-env.d.ts"],
  },
]);