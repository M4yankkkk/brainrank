import type { Config } from "tailwindcss";

// Colors/radii/fonts are CSS custom properties from @brainrank/tokens (see
// app/globals.css's `@import "@brainrank/tokens/tokens.css"`), so light/dark
// and per-puzzle theming both work by swapping [data-theme]/[data-puzzle] on
// an ancestor element rather than by picking different Tailwind classes.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        tray: "var(--tray)",
        card: "var(--card)",
        ink: "var(--ink)",
        "ink-2": "var(--ink2)",
        line: "var(--line)",
        edge: "var(--edge)",
        violet: { DEFAULT: "var(--violet)", deep: "var(--violet-deep)", soft: "var(--violet-soft)" },
        orange: { DEFAULT: "var(--orange)", deep: "var(--orange-deep)", soft: "var(--orange-soft)" },
        teal: { DEFAULT: "var(--teal)", deep: "var(--teal-deep)", soft: "var(--teal-soft)" },
        sun: "var(--sun)",
        good: "var(--good)",
        accent: { DEFAULT: "var(--c)", deep: "var(--cd)", soft: "var(--cs)" }
      },
      fontFamily: {
        display: "var(--font-display)",
        ui: "var(--font-ui)"
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)"
      },
      boxShadow: {
        "card-rest": "0 5px 0 var(--edge)",
        "card-pressed": "0 1px 0 var(--edge)",
        play: "0 3px 0 var(--cd)",
        streak: "0 2px 0 var(--edge)"
      }
    }
  },
  plugins: []
};

export default config;
