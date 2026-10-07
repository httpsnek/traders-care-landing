"use client";

import { animate, motion, useAnimationFrame, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Прибор блока проп-правил: фото img-02 (обе темы) + шкала, стрелка и показания, нарисованные кодом.
// Геометрия циферблата в img-02-*.webp (1240×1240): центр 50 %/50 %, радиус внутри латуни 33.65 %.
//
// Поведение:
// - самотест при первом появлении: разгон до упора и отскок к значению (без залипания на упоре);
// - пружина с лёгким перелётом при смене значения;
// - риски и дуга загораются вслед за стрелкой; во время самотеста цифра идёт за стрелкой
//   (0 → пик → значение), потом при смене правила досчитывает;
// - после самотеста стрелка несколько раз едва заметно «дышит» и замирает; цифра синхронна (±1) и
//   останавливается на значении.
// При prefers-reduced-motion — сразу конечное состояние, без движения.

export type GaugeKind = "progress" | "ok" | "warning";

// Всё внутри латунного кольца (r 33.65): штриховка зоны 31.4–33.0, риски от 31 внутрь.
const C = 50, R_TICK = 31, R_LABEL = 23.6, R_FILL = 26.2, R_ZONE = 33, R_INNER = 20;
const A0 = -225, SWEEP = 270; // 0 % — слева внизу, 100 % — справа внизу, через верх
const WARN_FROM = 80;
const deg = (p: number) => A0 + (SWEEP * p) / 100;
const rad = (p: number) => (deg(p) * Math.PI) / 180;
const round = (v: number) => Math.round(v * 1000) / 1000; // иначе сервер и браузер расходятся в последнем знаке
const pt = (p: number, r: number) => [round(C + r * Math.cos(rad(p))), round(C + r * Math.sin(rad(p)))] as const;
const arc = (p0: number, p1: number, r: number) => {
  const [x0, y0] = pt(p0, r), [x1, y1] = pt(p1, r);
  return `M${x0},${y0} A${r},${r} 0 ${(SWEEP * (p1 - p0)) / 100 > 180 ? 1 : 0} 1 ${x1},${y1}`;
};

const TONE: Record<GaugeKind, string> = {
  progress: "rgb(var(--lp-accent))",
  ok: "rgb(var(--lp-text))",
  warning: "rgb(var(--lp-warning))",
};
const TONE_TEXT: Record<GaugeKind, string> = { progress: "text-lp-accent", ok: "text-lp-text-2", warning: "text-lp-warning" };

// Риски: 0–100 через 2.5 — крупные каждые 25, средние каждые 12.5, остальные мелкие.
const TICKS = Array.from({ length: 41 }, (_, i) => {
  const p = i * 2.5;
  const size = i % 10 === 0 ? "major" : i % 5 === 0 ? "mid" : "minor";
  const len = size === "major" ? 3.6 : size === "mid" ? 2.6 : 1.6;
  const [x0, y0] = pt(p, R_TICK), [x1, y1] = pt(p, R_TICK - len);
  return { p, size, x0, y0, x1, y1 };
});
const LABELS = [0, 25, 50, 75, 100].map((p) => ({ p, xy: pt(p, R_LABEL) }));
// Штриховка зоны предупреждения: короткие радиальные штрихи между R_TICK+0.4 и R_ZONE.
const HATCH = Array.from({ length: 17 }, (_, i) => {
  const p = WARN_FROM + (i * (100 - WARN_FROM)) / 16;
  return { a: pt(p, R_TICK + 0.4), b: pt(p, R_ZONE) };
});
// Метка конца шкалы — под цифрой «100».
const [MK_X, MK_Y0] = pt(100, R_LABEL);
const MK_Y = round(MK_Y0 + 4.4); // ниже «100» с зазором — не наезжает на цифру

type GaugeProps = {
  percent: number;
  kind: GaugeKind;
  readoutValue: number;     // число для досчёта
  format: (n: number) => string;
  caption: string;
  verdict: string;
  account: string;
  marker: string;           // подпись у конца шкалы: «пол» / «цель»
  liveStep?: number;        // на сколько единиц цифра колеблется вместе со стрелкой (0 — не колеблется)
};

export function PropGauge({ percent, kind, readoutValue, format, caption, verdict, account, marker, liveStep = 1 }: GaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: "-15% 0px -15% 0px" });
  const reduce = useReducedMotion();

  // Положение стрелки в % шкалы. Двигаем его сами через animate(): так самотест можно собрать
  // из «разгона до упора» и «отскока», без перелёта за край шкалы (иначе стрелка залипает на упоре).
  const pos = useMotionValue(reduce ? percent : 0);
  const breath = useMotionValue(0);
  const needle = useTransform(() => deg(Math.min(100.5, Math.max(-0.5, pos.get() + breath.get()))));
  // Дуга заполнения двигается вместе со стрелкой (то же положение + «дыхание»), а не по целым процентам.
  const fillDash = useTransform(() => `${Math.max(0.01, Math.min(100, pos.get() + breath.get()))} 100`);

  const SPRING = { type: "spring" as const, stiffness: 70, damping: 9, mass: 1.1 };

  // Самотест при первом появлении: разгон 0 → 100 (0.55 с, с торможением у упора), удар об упор —
  // отскок с обратной скоростью и пружиной к значению. Дальше — просто пружина к новому значению.
  // Пока идёт самотест, цифра в центре привязана к стрелке (см. ниже): 0 → пик → значение.
  const tested = useRef(false);
  const testing = useRef(false);
  useEffect(() => {
    if (reduce) { pos.jump(percent); return; }
    if (!inView && !tested.current) return;
    let stop = () => {};
    if (!tested.current) {
      tested.current = true;
      testing.current = true;
      const up = animate(pos, 100, { duration: 0.55, ease: [0.45, 0, 0.8, 1] });
      stop = () => up.stop();
      up.then(() => {
        const back = animate(pos, percent, { ...SPRING, velocity: -60 });
        stop = () => back.stop();
        back.then(() => {
          testing.current = false; settledAt.current = performance.now(); wake(); base.set(readoutValue);
        });
      });
      return () => stop();
    }
    // Самотест мог прерваться (прибор ушёл из кадра посреди разгона) — тогда цифра застряла на промежуточном
    // значении. Всегда досчитываем её до честного и помечаем прибор «успокоенным».
    testing.current = false;
    if (settledAt.current === null) settledAt.current = performance.now();
    wake(); // при смене правила прибор снова немного «дышит» и успокаивается
    const c = animate(pos, percent, SPRING);
    const n = base.get() !== readoutValue ? animate(base, readoutValue, { duration: 0.9, ease: [0.16, 1, 0.3, 1] }) : null;
    return () => { c.stop(); n?.stop(); };
    // Остальные значения (motion values, рефы, readoutValue) читаются в момент запуска; анимация должна
    // перезапускаться только при смене правила, появлении прибора в кадре или настройки движения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, inView, reduce]);

  // Цифра в центре. base — «честное» значение: во время самотеста идёт за стрелкой (0 → пик → значение),
  // потом плавно досчитывается при смене правила. В покое цифра синхронна с «дыханием» стрелки:
  // стрелка чуть дальше — +1, в центре — значение, чуть ближе — −1 (liveStep единиц, 0 — не колебать).
  // После SETTLE_TICKS тиков «дыхание» затухает за 1.5 с — стрелка замирает, цифра останавливается на значении.
  // Пишем текст прямо в DOM: без перерисовки всего прибора на каждом кадре.
  const base = useMotionValue(reduce ? readoutValue : 0);
  const numRef = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  formatRef.current = format;
  const offset = useRef(0);
  const settledAt = useRef<number | null>(null);
  const SETTLE_TICKS = 3;
  const ticks = useRef(0);
  const lastTick = useRef(0);
  const decayStart = useRef<number | null>(null);
  function wake() { ticks.current = 0; lastTick.current = 0; decayStart.current = null; }
  const paint = () => {
    const el = numRef.current;
    if (!el) return;
    const txt = formatRef.current(base.get() + offset.current);
    if (el.textContent !== txt) el.textContent = txt;
  };
  useMotionValueEvent(base, "change", paint);
  const [initialText] = useState(() => format(reduce ? readoutValue : 0));

  useAnimationFrame((t) => {
    if (reduce || !inView) return;
    const now = performance.now();
    let gain = 1;
    if (decayStart.current !== null) {
      const k = Math.min(1, (now - decayStart.current) / 1500);
      gain = 1 - k * k * (3 - 2 * k); // плавное затухание (smoothstep)
    }
    breath.set(gain * (0.35 * Math.sin(t / 900) + 0.18 * Math.sin(t / 310)));
    if (testing.current || settledAt.current === null) { offset.current = 0; return; }
    // Порог 0.3 % — примерно половина размаха «дыхания»: цифра меняется ровно тогда, когда стрелка отходит от центра.
    const tick = Math.max(-1, Math.min(1, Math.round(breath.get() / 0.3)));
    if (tick !== lastTick.current) { if (tick !== 0) ticks.current += 1; lastTick.current = tick; }
    if (ticks.current >= SETTLE_TICKS && decayStart.current === null) decayStart.current = now;
    offset.current = liveStep ? liveStep * tick : 0;
    paint();
  });

  // Сколько шкалы «зажжено» — идёт за стрелкой (обновляем состояние только при смене целого процента)
  const [lit, setLit] = useState(reduce ? percent : 0);
  useMotionValueEvent(pos, "change", (v) => {
    const r = Math.round(Math.max(0, Math.min(100, v)));
    setLit((prev) => (prev === r ? prev : r));
    if (testing.current) base.set((readoutValue * Math.min(100, Math.max(0, v))) / percent);
  });

  // Досчёт при смене правила (после самотеста)
  useEffect(() => {
    if (reduce) { base.jump(readoutValue); paint(); return; }
    if (testing.current || !tested.current) return;
    const c = animate(base, readoutValue, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
    // base и paint стабильны (motion value и функция, пишущая в DOM) — перезапуск нужен только при смене значения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readoutValue, reduce]);

  const zone = kind !== "progress";
  const tone = TONE[kind];

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[620px]">
      <div className="relative aspect-square [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent),linear-gradient(to_bottom,transparent,#000_6%,#000_94%,transparent)]">
        <Image src="/media/prop/img-02-dark.webp" alt="" fill unoptimized sizes="(min-width:1024px) 620px, 100vw" className="object-cover [[data-theme=light]_&]:hidden" />
        <Image src="/media/prop/img-02-light.webp" alt="" fill unoptimized sizes="(min-width:1024px) 620px, 100vw" className="hidden object-cover [[data-theme=light]_&]:block" />
      </div>

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.35" dy="0.7" stdDeviation="0.55" floodColor="#000" floodOpacity="0.45" />
          </filter>
          <linearGradient id="gauge-brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E3C58E" /><stop offset="0.55" stopColor="#B08D57" /><stop offset="1" stopColor="#7A5E36" />
          </linearGradient>
        </defs>

        {/* Тонкое внутреннее кольцо и подложка дуги */}
        <circle cx={C} cy={C} r={R_INNER} fill="none" stroke="rgb(var(--lp-text))" strokeOpacity="0.07" strokeWidth="0.25" />
        <path d={arc(0, 100, R_FILL)} fill="none" stroke="rgb(var(--lp-text))" strokeOpacity="0.07" strokeWidth="1" strokeLinecap="round" />

        {/* Зона предупреждения: штриховка + кромка (для лимитов, не для цели) */}
        <g className={`transition-opacity duration-500 ${zone ? "opacity-100" : "opacity-0"}`}>
          {HATCH.map((h, i) => (
            <line key={i} x1={h.a[0]} y1={h.a[1]} x2={h.b[0]} y2={h.b[1]} stroke="rgb(var(--lp-warning))" strokeOpacity="0.45" strokeWidth="0.3" />
          ))}
          <path d={arc(WARN_FROM, 100, R_ZONE)} fill="none" stroke="rgb(var(--lp-warning))" strokeOpacity="0.8" strokeWidth="0.4" />
        </g>

        {/* Риски: «загораются» вслед за стрелкой */}
        {TICKS.map((k) => {
          const on = k.p <= lit;
          const warn = zone && k.p >= WARN_FROM;
          return (
            <line key={k.p} x1={k.x0} y1={k.y0} x2={k.x1} y2={k.y1} strokeLinecap="round"
              stroke={warn ? "rgb(var(--lp-warning))" : on ? tone : "rgb(var(--lp-text))"}
              strokeOpacity={on ? 1 : k.size === "major" ? 0.55 : 0.28}
              strokeWidth={k.size === "major" ? 0.55 : k.size === "mid" ? 0.4 : 0.28} />
          );
        })}

        {/* Цифры шкалы */}
        {LABELS.map(({ p, xy }) => (
          <text key={p} x={xy[0]} y={xy[1]} textAnchor="middle" dominantBaseline="central" fontSize="2.6"
            fill="rgb(var(--lp-text))" fillOpacity={p <= lit ? 0.9 : 0.45} className="font-display tabular-nums">
            {p}
          </text>
        ))}

        {/* Метка конца шкалы: «пол» / «цель» */}
        <text x={MK_X} y={MK_Y} textAnchor="middle" dominantBaseline="central" fontSize="2.2" fontWeight={600}
          fill={zone ? "rgb(var(--lp-warning))" : "rgb(var(--lp-accent))"} className="font-sans uppercase tracking-[0.08em]">
          {marker}
        </text>

        {/* Дуга заполнения: край ровно там же, где стрелка, включая её «дыхание» */}
        <motion.path d={arc(0, 100, R_FILL)} fill="none" stroke={tone} strokeWidth="1" strokeLinecap="round"
          pathLength={100} style={{ strokeDasharray: fillDash }} strokeOpacity={kind === "ok" ? 0.55 : 0.95} />

        {/* Стрелка: нарисована вправо (0°), противовес сзади, кончик цветом статуса */}
        <motion.g style={{ rotate: needle, transformOrigin: "50px 50px", transformBox: "view-box" }} filter="url(#gauge-shadow)">
          <path d={`M${C - 7},${C - 1.1} L${C},${C - 0.7} L${C + R_TICK - 4.5},${C - 0.14} L${C + R_TICK - 4.5},${C + 0.14} L${C},${C + 0.7} L${C - 7},${C + 1.1} Z`}
            fill="rgb(var(--lp-text))" />
          <path d={`M${C + R_TICK - 11},${C - 0.36} L${C + R_TICK - 4.5},${C - 0.14} L${C + R_TICK - 4.5},${C + 0.14} L${C + R_TICK - 11},${C + 0.36} Z`}
            fill={tone} className="transition-[fill] duration-500" />
          <circle cx={C - 6.2} cy={C} r="1.5" fill="rgb(var(--lp-text))" />
        </motion.g>

        {/* Ступица: латунь + винт */}
        <circle cx={C} cy={C} r="3.1" fill="url(#gauge-brass)" filter="url(#gauge-shadow)" />
        <circle cx={C} cy={C} r="2.1" fill="rgb(var(--lp-raised))" stroke="#6E5433" strokeWidth="0.2" />
        <line x1={C - 1.2} y1={C - 0.6} x2={C + 1.2} y2={C + 0.6} stroke="#B08D57" strokeWidth="0.35" strokeLinecap="round" />
      </svg>

      {/* Показания в центре (в % блока показаний = круг 16,35–83,65 %). Сверху — счёт и подпись показания
          (между «25» и «75» места хватает на любом размере); ось стрелки кончается на ~55 % → сумма с 56 %;
          вердикт — между «0» и «100». */}
      <div className="pointer-events-none absolute inset-[16.35%] text-center [container-type:size]" aria-hidden>
        <div className="absolute inset-x-0 top-[20%] flex flex-col items-center gap-[1.4cqw]">
          <span className="text-[max(9px,3.1cqw)] leading-none text-lp-muted">{account}</span>
          <span className="max-w-[60%] text-balance text-[max(10px,3.5cqw)] leading-tight text-lp-text-2">{caption}</span>
        </div>
        <div className="absolute inset-x-0 top-[56%] flex flex-col items-center">
          <span ref={numRef} className="font-display text-[12.5cqw] font-medium leading-none tracking-[-0.04em] text-lp-text tabular-nums">{initialText}</span>
          <span className={`mt-[4.5cqw] text-[max(9px,3cqw)] font-semibold leading-none tracking-[0.06em] transition-colors duration-500 ${TONE_TEXT[kind]}`}>{verdict}</span>
        </div>
      </div>
    </div>
  );
}
