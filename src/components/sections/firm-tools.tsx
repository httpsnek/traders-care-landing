"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";

// «Бесплатные калькуляторы»: каждый пункт — калькулятор, свёрнутый в строку (входные данные → результат),
// и переключатель графика справа: симулятор — веер сценариев, consistency — дневной P&L с лимитом лучшего дня,
// размер позиции — ценовая линейка вход/стоп с формулой. Цифры сквозные с проп-блоком (31 % из 45 %, $6 420).

type T = Dictionary["firms"]["tools"];

// Симулятор: 20 сценариев × 100 сделок, винрейт 48 %, прибыль 1.3R, риск 1 % на сделку. Пол просадки −10 % от старта.
const N = 100, FLOOR = -10;
const PATHS = (() => {
  let seed = 20260813;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 20 }, () => {
    const pts = [0];
    let eq = 0, hit = false;
    for (let i = 1; i <= N && !hit; i++) {
      eq += r() < 0.48 ? 1.3 : -1;
      if (eq <= FLOOR) { eq = FLOOR; hit = true; }
      pts.push(+eq.toFixed(2));
    }
    return { pts, hit };
  });
})();
const BREACHED = PATHS.filter((p) => p.hit).length;

const W = 560, H = 300;

// Анимация каждого графика проигрывается один раз за визит: графики пересоздаются при переключении калькулятора,
// поэтому «уже проиграно» хранится вне компонента. Возвращает прогресс 0..1 (при reduced motion — сразу 1).
const PLAYED = new Set<string>();
function useOnce(key: string, ref: React.RefObject<Element | null>, duration: number, ease: [number, number, number, number] = [0.16, 1, 0.3, 1]) {
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const [k, setK] = useState(() => (PLAYED.has(key) ? 1 : 0));
  useEffect(() => {
    if (PLAYED.has(key)) { setK(1); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { PLAYED.add(key); setK(1); return; }
    if (!seen) return;
    PLAYED.add(key);
    const c = animate(0, 1, { duration, ease, onUpdate: setK });
    return () => c.stop();
    // duration и ease — константы вызова; перезапуск анимации нужен только при появлении блока.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, key]);
  return k;
}

function Scenarios({ t }: { t: T }) {
  const PL = 8, PR = 8, PT = 16, PB = 26;
  // Прорисовка: k — сколько сделок уже нарисовано (0..N). Масштаб по вертикали считается по видимой части
  // и плавно отдаляется по мере роста/падения линий; пол просадки всегда в кадре.
  const ref = useRef<SVGSVGElement>(null);
  const k = useOnce("scenarios", ref, 2.6, [0.33, 0, 0.2, 1]) * N;
  const upto = (pts: number[]) => pts.slice(0, Math.floor(k) + 1);
  const vis = PATHS.flatMap((p) => upto(p.pts));
  const lo = FLOOR - 2, hi = Math.max(4, ...vis) + 2;
  const x = (i: number) => +(PL + (i / N) * (W - PL - PR)).toFixed(2);
  const y = (v: number) => +(PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB)).toFixed(2);
  const d = (pts: number[]) => pts.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join("");
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.chartAria}>
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgb(var(--lp-line))" />
      <line x1={PL} x2={W - PR} y1={y(FLOOR)} y2={y(FLOOR)} stroke="rgb(var(--lp-accent))" strokeDasharray="4 4" />
      <text x={W - PR} y={y(FLOOR) + 16} fontSize="11" textAnchor="end" fill="rgb(var(--lp-accent))">{t.floor}</text>
      {PATHS.filter((p) => !p.hit).map((p, i) => (
        <path key={`s${i}`} d={d(upto(p.pts))} fill="none" stroke="rgb(var(--lp-text) / 0.28)" strokeWidth="1.2" strokeLinejoin="round" />
      ))}
      {PATHS.filter((p) => p.hit).map((p, i) => {
        const done = k >= p.pts.length - 1;
        return (
          <g key={`h${i}`}>
            <path d={d(upto(p.pts))} fill="none" stroke="rgb(var(--lp-loss))" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx={x(p.pts.length - 1)} cy={y(FLOOR)} r="3" fill="rgb(var(--lp-loss))"
              style={{ opacity: done ? 1 : 0, transform: done ? "scale(1)" : "scale(0)", transformBox: "fill-box", transformOrigin: "center", transition: "opacity 200ms, transform 320ms var(--lp-ease)" }} />
          </g>
        );
      })}
      <text x={PL} y={H - 6} fontSize="11" fill="rgb(var(--lp-muted))">0</text>
      <text x={W - PR} y={H - 6} fontSize="11" textAnchor="end" fill="rgb(var(--lp-muted))">{N} {t.trades}</text>
    </svg>
  );
}

// Consistency: 20 дней, сумма $6 420, лучший день $1 990 = 31 %; лимит лучшего дня 45 % = $2 889.
const DAYS = [320, -180, 590, 250, -260, 380, 190, -140, 760, 520, -90, 1990, 210, -310, 700, 280, 150, -120, 370, 810];
const TOTAL = DAYS.reduce((a, b) => a + b, 0); // 6 420
const BEST = Math.max(...DAYS), LIMIT = TOTAL * 0.45;

function Consistency({ t }: { t: T }) {
  const PL = 8, PR = 8, PT = 20, PB = 26;
  const lo = Math.min(...DAYS) - 100, hi = LIMIT + 250;
  const y = (v: number) => +(PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB)).toFixed(2);
  const step = (W - PL - PR) / DAYS.length, bw = step * 0.56;
  // Появление: столбики растут от нуля по очереди, лимит проводится слева направо, подпись лучшего дня — в конце.
  const ref = useRef<SVGSVGElement>(null);
  const k = useOnce("consistency", ref, 1.8, [0.4, 0, 0.2, 1]);
  const grow = (i: number) => Math.min(1, Math.max(0, (k * (DAYS.length + 6) - i) / 6));
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t.consistency.aria}>
      <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgb(var(--lp-line))" />
      <line x1={PL} x2={PL + (W - PR - PL) * Math.min(1, k * 1.6)} y1={y(LIMIT)} y2={y(LIMIT)} stroke="rgb(var(--lp-accent))" strokeDasharray="4 4" />
      <text opacity={Math.min(1, Math.max(0, k * 3 - 1.5))} x={W - PR} y={y(LIMIT) - 7} fontSize="11" textAnchor="end" fill="rgb(var(--lp-accent))">{t.consistency.limit}</text>
      {DAYS.map((v, i) => {
        const x = PL + i * step + (step - bw) / 2;
        const best = v === BEST;
        const g = grow(i), vy = y(0) + (y(v) - y(0)) * g;
        return (
          <rect key={i} x={+x.toFixed(2)} width={+bw.toFixed(2)} y={+Math.min(vy, y(0)).toFixed(2)} height={+Math.max(g ? 1.5 : 0, Math.abs(vy - y(0))).toFixed(2)} rx="2"
            fill={v < 0 ? "rgb(var(--lp-loss) / 0.75)" : best ? "rgb(var(--lp-profit))" : "rgb(var(--lp-profit) / 0.45)"}
            stroke={best ? "rgb(var(--lp-accent))" : "none"} strokeWidth="1.5" />
        );
      })}
      <text opacity={Math.min(1, Math.max(0, (k - 0.8) * 5))} x={PL + DAYS.indexOf(BEST) * step + step / 2} y={y(BEST) - 8} fontSize="11" textAnchor="middle" fill="rgb(var(--lp-text))">{t.consistency.best}</text>
    </svg>
  );
}

// Размер позиции: EURUSD, вход 1.0842, риск $1 000 (1 % от $100K), пункт = $10 на лот.
// Линию стопа можно тянуть мышью или пальцем (5–60 п.) — лот пересчитывается на лету: лот = $1 000 / (пункты × $10).
const lotsFor = (pips: number) => 1000 / (pips * 10);
const ENTRY_P = 1.0842, PIP = 0.0001, MIN_P = 5, MAX_P = 60;

function Position({ t, pips, setPips, fmt }: { t: T; pips: number; setPips: (n: number) => void; fmt: (n: number) => string }) {
  const entryY = 70, pxPerPip = 3.2;
  const svg = useRef<SVGSVGElement>(null);
  // Появление: линия стопа «оттягивается» от входа до своего места, зона риска раскрывается вслед.
  const k = useOnce("position", svg, 1.1);
  const stopY = entryY + pips * pxPerPip * k;
  const drag = useRef(false);
  const toPips = (clientY: number) => {
    const el = svg.current; if (!el) return pips;
    const r = el.getBoundingClientRect(); const yy = ((clientY - r.top) / r.height) * H;
    return Math.round(Math.min(MAX_P, Math.max(MIN_P, (yy - entryY) / pxPerPip)));
  };
  const stopPrice = (ENTRY_P - pips * PIP).toFixed(4);
  return (
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" role="img" aria-label={t.position.aria}
      onPointerMove={(e) => { if (drag.current) setPips(toPips(e.clientY)); }}
      onPointerUp={() => { drag.current = false; }} onPointerLeave={() => { drag.current = false; }}>
      {/* зона риска */}
      <rect x="70" width={W - 78} y={entryY} height={stopY - entryY} fill="rgb(var(--lp-loss) / 0.08)" />
      <line x1="70" x2={W - 8} y1={entryY} y2={entryY} stroke="rgb(var(--lp-accent))" strokeWidth="1.5" />
      <text x="8" y={entryY + 4} fontSize="11" fontFamily="var(--lp-font-mono)" fill="rgb(var(--lp-muted))">{ENTRY_P.toFixed(4)}</text>
      <text x={W - 8} y={entryY - 8} fontSize="12" textAnchor="end" fill="rgb(var(--lp-accent))">{t.position.entry} {ENTRY_P.toFixed(4)}</text>
      {/* скобка расстояния */}
      <path d={`M300,${entryY + 4} h-10 V${stopY - 4} h10`} fill="none" stroke="rgb(var(--lp-text) / 0.6)" strokeWidth="1.2" />
      <text x="276" y={(entryY + stopY) / 2 + 4} fontSize="13" textAnchor="end" fill="rgb(var(--lp-text))">{pips} {t.position.pipsUnit}</text>
      {/* стоп — перетаскивается */}
      <g className="cursor-ns-resize" onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); }}>
        <rect x="70" width={W - 78} y={stopY - 12} height="24" fill="transparent" />
        <line x1="70" x2={W - 8} y1={stopY} y2={stopY} stroke="rgb(var(--lp-loss))" strokeWidth="1.5" />
        <text x="8" y={stopY + 4} fontSize="11" fontFamily="var(--lp-font-mono)" fill="rgb(var(--lp-muted))">{stopPrice}</text>
        <rect x={W - 150} y={stopY + 6} width="142" height="22" rx="11" fill="rgb(var(--lp-loss) / 0.14)" />
        <text x={W - 79} y={stopY + 21} fontSize="11.5" textAnchor="middle" fill="rgb(var(--lp-loss))">↕ {t.position.stop} {stopPrice}</text>
      </g>
      <text x={W / 2} y="30" fontSize="15" textAnchor="middle" fontFamily="var(--lp-font-mono)" fill="rgb(var(--lp-text))">
        $1 000 = {pips} {t.position.pipsUnit} × $10 × {fmt(lotsFor(pips))}
      </text>
      <text x={W / 2} y={H - 8} fontSize="11" textAnchor="middle" fill="rgb(var(--lp-muted))">{t.position.drag}</text>
    </svg>
  );
}


export function FirmTools({ t, links }: { t: T; links: string[] }) {
  const [active, setActive] = useState(0);
  const [pips, setPips] = useState(25);
  const lotsText = (n: number) => `${n.toFixed(2).replace(".", t.position.decimal)} ${t.position.lots}`;
  const labels = [t.chartLabel, t.consistency.label, t.position.label];

  return (
    <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-5">
        <h3 className="font-display text-[clamp(26px,2.6vw,36px)] font-medium leading-tight tracking-[-0.02em] text-lp-text">{t.title}</h3>
        <p className="mt-4 max-w-[40ch] text-lp-body text-lp-text-2">{t.lead}</p>

        {/* Калькулятор в строку: входные данные → результат. Строка переключает график. */}
        <ul className="mt-8 border-t border-lp-line">
          {t.items.map((it, i) => {
            const on = i === active;
            return (
              <li key={it.t} className="relative border-b border-lp-line">
                <span aria-hidden className={`absolute inset-y-4 left-0 w-[2px] rounded-full transition-colors duration-200 ${on ? "bg-lp-accent" : "bg-transparent"}`} />
                <button type="button" aria-pressed={on} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
                  className="block w-full py-5 pl-5 pr-16 text-left">
                  <span className={`block text-[17px] font-medium transition-colors duration-200 ${on ? "text-lp-text" : "text-lp-text-2"}`}>{it.t}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[12.5px]">
                    {(i === 2 ? [it.inputs[0], `${t.position.stop} ${pips} ${t.position.pipsUnit}`, it.inputs[2]] : it.inputs).map((inp, k) => (
                      <span key={inp} className="flex items-center gap-2 text-lp-muted">{k > 0 && <span aria-hidden className="text-lp-line">·</span>}{inp}</span>
                    ))}
                    <ArrowRight size={13} className={`mx-1 ${on ? "text-lp-accent" : "text-lp-muted"}`} aria-hidden />
                    <span className={on ? "text-lp-text" : "text-lp-text-2"}>{i === 2 ? lotsText(lotsFor(pips)) : it.result.replace("{n}", String(BREACHED))}</span>
                  </span>
                </button>
                <a href={links[i]} aria-label={`${t.open}: ${it.t}`}
                  className={`absolute right-0 top-5 inline-flex items-center gap-1 text-[13px] before:absolute before:-inset-3 before:content-[''] transition-colors duration-200 ${on ? "text-lp-text hover:text-lp-accent" : "text-lp-muted hover:text-lp-text"}`}>
                  {t.open}<ArrowUpRight size={15} strokeWidth={1.75} aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <figure className="relative lg:col-span-6 lg:col-start-7 lg:pt-2">
        <div key={active} className="phone-swap">
          {active === 0 && <Scenarios t={t} />}
          {active === 1 && <Consistency t={t} />}
          {active === 2 && <Position t={t} pips={pips} setPips={setPips} fmt={lotsText} />}
        </div>
        <figcaption className="mt-3 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-lp-muted">
          <span>{labels[active]}</span>
          {active === 0 && <span><span className="text-lp-loss">{BREACHED}</span> / {PATHS.length} {t.breached}</span>}
        </figcaption>
      </figure>
    </div>
  );
}
