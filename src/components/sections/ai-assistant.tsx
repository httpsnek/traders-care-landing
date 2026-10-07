"use client";

import { Fragment, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/container";
import { DAYS, MAX_PER_DAY, SUBSETS, TRADES } from "./ai-trades";

// Блок 6 «ИИ-ассистент» — редакционная подача, как разворот делового издания:
// без карточек и «окна чата». Вопрос трейдера — заголовок разворота, ответ — лид со сносками,
// под ним на всю ширину график-иллюстрация: 214 сделок журнала (квадратик — сделка, столбец — торговый день).
// Сноска окрашивает сделки, из которых посчитано число; остальные — нейтральные. По умолчанию активна сноска 1.

const STEP = 10, STEP_Y = 10, SIZE = 8, RX = 1.8; // квадратики со скруглением, как в графике активности GitHub
const H = MAX_PER_DAY * STEP_Y + 2;
const MONTH_AT = [0, 22, 43]; // первые торговые дни июля, августа, сентября

/** Разряды и «число %» не переносятся: «$6 520», «61 %». */
const nb = (s: string) => s.replace(/(\d) (?=\d|%)/g, "$1 ");

/** Слова через дефис («проп-фирмы») не разрываются переносом. */
const keepHyphen = (s: string) =>
  s.split(/(\S+-\S+)/).map((p, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{p}</span> : p));

/** «**61 %** … [1]» → текст с числами дисплейным шрифтом и сносками. Сноска склеена с предыдущим словом. */
function Answer({ text, active, onRef }: { text: string; active: number; onRef: (n: number) => void }) {
  const out: React.ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*|\[\d\])/).forEach((part, k) => {
    if (!part) return;
    if (part.startsWith("**")) {
      out.push(<strong key={k} className="font-display font-medium tracking-[-0.01em] text-lp-text">{nb(part.slice(2, -2))}</strong>);
      return;
    }
    const m = part.match(/^\[(\d)\]$/);
    if (!m) { out.push(nb(part)); return; }
    const n = +m[1] - 1;
    const mark = (
      <button key={`b${k}`} type="button" aria-pressed={active === n} aria-label={`[${n + 1}]`}
        onMouseEnter={() => onRef(n)} onFocus={() => onRef(n)} onClick={() => onRef(n)}
        className={`relative -top-[0.55em] ml-[2px] rounded-[4px] before:absolute before:content-[''] before:-inset-[12px] px-[4px] py-[1px] font-mono text-[12px] leading-none transition-colors duration-200 ${active === n ? "bg-lp-accent text-lp-on-accent" : "text-lp-accent hover:bg-lp-accent/15"}`}>
        {n + 1}
      </button>
    );
    const prev = out.pop();
    if (typeof prev === "string") {
      const [, head, word] = prev.match(/^([\s\S]*?)(\S*)$/)!;
      if (head) out.push(head);
      out.push(<span key={`w${k}`} className="whitespace-nowrap">{word}{mark}</span>);
    } else {
      out.push(<span key={`w${k}`} className="whitespace-nowrap">{prev}{mark}</span>);
    }
  });
  return <>{out.map((node, i) => (typeof node === "string" ? <Fragment key={`t${i}`}>{node}</Fragment> : node))}</>;
}

/** График за дни [from, to): точки-сделки над базовой линией, месяцы подписаны HTML (чтобы шрифт не масштабировался). */
function Field({ from, to, lit, months, className = "", cols, title }: {
  from: number; to: number; lit: Set<number>; months: string[]; className?: string;
  cols?: number;    // ширина в днях: одинаковая у всех «этажей» → квадратики одного размера
  title?: string;   // «этаж» одного месяца (телефон): подпись месяца сверху, без оси и полосы месяца
}) {
  const w = (cols ?? to - from) * STEP;
  return (
    <div className={className}>
      {title && <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-lp-muted">{title}</div>}
      <svg viewBox={`0 0 ${w} ${H}`} className="block w-full" aria-hidden>
        {/* Август — едва заметной полосой: месяцы читаются без лишних линий */}
        {!title && MONTH_AT[1] < to && MONTH_AT[2] > from && (
          <rect x={(Math.max(MONTH_AT[1], from) - from) * STEP} y={0} width={(Math.min(MONTH_AT[2], to) - Math.max(MONTH_AT[1], from)) * STEP} height={H}
            rx={3} fill="rgb(var(--lp-text) / 0.03)" />
        )}
        {TRADES.filter((tr) => tr.day >= from && tr.day < to).map((tr) => {
          const on = lit.has(tr.i);
          return (
            <rect key={tr.i} x={(tr.day - from) * STEP + (STEP - SIZE) / 2} y={H - 2 - (tr.slot + 1) * STEP_Y + (STEP_Y - SIZE) / 2}
              width={SIZE} height={SIZE} rx={RX}
              // Появление: колонка за колонкой (день за днём) снизу вверх, когда поле попало в кадр (Reveal выше).
              className="translate-y-[6px] opacity-0 [transform-box:fill-box] group-data-[seen]/rv:translate-y-0 group-data-[seen]/rv:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100"
              style={{
                fill: on ? (tr.win ? "rgb(var(--lp-profit))" : "rgb(var(--lp-loss))") : "rgb(var(--lp-text) / 0.075)",
                transition: `fill 320ms var(--lp-ease), opacity 420ms var(--lp-ease) ${(tr.day - from) * 12 + tr.slot * 35}ms, transform 520ms var(--lp-ease) ${(tr.day - from) * 12 + tr.slot * 35}ms`,
              }} />
          );
        })}
      </svg>
      {title && <div className="mt-1.5 h-px bg-lp-text/20" style={{ width: `${((to - from) / (cols ?? to - from)) * 100}%` }} />}
      {!title && (
        <div className="relative mt-2 h-5 border-t border-lp-text/25 text-[12px] text-lp-muted">
          {MONTH_AT.map((d, k) => (d >= from && d < to ? (
            <span key={d} className="absolute top-1.5" style={{ left: `${((d - from) / (to - from)) * 100}%` }}>
              <span className="absolute -top-[7px] left-0 h-[5px] w-px bg-lp-text/25" />{months[k]}
            </span>
          ) : null))}
        </div>
      )}
    </div>
  );
}

export function AiAssistant({ t }: { t: Dictionary["ai"] }) {
  const [q, setQ] = useState(0);
  const [ref, setRef] = useState(0);
  const qa = t.qa[q];
  const lit = SUBSETS[q][ref];
  const ask = (i: number) => { setQ(i); setRef(0); };

  const more = (
    <nav aria-label={t.listLabel}>
      <div className="text-lp-small text-lp-muted">{t.more}</div>
      <ul className="mt-4 flex flex-col gap-4">
        {t.qa.map((item, i) => (i === q ? null : (
          <li key={item.q}>
            <button type="button" onClick={() => ask(i)}
              className="relative text-left text-[16px] leading-snug text-lp-text-2 before:absolute before:content-[''] before:-inset-y-3 before:inset-x-0 underline decoration-lp-text/20 underline-offset-[5px] transition-colors duration-200 hover:text-lp-text hover:decoration-lp-accent">
              {item.q}
            </button>
          </li>
        )))}
      </ul>
    </nav>
  );

  return (
    <section id="ai" aria-labelledby="ai-title" className="py-section-sm lg:py-section">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
          <h2 id="ai-title" className="text-lp-h2 text-lp-text lg:col-span-6">{t.title}</h2>
          <p className="max-w-[46ch] text-lp-lead text-lp-text-2 lg:col-span-5 lg:col-start-8">{t.lead}</p>
        </div>

        <div className="mt-12 border-t border-lp-line pt-10 lg:mt-16 lg:pt-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            {/* Вопрос — заголовок разворота, ответ — лид */}
            <div key={q} className="phone-swap min-w-0 lg:col-span-8" aria-live="polite">
              <p className="font-display text-[clamp(30px,3.4vw,48px)] font-medium leading-[1.08] tracking-[-0.03em] text-lp-text">
                {t.quote[0]}{keepHyphen(qa.q)}{t.quote[1]}
              </p>
              <p className="mt-7 max-w-[62ch] text-[18px] leading-[1.7] text-lp-text-2 lg:text-[20px]">
                <Answer text={qa.a} active={ref} onRef={setRef} />
              </p>
            </div>

            {/* Другие вопросы — просто текстом (на телефоне — под сносками, чтобы не отрывать график от ответа) */}
            <div className="hidden min-w-0 lg:col-span-3 lg:col-start-10 lg:block lg:pt-3">{more}</div>
          </div>

          {/* График-иллюстрация на всю ширину */}
          <Reveal as="figure" amount={0.35} className="mt-12 lg:mt-16" aria-label={t.fieldLabel}>
            {/* Что сейчас подсвечено — подпись активной сноски прямо над графиком */}
            <div key={`${q}-${ref}`} className="phone-swap mb-4 flex items-center gap-2.5 text-[14px] text-lp-text">
              <span className="inline-flex size-[20px] items-center justify-center rounded-[5px] bg-lp-accent font-mono text-[12px] text-lp-on-accent">{ref + 1}</span>
              {qa.notes[ref]}
            </div>
            <Field from={0} to={DAYS} lit={lit} months={t.months} className="hidden sm:block" />
            {/* Телефон: три «этажа» — по месяцу на строку, одинаковый размер квадратиков (cols = самый длинный месяц) */}
            <div className="grid gap-5 sm:hidden">
              {MONTH_AT.map((d, k) => {
                const end = MONTH_AT[k + 1] ?? DAYS;
                const cols = Math.max(...MONTH_AT.map((m, j) => (MONTH_AT[j + 1] ?? DAYS) - m));
                return <Field key={d} from={d} to={end} cols={cols} title={t.months[k]} lit={lit} months={t.months} />;
              })}
            </div>
            <figcaption className="mt-4 flex flex-col gap-3 text-[13px] leading-relaxed text-lp-muted sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <span className="max-w-[80ch]">{t.source}</span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="size-[9px] rounded-[2px] bg-lp-profit" />{t.win}</span>
                <span className="flex items-center gap-1.5"><span className="size-[9px] rounded-[2px] bg-lp-loss" />{t.loss}</span>
              </span>
            </figcaption>
          </Reveal>

          {/* Сноски — как в печатном тексте, под тонкой линией */}
          <ol className="mt-10 grid gap-x-8 gap-y-1 border-t border-lp-line pt-5 sm:grid-cols-3">
            {qa.notes.map((note, n) => (
              <li key={note}>
                <button type="button" aria-pressed={ref === n}
                  onMouseEnter={() => setRef(n)} onFocus={() => setRef(n)} onClick={() => setRef(n)}
                  className={`flex w-full items-baseline gap-2.5 py-1.5 text-left text-[14px] leading-snug transition-colors duration-200 ${ref === n ? "text-lp-text" : "text-lp-text-2 hover:text-lp-text"}`}>
                  <span className={`font-mono text-[12px] ${ref === n ? "text-lp-accent" : "text-lp-muted"}`}>{n + 1}</span>{note}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-10 lg:hidden">{more}</div>
          <p className="mt-8 text-lp-small text-lp-muted">{t.note}</p>
        </div>
      </Container>
    </section>
  );
}
