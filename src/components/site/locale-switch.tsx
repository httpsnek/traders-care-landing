"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { localeLabel, locales, type Locale } from "@/i18n/config";
import { LocaleLink } from "./locale-link";

/** Выпадающий выбор языка на <details>: работает без JS; с JS — смена языка без перезагрузки,
 *  с сохранением прокрутки и плавным переходом (src/lib/locale-transition.ts). */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", close); };
  }, []);

  return (
    <details ref={ref} className="group relative">
      <summary aria-label={label}
        className="flex h-11 cursor-pointer list-none items-center gap-1 rounded-control px-3 text-[14px] font-medium text-lp-text-2 transition-colors hover:bg-lp-text/[0.06] hover:text-lp-text [&::-webkit-details-marker]:hidden">
        {localeLabel[locale]}
        <ChevronDown size={14} strokeWidth={1.75} className="transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="absolute right-0 top-full z-10 mt-1 min-w-[96px] rounded-control border border-lp-line bg-lp-raised p-1 shadow-[0_12px_32px_rgb(0_0_0/0.35)]">
        {locales.map((l) => (
          <li key={l}>
            <LocaleLink to={l} current={locale} onPick={() => { if (ref.current) ref.current.open = false; }}
              className="block rounded-[6px] px-3 py-2 text-[14px] text-lp-text-2 hover:bg-lp-text/[0.06] hover:text-lp-text aria-[current=true]:text-lp-text">
              {localeLabel[l]}
            </LocaleLink>
          </li>
        ))}
      </ul>
    </details>
  );
}
