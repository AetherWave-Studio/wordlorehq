import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Wordlore render pipeline lives outside the Next app and ships its own
    // tsconfig (remotion/tsconfig.json). Skip both subtrees from the Next
    // app's lint pass.
    "remotion/**",
    "scripts/**",
    ".renders/**",
  ]),
]);

export default eslintConfig;
