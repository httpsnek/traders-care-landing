"use client";

import { Menu, X } from "lucide";
import { MorphIcon } from "morphicons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { APP_URL, localeLabel, localePath, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { LocaleSwitch } from "./locale-switch";
import { LocaleLink } from "./locale-link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type Props = { locale: Locale; t: Dictionary["header"] };

export function Header({ locale, t }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Меню: блокируем прокрутку, Esc закрывает, фокус держится внутри.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
      if (e.key !== "Tab" || !menuRef.current) return;
      const items = [toggleRef.current, ...menuRef.current.querySelectorAll<HTMLElement>("a,button")].filter(Boolean) as HTMLElement[];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault(); items[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const solid = scrolled || open;
  const signUp = `${APP_URL}/register`;
  const signIn = `${APP_URL}/login`;

  // Меню — соседний с <header> элемент: backdrop-filter шапки сделал бы её контейнером
  // для position:fixed, и меню сжалось бы до её высоты.
  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,border-color,height] duration-300 ease-lp ${
        solid ? "border-b border-lp-line bg-lp-header/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <Container className={`flex items-center justify-between gap-6 transition-[height] duration-300 ease-lp ${scrolled ? "h-[56px] md:h-[60px]" : "h-header"}`}>
        <Link href={localePath(locale)} aria-label={t.home} className="rounded-control" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {t.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="rounded-control px-3 py-2 text-[15px] text-lp-text-2 transition-colors duration-200 hover:text-lp-text">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <LocaleSwitch locale={locale} label={t.language} />
          <ThemeToggle labels={{ toLight: t.themeToLight, toDark: t.themeToDark }} />
          <a href={signIn} className="rounded-control px-3 py-2 text-[15px] font-medium text-lp-text-2 transition-colors hover:text-lp-text">
            {t.signIn}
          </a>
          <ButtonLink href={signUp} className="ml-2">{t.start}</ButtonLink>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ButtonLink href={signUp} className="h-9 px-3 text-[14px]">{t.startShort}</ButtonLink>
          <button ref={toggleRef} type="button" onClick={() => setOpen((o) => !o)}
            aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.menuClose : t.menuOpen}
            className="inline-flex size-11 items-center justify-center rounded-control text-lp-text">
            <MorphIcon icon={open ? X : Menu} size={22} strokeWidth={1.75} spring="snappy" reducedMotion="user" />
          </button>
        </div>
      </Container>
    </header>

      <div id="mobile-menu" ref={menuRef} hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[calc(56px+env(safe-area-inset-top))] z-40 overflow-y-auto bg-lp-ground lg:hidden">
        <Container className="flex min-h-full flex-col pb-[calc(24px+env(safe-area-inset-bottom))] pt-6">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {t.nav.map((item) => (
                <li key={item.href} className="border-b border-lp-line">
                  <a href={item.href} onClick={() => setOpen(false)}
                    className="block py-4 font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] text-lp-text">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto flex flex-col gap-4 pt-10">
            <div className="flex items-center justify-between">
              <ul className="flex gap-1" aria-label={t.language}>
                {locales.map((l) => (
                  <li key={l}>
                    <LocaleLink to={l} current={locale} onPick={() => setOpen(false)}
                      className="inline-flex h-11 min-w-11 items-center justify-center rounded-control px-3 text-[15px] text-lp-text-2 aria-[current=true]:bg-lp-text/[0.08] aria-[current=true]:text-lp-text">
                      {localeLabel[l]}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
              <ThemeToggle labels={{ toLight: t.themeToLight, toDark: t.themeToDark }} />
            </div>
            <ButtonLink href={signIn} variant="secondary" size="lg">{t.signIn}</ButtonLink>
            <ButtonLink href={signUp} size="lg">{t.start}</ButtonLink>
          </div>
        </Container>
      </div>
    </>
  );
}
