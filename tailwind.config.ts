import type { Config } from "tailwindcss";

const role = (name: string) => `rgb(var(--lp-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "480px", md: "768px", lg: "1024px", xl: "1280px", "2xl": "1440px" },
    extend: {
      colors: {
        lp: {
          ground: role("ground"),
          raised: role("raised"),
          line: role("line"),
          text: role("text"),
          "text-2": role("text-2"),
          muted: role("muted"),
          accent: role("accent"),
          "on-accent": role("on-accent"),
          profit: role("profit"),
          loss: role("loss"),
          warning: role("warning"),
          header: role("header"),
        },
      },
      fontFamily: {
        display: ["var(--lp-font-display)", "system-ui", "sans-serif"],
        sans: ["var(--lp-font-text)", "system-ui", "sans-serif"],
        mono: ["var(--lp-font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      // Шкала: [размер, { lineHeight, letterSpacing }]
      fontSize: {
        "lp-hero": ["clamp(40px, 5.3vw, 76px)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "lp-h2": ["clamp(32px, 3.6vw, 52px)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "lp-num": ["clamp(56px, 6.7vw, 96px)", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "lp-h3": ["clamp(20px, 1.7vw, 24px)", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "lp-lead": ["clamp(17px, 1.4vw, 20px)", { lineHeight: "1.5" }],
        "lp-body": ["clamp(16px, 1.2vw, 17px)", { lineHeight: "1.6" }],
        "lp-small": ["14px", { lineHeight: "20px" }],
        "lp-data": ["14px", { lineHeight: "20px" }],
      },
      maxWidth: { container: "1280px", prose: "64ch" },
      borderRadius: { control: "8px", screen: "20px", media: "28px" },
      transitionTimingFunction: { lp: "var(--lp-ease)" },
      spacing: { section: "112px", "section-sm": "72px", header: "var(--lp-header-h)" },
    },
  },
  plugins: [],
};

export default config;
