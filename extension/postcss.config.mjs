// Tailwind v4 (independent of the root web app's v3 setup — fully isolated,
// own node_modules, own config). Previously empty on purpose to stop PostCSS
// from silently inheriting the root repo's tailwind.config.ts; now genuinely
// used for composer visual parity with web's ChatInput.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
