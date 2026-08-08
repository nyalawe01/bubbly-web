import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  // `dark:` variants follow the APP's dark themes (dark/night) via a .dark class
  // toggled on <html> by ThemeProvider — not the OS preference. This keeps
  // existing dark: utilities in sync with the selected mood theme.
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [typography],
};

export default config;
