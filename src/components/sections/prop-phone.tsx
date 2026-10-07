"use client";

import { BarChart3, BookOpen, LayoutDashboard, Plus, Wallet } from "lucide-react";
import Image from "next/image";
import { useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CountUp } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import type { GaugeKind } from "./prop-gauge";
import { toQuad } from "@/lib/homography";

// img-03: iPhone на камне (обе темы) + мобильный интерфейс Traders Care, натянутый на экран с перспективой.
// Углы экрана в img-03-*.webp (1200×1150) сняты по пикселям, % от кадра.
// Интерфейс свёрстан в «родных» 393×852 и отображается на четырёхугольник экрана матрицей гомографии.
const QUAD = { TL: [42.0, 10.4], TR: [64.8, 9.6], BR: [79.45, 67.4], BL: [55.7, 69.9] } as const;
const UI_W = 393, UI_H = 852;

// Календарь сделок: август, 21 рабочий день, 20 торговых (14-е — без сделок).
// P&L по дням — тот же ряд, что в калькуляторе consistency: сумма $6 420 = прогресс к цели, лучший день $1 990 = 31 %.
const PNL = [320, -180, 590, 250, -260, 380, 190, -140, 760, 520, -90, 1990, 210, -310, 700, 280, 150, -120, 370, 810];
const WEEKDAYS_AUG = [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 24, 25, 26, 27, 28, 31];
const NO_TRADE = 14;
const CAL = (() => {
  let k = 0, eq = 0, peak = 0;
  return WEEKDAYS_AUG.map((d) => {
    if (d === NO_TRADE) return { d, v: null as number | null, newHigh: false };
    const v = PNL[k++]; eq += v;
    const newHigh = eq > peak; if (newHigh) peak = eq;
    return { d, v, newHigh };
  });
})();
const BEST = Math.max(...PNL);
// Какие дни подсвечивает выбранное правило (порядок правил как в prop-rules.tsx: цель, дневной лимит, макс. просадка, consistency).
// Каждое правило подсвечивает 1–3 самых важных дня (чисто, как у consistency):
// цель — три лучших дня; дневной лимит — худший день; trailing — день последнего максимума эквити (лимит поднялся за ним);
// consistency — лучший день.
const TOP3 = [...PNL].sort((x, y) => y - x).slice(0, 3);
const WORST = Math.min(...PNL);
const LAST_HIGH = CAL.filter((c) => c.newHigh).at(-1)?.d;
const HIGHLIGHT = [
  (c: (typeof CAL)[number]) => c.v !== null && TOP3.includes(c.v),
  (c: (typeof CAL)[number]) => c.v === WORST,
  (c: (typeof CAL)[number]) => c.d === LAST_HIGH,
  (c: (typeof CAL)[number]) => c.v === BEST,
];

export type PhoneRule = { name: string; value: string; readout: string; verdict: string; percent: number; kind: GaugeKind };

const toneText: Record<GaugeKind, string> = { progress: "text-lp-accent", ok: "text-lp-text-2", warning: "text-lp-warning" };
const toneBar: Record<GaugeKind, string> = { progress: "bg-lp-accent", ok: "bg-lp-text/50", warning: "bg-lp-warning" };

export function PropPhone({ rules, active, account, t, locale }: {
  rules: PhoneRule[]; active: number; account: string; t: Dictionary["prop"]["phone"]; locale: Locale;
}) {
  const { tabs, caption } = t;
  const short = (v: number) => `${v < 0 ? "\u2212" : "+"}${Math.abs(v) >= 1000 ? `${(Math.abs(v) / 1000).toFixed(1)}K` : Math.abs(v)}`;
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : locale);
  const total = PNL.reduce((a, b) => a + b, 0);
  const lit = HIGHLIGHT[active];
  const box = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string | null>(null);
  // Появление: дни месяца проявляются по очереди, итог набегает, полоса правила растёт. После — обычная реакция на выбор.
  const inView = useInView(box, { once: true, amount: 0.4 });
  const [still, setStill] = useState(false);
  const [settled, setSettled] = useState(false);
  useEffect(() => { setStill(matchMedia("(prefers-reduced-motion: reduce)").matches); }, []);
  const seen = inView || still;
  useEffect(() => { if (!seen) return; const id = window.setTimeout(() => setSettled(true), 1800); return () => clearTimeout(id); }, [seen]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => {
      const { width: W, height: H } = el.getBoundingClientRect();
      const pts = [QUAD.TL, QUAD.TR, QUAD.BR, QUAD.BL].map(([x, y]) => [(x / 100) * W, (y / 100) * H]);
      setTransform(toQuad(UI_W, UI_H, pts));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const main = rules[active];
  const Icons = [LayoutDashboard, BookOpen, BarChart3, Wallet];

  return (
    <figure className="relative mx-auto w-full max-w-[680px]">
      <div ref={box} className="relative aspect-[1200/1150] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent),linear-gradient(to_bottom,transparent,#000_6%,#000_94%,transparent)]">
        <Image src="/media/prop/img-03-dark.webp" alt="" fill unoptimized sizes="680px" className="object-cover [[data-theme=light]_&]:hidden" />
        <Image src="/media/prop/img-03-light.webp" alt="" fill unoptimized sizes="680px" className="hidden object-cover [[data-theme=light]_&]:block" />

        {/* Экран: 393×852, натянут на фото. Пока матрица не посчитана — не показываем, чтобы не мигал прямоугольник. */}
        <div aria-hidden className="absolute left-0 top-0 origin-top-left"
          style={{ width: UI_W, height: UI_H, transform: transform ?? undefined, visibility: transform ? "visible" : "hidden" }}>
          <div className="absolute inset-[7px] overflow-hidden rounded-[46px] bg-lp-ground font-sans text-lp-text">
            {/* Статус-бар и Dynamic Island */}
            <div className="flex h-[54px] items-center justify-between px-[30px] pt-[6px] text-[15px] font-semibold">
              <span>9:41</span>
              <span className="flex items-center gap-[6px]">
                <span className="flex items-end gap-[2px]">{[5, 7, 9, 11].map((h) => <span key={h} className="w-[3px] rounded-[1px] bg-lp-text" style={{ height: h }} />)}</span>
                <span className="relative h-[12px] w-[24px] rounded-[4px] border border-lp-text/60 p-[1.5px]"><span className="block h-full w-[70%] rounded-[2px] bg-lp-text" /></span>
              </span>
            </div>
            <div className="absolute left-1/2 top-[11px] h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-black" />

            {/* Экран на странице ≈170 px (масштаб ≈0.43 от 393): аккуратный вид «приложения» сохраняем,
                но текст ≈1.5× крупнее обычного мобильного, чтобы детали календаря читались. */}
            <div className="px-[22px] pt-[12px]">
              <div className="font-display text-[26px] font-semibold tracking-[-0.02em]">{account}</div>
              <div className="mt-[3px] flex items-center gap-[7px] text-[14px] text-lp-muted">
                <span className="h-[7px] w-[7px] rounded-full bg-lp-accent" />{t.synced}
              </div>
            </div>

            {/* Календарь месяца: P&L по дням; выбранное правило подсвечивает свои дни */}
            <div className="mx-[16px] mt-[16px] flex items-baseline justify-between">
              <span className="font-display text-[23px] font-semibold tracking-[-0.01em]">{t.month}</span>
              <span className="font-display text-[22px] font-medium text-lp-profit tabular-nums"><CountUp to={total} start={seen} duration={1.6} delay={0.3} format={(n) => `+$${nf.format(Math.round(n)).replace(/\s/g, "\u00A0")}`} /></span>
            </div>
            <div className="mx-[16px] mt-[10px] grid grid-cols-5 gap-[6px]">
              {t.weekdays.map((w) => <div key={w} className="pb-[2px] text-center text-[13px] text-lp-muted">{w}</div>)}
              {CAL.map((c, idx) => {
                const on = lit(c);
                const tone = c.v === null ? "bg-lp-text/[0.04] text-lp-muted" : c.v < 0 ? "bg-lp-loss/[0.16] text-lp-loss" : "bg-lp-profit/[0.16] text-lp-profit";
                return (
                  <div key={c.d} style={{ transitionDelay: settled ? undefined : `${idx * 45}ms` }}
                    className={`relative flex h-[60px] flex-col justify-between rounded-[11px] px-[7px] py-[6px] transition-[opacity,transform] duration-300 ${settled ? "" : "duration-500"} ${tone} ${!seen ? "translate-y-2 opacity-0" : on ? "opacity-100 ring-2 ring-lp-accent" : "opacity-40"}`}>
                    <span className="text-[13px] text-lp-text-2">{c.d}</span>
                    <span className="text-right text-[16px] font-semibold leading-none tabular-nums">{c.v === null ? "·" : short(c.v)}</span>
                  </div>
                );
              })}
            </div>
            <div key={`h${active}`} className="phone-swap mx-[16px] mt-[10px] flex items-start gap-[8px] text-[14px] leading-snug text-lp-text-2">
              <span className="mt-[4px] size-[10px] shrink-0 rounded-[3px] ring-2 ring-lp-accent" />{t.hints[active]}
            </div>

            {/* Выбранное правило — то же, что у прибора */}
            <div className="mx-[16px] mt-[12px] rounded-[20px] border border-lp-line bg-lp-raised px-[18px] py-[14px]">
              <div className="flex items-center justify-between gap-[10px] text-[15px]">
                <span key={`n${active}`} className="phone-swap truncate text-lp-text-2">{main.name}</span>
                <span className={`shrink-0 font-semibold tracking-[0.04em] ${toneText[main.kind]}`}>{main.kind === "ok" ? "OK" : `${main.percent}%`}</span>
              </div>
              <div key={`r${active}`} className="phone-swap mt-[6px] font-display text-[40px] font-medium leading-none tracking-[-0.03em] tabular-nums">{main.readout}</div>
              <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-lp-text/10">
                <div className={`h-full rounded-full transition-[width] duration-700 ease-lp ${toneBar[main.kind]}`} style={{ width: seen ? `${main.percent}%` : "0%", transitionDelay: settled ? undefined : "900ms" }} />
              </div>
            </div>

            {/* Нижняя навигация приложения */}
            <nav className="absolute inset-x-0 bottom-0 flex h-[86px] items-start justify-around border-t border-lp-line bg-lp-ground/95 px-[8px] pt-[12px]">
              {tabs.map((label, i) => {
                const Icon = Icons[i];
                return <Icon key={label} size={26} strokeWidth={1.8} className={i === 3 ? "text-lp-accent" : "text-lp-muted"} />;
              })}
              <span className="flex h-[42px] w-[42px] -translate-y-[3px] items-center justify-center rounded-full bg-lp-accent text-lp-on-accent"><Plus size={24} strokeWidth={2} /></span>
            </nav>

            {/* Лёгкий блик стекла поверх интерфейса */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.07)_0%,rgb(255_255_255/0)_38%)]" />
          </div>
        </div>
      </div>
      <figcaption className="relative -mt-[9%] text-center text-lp-small text-lp-muted">{caption}</figcaption>
    </figure>
  );
}
