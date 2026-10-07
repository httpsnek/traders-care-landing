"use client";

import { Check, Link2 } from "lucide-react";
import { useInView } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CountUp } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { makeFormat } from "@/lib/format";

// «Результаты, которые нельзя нарисовать» — показываем саму проверку: публичная карточка сделки сверху,
// под ней строка из истории MetaTrader 5; коленчатые линии связывают каждое число карточки с той же ячейкой выписки.
// Порядок чисел на карточке = порядок колонок выписки, поэтому линии не пересекаются. Справа — что не публикуется.

type T = Dictionary["verify"]["proof"];

// Свечи XAUUSD (детерминированные): вход на 5-й свече 4 031.40, выход на 15-й 4 047.90.
const CANDLES = (() => {
  let seed = 11, p = 4027.6;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 20 }, (_, i) => {
    const drift = i < 4 ? 0.5 : i < 15 ? 1.55 : -0.3;
    const o = p, c = +(o + drift + (r() - 0.45) * 2.2).toFixed(2);
    const h = Math.max(o, c) + 0.3 + r() * 1.2, l = Math.min(o, c) - 0.3 - r() * 1.2;
    p = c;
    return { o, c, h, l };
  });
})();
const ENTRY_I = 5, EXIT_I = 15, ENTRY = 4031.4, EXIT = 4047.9;

function Chart({ t, f }: { t: T; f: ReturnType<typeof makeFormat> }) {
  // Появление (группа rv — карточка в кадре): свечи слева направо, затем зона сделки от входа к выходу, затем метки.
  const STEP_MS = 55, after = CANDLES.length * STEP_MS;
  const W = 640, H = 220, PX = 18, PY = 26;
  const lo = Math.min(...CANDLES.map((c) => c.l), ENTRY) - 0.8, hi = Math.max(...CANDLES.map((c) => c.h), EXIT) + 0.8;
  const y = (v: number) => +(PY + (1 - (v - lo) / (hi - lo)) * (H - PY * 2)).toFixed(2);
  const step = (W - PX * 2) / CANDLES.length;
  const x = (i: number) => +(PX + i * step + step / 2).toFixed(2);
  const ink = "rgb(var(--lp-text) / 0.6)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.chartAria}>
      {[0.25, 0.5, 0.75].map((k) => <line key={k} x1="0" x2={W} y1={PY + k * (H - PY * 2)} y2={PY + k * (H - PY * 2)} stroke="rgb(var(--lp-line))" />)}
      <rect x={x(ENTRY_I)} y={y(EXIT)} width={x(EXIT_I) - x(ENTRY_I)} height={y(ENTRY) - y(EXIT)} fill="rgb(var(--lp-accent) / 0.07)"
        className={`origin-left scale-x-0 [transform-box:fill-box] duration-[900ms] transition-[opacity,transform] ease-lp motion-reduce:transition-none group-data-[seen]/rv:scale-x-100 motion-reduce:scale-x-100`}
        style={{ transitionDelay: `${ENTRY_I * STEP_MS + 150}ms` }} />
      {CANDLES.map((c, i) => {
        const up = c.c >= c.o;
        const top = y(Math.max(c.o, c.c)), bot = y(Math.min(c.o, c.c));
        return (
          <g key={i} className={`translate-y-1.5 opacity-0 duration-500 transition-[opacity,transform] ease-lp motion-reduce:transition-none group-data-[seen]/rv:translate-y-0 group-data-[seen]/rv:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100`}
            style={{ transitionDelay: `${i * STEP_MS}ms` }}>
            <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={ink} strokeWidth="1.2" />
            <rect x={x(i) - 7} width="14" y={top} height={Math.max(2, bot - top)} rx="1.5"
              fill={up ? "rgb(var(--lp-raised))" : ink} stroke={ink} strokeWidth="1.2" />
          </g>
        );
      })}
      <g className={`opacity-0 duration-500 transition-[opacity,transform] ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100`} style={{ transitionDelay: `${after}ms` }}>
      <line x1={x(ENTRY_I)} x2={x(EXIT_I)} y1={y(ENTRY)} y2={y(ENTRY)} stroke="rgb(var(--lp-accent))" strokeDasharray="4 4" strokeWidth="1.4" />
      <line x1={x(EXIT_I)} x2={x(EXIT_I)} y1={y(ENTRY)} y2={y(EXIT)} stroke="rgb(var(--lp-accent))" strokeDasharray="4 4" strokeWidth="1.4" />
      <circle cx={x(ENTRY_I)} cy={y(ENTRY)} r="4.5" fill="rgb(var(--lp-accent))" />
      <circle cx={x(EXIT_I)} cy={y(EXIT)} r="4.5" fill="rgb(var(--lp-accent))" />
      {/* «Вход» — слева над пунктиром: свечи до входа ниже цены входа, место свободно */}
      <text x={x(ENTRY_I) - 12} y={y(ENTRY) - 10} fontSize="12" textAnchor="end" fill="rgb(var(--lp-muted))">{t.entry} {f.price(ENTRY)}</text>
      <text x={x(EXIT_I)} y={y(EXIT) - 14} fontSize="12" textAnchor="middle" fill="rgb(var(--lp-muted))">{t.exit} {f.price(EXIT)}</text>
      </g>
    </svg>
  );
}

// Выписка MT5: заголовки — как в настоящем отчёте (англ.), средняя строка — наша сделка.
const COLS = ["Ticket", "Open time", "Type", "Volume", "Symbol", "Price", "Close time", "Price", "Profit"];
// На десктопе таблица целиком помещается в колонку (без прокрутки) — иначе соединители упираются в пустоту.
const GRID = "grid grid-cols-[0.75fr_0.9fr_1fr_1fr_0.95fr] gap-x-2 sm:grid-cols-[1.05fr_1.2fr_0.6fr_0.75fr_0.9fr_1fr_1.2fr_1fr_0.95fr] sm:gap-x-3 lg:gap-x-2 xl:gap-x-3";
// На телефоне — только колонки, которые сверяются с карточкой (+ символ): без горизонтальной прокрутки.
const PHONE_HIDDEN = [0, 1, 2, 6];
const ROWS = [
  ["48213855", "12.09 09:14", "sell", "1.00", "EURUSD", "1.07412", "12.09 09:51", "1.07385", "270.00"],
  ["48213907", "12.09 10:42", "buy", "0.50", "XAUUSD", "4031.40", "12.09 13:18", "4047.90", "825.00"],
  ["48214022", "12.09 15:03", "buy", "2.00", "NAS100", "19842.5", "12.09 15:40", "19826.0", "-330.00"],
];
const MATCH_ROW = 1;
const MATCH_COLS = [3, 5, 7, 8]; // объём, цена входа, цена выхода, прибыль — в том же порядке, что на карточке

type Seg = { d: string; sx: number; sy: number; ex: number; ey: number };

export function VerifyProof({ t, locale }: { t: T; locale: Locale }) {
  const f = useMemo(() => makeFormat(locale), [locale]);
  const box = useRef<HTMLDivElement>(null);
  const from = useRef<(HTMLDivElement | null)[]>([]);
  const to = useRef<(HTMLDivElement | null)[]>([]);
  const table = useRef<HTMLDivElement>(null);
  const [segs, setSegs] = useState<Seg[]>([]);
  const [hot, setHot] = useState<number | null>(null);
  const inView = useInView(box, { once: true, amount: 0.3 });
  const [still, setStill] = useState(false);
  useEffect(() => setStill(matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const seen = inView || still;

  const cardValues = [
    { label: t.volume, value: `${f.price(0.5)} ${t.lot}` },
    { label: t.entry, value: f.price(ENTRY) },
    { label: t.exit, value: f.price(EXIT) },
    { label: t.profit, value: f.usd(825) },
  ];

  // Соединители: из-под значения карточки вниз, по горизонтали, вниз к верхней границе таблицы над своей колонкой.
  // Правая линия поворачивает первой (выше), левая — последней (ниже): «лесенка» без пересечений.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => {
      const b = el.getBoundingClientRect();
      const out: Seg[] = [];
      from.current.forEach((a, i) => {
        const c = to.current[i];
        if (!a || !c) return;
        const ra = a.getBoundingClientRect(), rc = c.getBoundingClientRect();
        const sx = ra.left + 16 - b.left, sy = ra.bottom - b.top;
        const tt = table.current?.getBoundingClientRect().top ?? rc.top;
        const ex = rc.left + 14 - b.left, ey = tt - b.top - 1;
        const my = sy + ((ey - sy) * (MATCH_COLS.length - i)) / (MATCH_COLS.length + 1);
        const r = Math.min(8, Math.abs(ex - sx) / 2);
        const dir = ex >= sx ? 1 : -1;
        const d = Math.abs(ex - sx) < 1
          ? `M${sx},${sy} V${ey}`
          : `M${sx},${sy} V${my - r} Q${sx},${my} ${sx + dir * r},${my} H${ex - dir * r} Q${ex},${my} ${ex},${my + r} V${ey}`;
        out.push({ d, sx, sy, ex, ey });
      });
      setSegs(out);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [locale]);

  const dim = (i: number) => hot !== null && hot !== i;
  // Без мыши (телефон, планшет) наведения нет — то же самое нажатием: тап включает подсветку поля, повторный выключает.
  // Телефон при тапе ещё и имитирует наведение (mouseenter) — его игнорируем, иначе тап включает и сразу выключает.
  const canHover = () => matchMedia("(hover: hover)").matches;
  const tap = (i: number) => () => { if (canHover()) return; setHot((h) => (h === i ? null : i)); };
  const enter = (i: number) => () => { if (canHover()) setHot(i); };
  const leave = () => { if (canHover()) setHot(null); };

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
      <div ref={box} data-seen={seen ? "" : undefined} className="group/rv relative min-w-0 lg:col-span-8">
        {/* Публичная карточка — как ею делятся */}
        <figure className="rounded-screen border border-lp-line bg-lp-raised">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lp-line px-5 py-3 sm:px-7">
            <span className="flex min-w-0 items-center gap-2 text-[13px]">
              <Link2 size={14} strokeWidth={2} className="shrink-0 text-lp-muted" aria-hidden />
              <span className="sr-only">{t.linkLabel}: </span>
              <span className="truncate font-mono text-lp-text-2">traderscare.io/v/<span className="text-lp-text">7K2F9Q</span></span>
            </span>
            <span className="flex items-center gap-2 text-[13px] text-lp-text">
              <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-lp-accent text-lp-on-accent"><Check size={11} strokeWidth={3} aria-hidden /></span>
              {t.verified}
            </span>
          </div>
          <div className="px-5 pt-6 sm:px-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[30px] font-semibold tracking-[-0.02em] text-lp-text">XAUUSD</span>
                  <span className="text-[14px] text-lp-text-2">Long</span>
                </div>
                <div className="mt-1 text-[13px] text-lp-muted">{t.date}</div>
              </div>
              <div className="font-display text-[44px] font-medium leading-none tracking-[-0.035em] text-lp-profit tabular-nums"><CountUp to={2.4} start={seen} format={(n) => `+${n.toFixed(1)}R`} duration={1.4} delay={0.9} /></div>
            </div>
            <div className="mt-4"><Chart t={t} f={f} /></div>
          </div>
          <div className="grid grid-cols-2 border-t border-lp-line sm:grid-cols-4 sm:divide-x sm:divide-lp-line">
            {cardValues.map((v, i) => (
              <div key={v.label} ref={(el) => { from.current[i] = el; }}
                onMouseEnter={enter(i)} onMouseLeave={leave} onClick={tap(i)}
                className={`cursor-pointer px-5 py-4 transition-[opacity,background-color] duration-200 sm:px-4 sm:first:pl-7 ${dim(i) ? "opacity-40" : ""} ${hot === i ? "bg-lp-accent/[0.06]" : ""}`}>
                <div className="text-[12px] text-lp-muted">{v.label}</div>
                <div className={`mt-1 font-mono text-[15px] tabular-nums ${i === 3 ? "text-lp-profit" : "text-lp-text"}`}>{v.value}</div>
              </div>
            ))}
          </div>
        </figure>

        {/* Соединители (только десктоп — там выписка стоит под карточкой без прокрутки) */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block">
          {segs.map((s, i) => (
            <g key={i} style={{ opacity: dim(i) ? 0.15 : 1, transition: "opacity 200ms" }}>
              <path d={s.d} fill="none" stroke="rgb(var(--lp-accent))" strokeWidth="1.2" pathLength={1} strokeDasharray="1"
                style={{ strokeDashoffset: seen ? 0 : 1, transition: `stroke-dashoffset 900ms var(--lp-ease) ${1500 + i * 120}ms` }} />
              <circle cx={s.sx} cy={s.sy} r="3" fill="rgb(var(--lp-accent))" />
              <circle cx={s.ex} cy={s.ey} r="3" fill="rgb(var(--lp-accent))" />
            </g>
          ))}
        </svg>

        {/* Выписка брокера */}
        <div className="mt-8 lg:mt-14">
          <div className="sm:-mx-5 sm:overflow-x-auto sm:px-5 md:mx-0 md:px-0">
            <div ref={table} role="table" aria-label={t.statement} className="border-y border-lp-line font-mono text-[11.5px] tabular-nums sm:min-w-[760px] sm:text-[12.5px] lg:min-w-0 lg:text-[11.5px] xl:text-[12.5px]">
              <div role="row" className={`${GRID} border-b border-lp-line py-2.5 text-lp-muted`}>
                {COLS.map((c, i) => <span role="columnheader" key={i} className={PHONE_HIDDEN.includes(i) ? "max-sm:hidden" : ""}>{c}</span>)}
              </div>
              {ROWS.map((row, r) => (
                <div role="row" key={row[0]} className={`${GRID} py-2.5 ${r === MATCH_ROW ? "bg-lp-accent/[0.06] text-lp-text" : "text-lp-muted"}`}>
                  {row.map((cell, c) => {
                    const k = r === MATCH_ROW ? MATCH_COLS.indexOf(c) : -1;
                    return (
                      <div role="cell" key={c} ref={k >= 0 ? (el) => { to.current[k] = el; } : undefined}
                        onMouseEnter={k >= 0 ? enter(k) : undefined} onMouseLeave={k >= 0 ? leave : undefined} onClick={k >= 0 ? tap(k) : undefined}
                        className={`relative truncate transition-opacity duration-200 ${PHONE_HIDDEN.includes(c) ? "max-sm:hidden" : ""} ${k >= 0 ? `text-lp-accent ${dim(k) ? "opacity-40" : ""}` : ""}`}>
                        {cell}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[12px]">
            <span className="text-lp-muted">{t.statement}</span>
            <span className="flex items-center gap-1.5 text-lp-accent"><Check size={12} strokeWidth={2.5} aria-hidden />{t.matched}</span>
          </div>
        </div>
      </div>

      {/* Что не публикуется */}
      <div className="min-w-0 lg:col-span-4 lg:pl-6">
        <div className="text-lp-small text-lp-muted">{t.hiddenTitle}</div>
        <dl className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-5">
          {t.hiddenFields.map((label, i) => (
            <div key={label} className="border-b border-lp-line pb-4">
              <dt className="text-[12px] text-lp-muted">{label}</dt>
              <dd aria-hidden className="mt-1.5 select-none truncate text-[15px] text-lp-text-2 blur-[5px]">{t.hiddenValues[i]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 max-w-[34ch] text-lp-small text-lp-text-2">{t.hidden}</p>
      </div>
    </div>
  );
}
