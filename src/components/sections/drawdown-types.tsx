"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";

// Схема «Три типа просадки»: одна и та же кривая эквити, три способа двигать пол.
// Static — пол на месте; Trailing — пол = максимум эквити − лимит (только вверх); EOD — то же, но по закрытиям дня.

const EQ = [100, 101.2, 100.6, 102.1, 103.4, 102.2, 103.9, 105.1, 104.0, 104.6, 106.2, 105.1, 104.2, 105.6, 106.9, 106.1, 107.4, 106.2, 105.4, 106.6, 107.8];
const LIMIT = 4.2;          // расстояние до пола, в тех же единицах
const DAY = 4;              // точек в «торговом дне» для EOD
const W = 240, H = 120, PAD = 8, MIN = 94.5, MAX = 109;
const x = (i: number) => PAD + (i / (EQ.length - 1)) * (W - PAD * 2);
const y = (v: number) => PAD + (1 - (v - MIN) / (MAX - MIN)) * (H - PAD * 2);
const r = (v: number) => Math.round(v * 100) / 100;

const floors = {
  static: EQ.map(() => EQ[0] - LIMIT),
  trailing: EQ.map((_, i) => Math.max(...EQ.slice(0, i + 1)) - LIMIT),
  eod: EQ.map((_, i) => {
    const lastClose = Math.floor(i / DAY) * DAY; // пол обновляется по закрытию предыдущих дней
    const closes = EQ.filter((__, k) => k % DAY === 0 && k <= lastClose);
    return Math.max(...closes) - LIMIT;
  }),
};

// Ступенчатая линия (для пола): горизонталь, потом вертикаль. k — докуда прорисовано (дробное: последний
// отрезок дорисовывается частично), чтобы лимит двигался вместе с эквити.
const stepPath = (vals: number[], k = vals.length - 1) => {
  const n = Math.floor(k);
  const head = vals.slice(0, n + 1).map((v, i) => (i === 0 ? `M${r(x(0))},${r(y(v))}` : `H${r(x(i))}V${r(y(v))}`)).join("");
  return k > n ? `${head}H${r(x(k))}` : head;
};
const linePath = (vals: number[], k = vals.length - 1) => {
  const n = Math.floor(k), f = k - n;
  const head = vals.slice(0, n + 1).map((v, i) => `${i ? "L" : "M"}${r(x(i))},${r(y(v))}`).join("");
  return f > 0 && n + 1 < vals.length ? `${head}L${r(x(k))},${r(y(vals[n] + (vals[n + 1] - vals[n]) * f))}` : head;
};
const LAST = EQ.length - 1;

export function DrawdownTypes({ t }: { t: Dictionary["prop"]["drawdown"] }) {
  const kinds = ["static", "trailing", "eod"] as const;
  // При появлении в кадре эквити прорисовывается слева направо, лимит движется вместе с ним — видно, чем три способа отличаются.
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const [k, setK] = useState(LAST);
  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { setK(LAST); return; }
    if (!seen) { setK(0); return; }
    const c = animate(0, LAST, { duration: 2.6, ease: [0.4, 0, 0.2, 1], onUpdate: setK });
    return () => c.stop();
  }, [seen]);
  return (
    <div>
      <h3 className="text-lp-h3 text-lp-text">{t.title}</h3>
      <p className="mt-3 max-w-[58ch] text-lp-body text-lp-text-2">{t.lead}</p>

      {/* Телефон: три строки «график слева, описание справа» — все три видны сразу, без горизонтальной прокрутки */}
      <div ref={ref} className="mt-7 grid gap-5 md:mt-8 md:grid-cols-3 md:gap-4">
        {kinds.map((kind, i) => (
          <figure key={kind} className="grid grid-cols-[44%_1fr] items-center gap-4 md:block">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={`${t.types[i].name}: ${t.types[i].text}`}>
              {/* дни для EOD */}
              {kind === "eod" && EQ.map((_, j) => j > 0 && j % DAY === 0 ? (
                <line key={j} x1={r(x(j))} x2={r(x(j))} y1={PAD} y2={H - PAD} stroke="rgb(var(--lp-text))" strokeOpacity="0.08" strokeDasharray="2 3" />
              ) : null)}
              <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="rgb(var(--lp-line))" />
              {/* зона ниже пола */}
              <path d={`${stepPath(floors[kind], k)}V${H - PAD}H${PAD}Z`} fill="rgb(var(--lp-accent))" fillOpacity="0.12" />
              <path d={stepPath(floors[kind], k)} fill="none" stroke="rgb(var(--lp-accent))" strokeWidth="1.6" strokeDasharray="4 3" />
              <path d={linePath(EQ, k)} fill="none" stroke="rgb(var(--lp-text))" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <figcaption className="md:mt-3">
              <div className="font-display text-[17px] font-semibold text-lp-text">{t.types[i].name}</div>
              <p className="mt-1 text-lp-small text-lp-text-2">{t.types[i].text}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-lp-small text-lp-muted">
        <span className="flex items-center gap-2"><span className="h-[2px] w-5 bg-lp-text" />{t.equity}</span>
        <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-lp-accent" />{t.floor}</span>
      </div>
      <p className="mt-5 max-w-[60ch] text-lp-small text-lp-text-2">{t.unverified}</p>
    </div>
  );
}
