// eslint.config.mjs
//
// Flat config (ESLint 9). eslint-config-next still ships legacy "extends"
// config objects (see node_modules/eslint-config-next/{index,typescript}.js),
// so they're bridged into flat-config arrays via @eslint/eslintrc's FlatCompat
// rather than being spread raw (which silently produces an invalid config).
// This replaces the previous setup that imported `defineConfig` from
// "eslint/config" — an ESLint 9 API that ESLint 8.56 (the old pinned version)
// couldn't load, which is why `npm run lint` was dead.
//
// Deliberate scoping decisions:
//   - mobile/ and extension/ are separate projects with their own tooling
//     (Expo/WXT); the web lint should not police them.
//   - @typescript-eslint/no-explicit-any is downgraded to a warning: this
//     codebase was never linted before the flat-config fix, and `any` is used
//     intentionally for untyped AI payloads / Supabase row shapes (see
//     lib/ai/cache.ts). Warnings keep it visible without failing builds.
//   - react/no-unescaped-entities is a warning for the same reason (JSX text
//     uses apostrophes throughout; not a correctness issue).
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "mobile/**",
      "extension/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
