import { JetBrains_Mono, Wix_Madefor_Display, Wix_Madefor_Text } from "next/font/google";

// Wix Madefor Display (заголовки) + Text (текст) + JetBrains Mono (чек, код).
// next/font требует литералы в параметрах — поэтому subsets повторяются.

const fontDisplay = Wix_Madefor_Display({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700"],
  variable: "--lp-font-display",
  display: "swap",
});

const fontText = Wix_Madefor_Text({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600"],
  variable: "--lp-font-text",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500"],
  variable: "--lp-font-mono",
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontText.variable} ${fontMono.variable}`;
