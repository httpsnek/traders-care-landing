"use client";

import { Minus, Plus } from "lucide";
import { ArrowRight } from "lucide-react";
import { MorphIcon } from "morphicons/react";
import { useState } from "react";
import type { Dictionary } from "@/i18n";
import { APP_URL } from "@/i18n/config";
import { Container } from "@/components/ui/container";

// Блок 10 «FAQ». Без картинок — пауза перед финальной сценой.
// Слева заголовок и контакт, справа аккордеон: можно открыть несколько; плюс ↔ минус — Morphicons.
// Открытие — плавная высота через grid-rows 0fr → 1fr (без замера высоты в JS).
// [ДАННЫЕ] Ссылки на Telegram поддержки и страницу всех вопросов.
const LINKS = { telegram: "https://t.me/traderscare", all: `${APP_URL}/faq` };

export function Faq({ t }: { t: Dictionary["faq"] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });

  return (
    <section id="faq" aria-labelledby="faq-title" className="py-section-sm lg:py-section">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <h2 id="faq-title" className="text-lp-h2 text-lp-text">{t.title}</h2>
            <p className="mt-5 max-w-[30ch] text-lp-body text-lp-text-2">
              {t.contact}{" "}
              <a href={LINKS.telegram} className="relative text-lp-text before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] underline decoration-lp-text/25 underline-offset-[5px] transition-colors hover:decoration-lp-accent">{t.contactLink}</a>.
            </p>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-lp-line">
              {t.items.map((it, i) => {
                const on = open.has(i);
                const id = `faq-a-${i}`;
                return (
                  <li key={it.q} className="border-b border-lp-line">
                    <h3>
                      <button type="button" id={`${id}-q`} aria-expanded={on} aria-controls={id} onClick={() => toggle(i)}
                        className="group flex w-full items-center justify-between gap-6 py-6 text-left">
                        <span className={`font-display text-[clamp(19px,1.7vw,24px)] font-medium leading-snug tracking-[-0.015em] transition-colors duration-200 ${on ? "text-lp-text" : "text-lp-text-2 group-hover:text-lp-text"}`}>{it.q}</span>
                        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${on ? "border-lp-accent bg-lp-accent text-lp-on-accent" : "border-lp-line text-lp-text-2 group-hover:border-lp-text/40"}`}>
                          <MorphIcon icon={on ? Minus : Plus} size={16} strokeWidth={2} spring="snappy" reducedMotion="user" />
                        </span>
                      </button>
                    </h3>
                    <div id={id} role="region" aria-labelledby={`${id}-q`} className={`grid transition-[grid-template-rows] duration-500 ease-lp motion-reduce:transition-none ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <p className="max-w-[62ch] pb-7 pr-14 text-lp-body text-lp-text-2">{it.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <a href={LINKS.all} className="group mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-lp-text">
              {t.all}<ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
