"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_URL, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { DrawdownTypes } from "./drawdown-types";
import { PropGauge, type GaugeKind } from "./prop-gauge";
import { PropPhone, type PhoneRule } from "./prop-phone";

// Блок 3 «Проп-правила». Ряд 1: список правил слева, прибор img-02 справа (зеркально ряду 2);
// выбор правила поворачивает стрелку. Ряд 2: телефон img-03 (тот же счёт, синхронно с выбором) + схема трёх типов просадки.

// Демо-данные счёта «Prop 100K · Phase 1». percent — доля лимита (или прогресс к цели), 0–100.
// readout — число в центре прибора: остаток в $ или доля в %.
const RULES: { percent: number; kind: GaugeKind; readout: number; unit: "usd" | "pct" }[] = [
  { percent: 64, kind: "progress", readout: 3580, unit: "usd" }, // цель по прибыли: $6 420 из $10 000
  { percent: 36, kind: "ok", readout: 3180, unit: "usd" },       // дневной лимит: $1 820 из $5 000
  { percent: 82, kind: "warning", readout: 3150, unit: "usd" },  // макс. просадка trailing
  { percent: 69, kind: "ok", readout: 31, unit: "pct" },         // consistency: лучший день 31 % из 45 %
];
const DEFAULT = 2;

const toneText: Record<GaugeKind, string> = { progress: "text-lp-accent", ok: "text-lp-text-2", warning: "text-lp-warning" };
const toneBar: Record<GaugeKind, string> = { progress: "bg-lp-accent", ok: "bg-lp-text/50", warning: "bg-lp-warning" };

export function PropRules({ t, locale }: { t: Dictionary["prop"]; locale: Locale }) {
  const [active, setActive] = useState(DEFAULT);
  const rule = RULES[active];
  const text = t.rules[active];

  const pct = (n: number) => (locale === "en" ? `${n}%` : `${n} %`);
  const verdict = (r: (typeof RULES)[number]) => (r.kind === "progress" ? pct(r.percent) : r.kind === "ok" ? "OK" : "WARNING");
  const nf = useMemo(() => new Intl.NumberFormat(locale === "en" ? "en-US" : locale, { maximumFractionDigits: 0 }), [locale]);
  const fmt = (unit: "usd" | "pct", n: number) => (unit === "usd" ? `$${nf.format(Math.round(n))}` : pct(Math.round(n)));
  const format = (n: number) => fmt(rule.unit, n);
  const phoneRules: PhoneRule[] = RULES.map((r, i) => ({
    name: t.rules[i].name, value: t.rules[i].value, readout: fmt(r.unit, r.readout),
    verdict: r.kind === "warning" ? `WARNING · ${pct(r.percent)}` : verdict(r), percent: r.percent, kind: r.kind,
  }));

  // Вторую тему прибора подгружаем заранее, чтобы при смене темы объект не появлялся с задержкой.
  useEffect(() => {
    const id = window.setTimeout(() => {
      ["/media/prop/img-02-dark.webp", "/media/prop/img-02-light.webp"].forEach((src) => { new window.Image().src = src; });
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="prop" aria-labelledby="prop-title" className="py-section-sm lg:py-section">
      <Container>
        <div className="max-w-[760px]">
          <h2 id="prop-title" className="text-lp-h2 text-lp-text">{t.title}</h2>
          <p className="mt-5 max-w-[56ch] text-lp-lead text-lp-text-2">{t.lead}</p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <figure className="lg:order-2 lg:col-span-7" aria-label={`${text.name}: ${text.value}. ${verdict(rule)}`}>
            <PropGauge
              percent={rule.percent} kind={rule.kind}
              readoutValue={rule.readout} format={format} liveStep={rule.unit === "usd" ? 1 : 0}
              caption={text.caption}
              verdict={rule.kind === "warning" ? `WARNING · ${pct(rule.percent)}` : verdict(rule)}
              account={t.account}
              marker={rule.kind === "progress" ? t.markerTarget : t.markerLimit}
            />
          </figure>

          {/* Список правил: выбор поворачивает стрелку */}
          <div className="lg:order-1 lg:col-span-5">
            <div className="flex items-baseline justify-between gap-4 border-b border-lp-line pb-3">
              <span className="text-lp-small font-medium text-lp-text">{t.account}</span>
              <span className="text-lp-small text-lp-muted">{t.demo}</span>
            </div>
            <ul aria-label={t.listLabel} className="flex flex-col">
              {RULES.map((r, i) => {
                const on = i === active;
                return (
                  <li key={i} className="border-b border-lp-line">
                    <button type="button" aria-pressed={on} onClick={() => setActive(i)}
                      className={`group relative grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 py-4 pl-4 pr-1 text-left transition-colors duration-200 ${on ? "bg-lp-text/[0.04]" : "hover:bg-lp-text/[0.025]"}`}>
                      <span className={`absolute inset-y-3 left-0 w-[2px] rounded-full transition-colors duration-200 ${on ? "bg-lp-accent" : "bg-transparent"}`} />
                      <span className={`text-[15px] font-medium ${on ? "text-lp-text" : "text-lp-text-2 group-hover:text-lp-text"}`}>{t.rules[i].name}</span>
                      <span className={`text-[12px] font-semibold tracking-[0.06em] ${toneText[r.kind]}`}>{verdict(r)}</span>
                      <span className="col-span-2 flex items-center gap-3">
                        <span className="relative h-[3px] min-w-[48px] flex-1 overflow-hidden rounded-full bg-lp-text/10">
                          <span className={`absolute inset-y-0 left-0 rounded-full ${toneBar[r.kind]}`} style={{ width: `${r.percent}%` }} />
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-right text-[13px] tabular-nums text-lp-muted lg:w-[46%] lg:whitespace-normal">{t.rules[i].value}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-lp-small text-lp-muted">{t.warningNote}</p>
            <ButtonLink href={`${APP_URL}/register`} size="lg" className="mt-8">{t.cta}</ButtonLink>
          </div>
        </div>

        {/* Ряд 2: телефон слева (экран повёрнут к контенту), схема трёх типов просадки справа.
            На мобильном телефон скрыт — показывать телефон внутри телефона бессмысленно. */}
        <div className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-6">
          <div className="hidden lg:col-span-6 lg:block">
            <PropPhone rules={phoneRules} active={active} account={t.account} t={t.phone} locale={locale} />
          </div>
          <div className="lg:col-span-6 lg:pl-6">
            <DrawdownTypes t={t.drawdown} />
          </div>
        </div>
      </Container>
    </section>
  );
}
