"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ComponentProps } from "react";
import { localePath, type Locale } from "@/i18n/config";
import { localeReady, switchLocale } from "@/lib/locale-transition";

/** Ссылка на другой язык: без перезагрузки, с сохранением прокрутки и плавным переходом.
 *  Без JS — обычная ссылка. onPick — например, закрыть меню. */
export function LocaleLink({ to, current, onPick, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { to: Locale; current: Locale; onPick?: () => void }) {
  const router = useRouter();
  // Новая страница смонтирована — можно делать снимок для перехода.
  useEffect(() => { requestAnimationFrame(localeReady); }, [current]);
  return (
    <Link {...rest} href={localePath(to)} hrefLang={to} scroll={false} aria-current={to === current ? "true" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onPick?.();
        if (to !== current) switchLocale(localePath(to), (href) => router.push(href, { scroll: false }));
      }} />
  );
}
