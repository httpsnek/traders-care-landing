import type { Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeScript } from "@/components/site/theme-script";
import { fontVariables } from "@/lib/fonts";

// Общий корневой layout: <html> один на все языки. Если держать его в [locale]/layout, Next.js считает
// каждый язык отдельным корневым layout и при смене языка перезагружает страницу целиком.
// lang выставляет [locale]/layout (скрипт до отрисовки + синхронизация при навигации).
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0D" },
    { media: "(prefers-color-scheme: light)", color: "#EEF0F3" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
