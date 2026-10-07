"use client";

import { useEffect } from "react";

/** Держит <html lang> в соответствии с языком страницы при навигации без перезагрузки. */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return null;
}
