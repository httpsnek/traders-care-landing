"use client";

import { Moon, Sun } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useEffect, useState } from "react";
import { switchTheme, type Theme } from "@/lib/theme-transition";

/** Кнопка темы. Сам переход — src/lib/theme-transition.ts. */
export function ThemeToggle({ labels, className = "" }: { labels: { toLight: string; toDark: string }; className?: string }) {
  // null до гидрации: тему уже выставил ThemeScript, узнаём её из атрибута.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    // Две кнопки (шапка и мобильное меню) держим в синхроне.
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    switchTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  };

  const label = theme === "light" ? labels.toDark : labels.toLight;
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label}
      className={`inline-flex size-11 items-center justify-center rounded-control text-lp-text-2 transition-colors duration-200 hover:bg-lp-text/[0.06] hover:text-lp-text ${className}`}>
      <MorphIcon icon={theme === "light" ? Moon : Sun} size={18} strokeWidth={1.75} spring="snappy" reducedMotion="user" />
    </button>
  );
}
