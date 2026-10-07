import { Check, Lock } from "lucide-react";
import type { Dictionary } from "@/i18n";
import { CountUp } from "@/components/ui/reveal";
import type { makeFormat } from "@/lib/format";

// Экраны блока «Продукт». Всё — HTML/SVG, не картинки:
// чёткие на любом экране, переводятся, весят ничего. Данные — демо, согласованы между экранами.

type T = Dictionary["product"];
type F = ReturnType<typeof makeFormat>;

/** Подпись поля мелким приглушённым текстом. */
const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] text-lp-muted">{children}</div>
);

// 1. Журнал — карточка сделки XAUUSD Long. 4 031.40 → 4 047.90 × 0.50 лота (50 oz) = +$825, риск $344 → +2.4R.
export function JournalScreen({ t, f }: { t: T; f: F }) {
  const j = t.journal;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[26px] font-semibold tracking-[-0.02em] text-lp-text">XAUUSD</span>
            <span className="text-[14px] text-lp-text-2">Long</span>
          </div>
          <div className="mt-1 text-[13px] text-lp-muted">{j.date}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-[26px] font-medium tracking-[-0.02em] text-lp-profit tabular-nums">+2.4R</div>
          <div className="mt-1 text-[13px] text-lp-profit tabular-nums">{f.usd(825)}</div>
        </div>
      </div>

      {/* Данные брокера: не редактируются. */}
      <div className="relative mt-6 rounded-control border border-lp-line">
        <div className="grid grid-cols-3 divide-x divide-lp-line">
          {[[j.entry, f.price(4031.4)], [j.exit, f.price(4047.9)], [j.volume, `${f.price(0.5)} ${j.lot}`]].map(([k, v]) => (
            <div key={k} className="px-4 py-3">
              <Label>{k}</Label>
              <div className="mt-1 font-mono text-[14px] text-lp-text tabular-nums">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-lp-line px-4 py-2.5 text-[12px] text-lp-text-2">
          <Lock size={13} strokeWidth={2} aria-hidden />{j.broker}
        </div>
      </div>

      <div className="mt-6 text-[12px] font-medium tracking-[0.04em] text-lp-muted">{j.yours}</div>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <dt><Label>{j.setup}</Label></dt>
          <dd className="mt-1 text-[14px] text-lp-text">London reversal</dd>
        </div>
        <div>
          <dt><Label>{j.mistakes}</Label></dt>
          <dd className="mt-1 flex items-center gap-2 text-[14px] text-lp-text">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-lp-loss" />{j.mistake}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt><Label>{j.note}</Label></dt>
          <dd className="mt-1 text-[14px] leading-relaxed text-lp-text-2">{j.noteText}</dd>
        </div>
      </dl>
    </div>
  );
}

// 2. Статистика — сессии + Care Score. Азия: 4 сделки → приглушена. Сумма весов 30+30+25+15 = 100, баллы 24+26+17+11 = 78.
const SESSIONS = [
  { trades: 4, win: 50, pnl: 120 },
  { trades: 38, win: 58, pnl: 2910 },
  { trades: 27, win: 44, pnl: -640 },
];
const SCORE = [{ w: 30, v: 24 }, { w: 30, v: 26 }, { w: 25, v: 17 }, { w: 15, v: 11 }];

export function StatsScreen({ t, f }: { t: T; f: F }) {
  const s = t.stats;
  const total = SCORE.reduce((a, p) => a + p.v, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="text-[14px] font-medium text-lp-text">{s.title}</div>
      <table className="mt-4 w-full text-left text-[14px] tabular-nums">
        <thead>
          <tr className="border-b border-lp-line text-[12px] text-lp-muted">
            {s.cols.map((c, i) => <th key={c} scope="col" className={`pb-2 font-normal ${i ? "text-right" : ""}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {SESSIONS.map((r, i) => {
            const few = r.trades < 5;
            return (
              <tr key={i} className={`border-b border-lp-line ${few ? "text-lp-muted" : "text-lp-text"}`}>
                <th scope="row" className="py-3 font-normal">
                  {s.rows[i]}
                  {few && <span className="ml-2 text-[12px] text-lp-muted">· {s.few}</span>}
                </th>
                <td className="py-3 text-right">{r.trades}</td>
                <td className="py-3 text-right">{f.pct(r.win)}</td>
                <td className={`py-3 text-right ${few ? "" : r.pnl < 0 ? "text-lp-loss" : "text-lp-profit"}`}>{f.usd(r.pnl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Care Score: одна полоса, ширина сегмента = вес, заливка = набранные баллы. */}
      <div className="mt-auto pt-8">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-medium text-lp-text">Care Score</span>
          <span className="font-display text-[26px] font-medium tracking-[-0.02em] text-lp-text tabular-nums">
            <CountUp to={total} start format={(n) => String(Math.round(n))} duration={1.1} delay={0.25} /><span className="text-[15px] text-lp-muted"> / 100</span>
          </span>
        </div>
        <div className="mt-3 flex gap-[3px]">
          {SCORE.map((p, i) => (
            <div key={i} style={{ flexGrow: p.w }} className="basis-0">
              <div className="h-[6px] overflow-hidden rounded-full bg-lp-text/10">
                <div data-grow className="h-full rounded-full bg-lp-accent" style={{ width: `${(p.v / p.w) * 100}%`, animationDelay: `${260 + i * 90}ms` }} />
              </div>
              <div className="mt-2 truncate text-[12px] text-lp-muted">{s.parts[i]}</div>
              <div className="text-[12px] text-lp-text-2 tabular-nums">{p.v}/{p.w}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Торговая система — сетап London reversal. 38 сделок по системе (+$3 940) и 15 вне (−$1 210) → adherence 38/53 ≈ 71 %.
// Набросок входа: цена в диапазоне Азии, пробивает максимум, возвращается, вход на закрытии свечи внутри.
const PATH = [[8, 78], [34, 70], [58, 82], [84, 66], [108, 74], [132, 62], [150, 30], [164, 44], [178, 58], [196, 76], [222, 96], [240, 104]];
const LEVEL_Y = 52;

export function SystemScreen({ t, f }: { t: T; f: F }) {
  const s = t.system;
  return (
    <div className="grid h-full gap-8 sm:grid-cols-[1.25fr_1fr]">
      <div className="flex flex-col">
        <div className="text-[14px] font-medium text-lp-text">London reversal</div>
        <figure className="mt-4">
          <svg viewBox="0 0 248 120" className="w-full overflow-visible" role="img" aria-label={s.sketch}>
            <line x1="0" x2="248" y1={LEVEL_Y} y2={LEVEL_Y} stroke="rgb(var(--lp-text))" strokeOpacity="0.35" strokeDasharray="3 3" />
            <text x="0" y={LEVEL_Y - 5} fontSize="7.5" fill="rgb(var(--lp-muted))">{s.level}</text>
            <polyline points={PATH.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgb(var(--lp-text))" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="178" cy="58" r="4" fill="rgb(var(--lp-accent))" />
            <text x="186" y="55" fontSize="7.5" fill="rgb(var(--lp-accent))">{s.entry}</text>
          </svg>
        </figure>
        <div className="mt-6 text-[12px] text-lp-muted">{s.rulesLabel}</div>
        <ul className="mt-2 grid gap-2 text-[14px] text-lp-text">
          {s.rules.map((r) => (
            <li key={r} className="flex items-center gap-2.5">
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-lp-line text-lp-accent">
                <Check size={11} strokeWidth={2.5} aria-hidden />
              </span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-between gap-6 sm:border-l sm:border-lp-line sm:pl-8">
        <div>
          <div className="text-[12px] text-lp-muted">Adherence</div>
          <div className="mt-1 font-display text-[44px] font-medium leading-none tracking-[-0.04em] text-lp-text tabular-nums">{f.pct(71)}</div>
          <div className="mt-3 h-[6px] overflow-hidden rounded-full bg-lp-text/10">
            <div className="h-full w-[71%] rounded-full bg-lp-accent" />
          </div>
        </div>
        <dl className="grid gap-4">
          <div>
            <dt className="text-[12px] text-lp-muted">{s.bySystem} · 38 {s.trades}</dt>
            <dd className="mt-1 font-display text-[24px] font-medium tracking-[-0.02em] text-lp-profit tabular-nums">{f.usd(3940)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-lp-muted">{s.offSystem} · 15 {s.trades}</dt>
            <dd className="mt-1 font-display text-[24px] font-medium tracking-[-0.02em] text-lp-loss tabular-nums">{f.usd(-1210)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// 4. Разборы — неделя 38. 420 − 310 + 880 + 150 − 95 = +1 045.
const WEEK = [420, -310, 880, 150, -95];

export function ReviewScreen({ t, f }: { t: T; f: F }) {
  const r = t.review;
  const total = WEEK.reduce((a, b) => a + b, 0);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[14px] font-medium text-lp-text">{r.title}</span>
        <span className="text-[13px] text-lp-muted">{r.period}</span>
      </div>
      <ol className="mt-4 grid grid-cols-5 divide-x divide-lp-line rounded-control border border-lp-line">
        {WEEK.map((v, i) => (
          <li key={i} className="flex min-w-0 flex-col gap-2 p-3">
            <span className="text-[12px] text-lp-muted">{r.days[i]}</span>
            <span className={`text-[15px] font-medium tabular-nums ${v < 0 ? "text-lp-loss" : "text-lp-profit"}`}>{f.usd(v)}</span>
            <span className="text-[12px] leading-snug text-lp-text-2">{r.notes[i]}</span>
          </li>
        ))}
      </ol>
      {/* Выводы пишет трейдер; 310 + 95 = 405 — те самые два отступления из колонок. */}
      <div className="mt-6">
        <div className="text-[12px] text-lp-muted">{r.conclusions}</div>
        <p className="mt-2 max-w-[62ch] border-l-2 border-lp-line pl-4 text-[14px] leading-relaxed text-lp-text-2">{r.conclusionsText}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-8">
        <div>
          <div className="text-[12px] text-lp-muted">{r.total}</div>
          <div className="mt-1 font-display text-[32px] font-medium leading-none tracking-[-0.03em] text-lp-profit tabular-nums">{f.usd(total)}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Кнопка — часть картинки интерфейса, не действие на лендинге. */}
          <span aria-hidden className="inline-flex h-10 items-center rounded-control bg-lp-accent px-4 text-[14px] font-medium text-lp-on-accent">{r.finish}</span>
          <span className="flex items-center gap-1.5 text-[12px] text-lp-muted"><Lock size={12} strokeWidth={2} aria-hidden />{r.locked}</span>
        </div>
      </div>
    </div>
  );
}

// 0. План до входа — XAUUSD Long: вход 4 031.40, стоп 4 024.50 (−6.90), цель 4 052.10 (+20.70) → R:R 1 : 3.
const LEVELS = { target: 4052.1, entry: 4031.4, stop: 4024.5 };

export function PlanScreen({ t, f }: { t: T; f: F }) {
  const p = t.plan;
  const lo = LEVELS.stop - 3, hi = LEVELS.target + 3, H = 150;
  const y = (v: number) => +((1 - (v - lo) / (hi - lo)) * H).toFixed(1);
  const rows = [
    { k: p.target, v: LEVELS.target, c: "rgb(var(--lp-profit))" },
    { k: p.entry, v: LEVELS.entry, c: "rgb(var(--lp-accent))" },
    { k: p.stop, v: LEVELS.stop, c: "rgb(var(--lp-loss))" },
  ];
  return (
    <div className="grid h-full gap-8 sm:grid-cols-[1.2fr_1fr]">
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[22px] font-semibold tracking-[-0.02em] text-lp-text">XAUUSD</span>
            <span className="text-[14px] text-lp-text-2">Long</span>
          </div>
          <span className="whitespace-nowrap rounded-full border border-lp-line px-2.5 py-1 text-[12px] text-lp-text-2">{p.status}</span>
        </div>
        <div className="mt-5"><Label>{p.idea} · London reversal</Label></div>
        <p className="mt-1 text-[14px] leading-relaxed text-lp-text">{p.ideaText}</p>
        {/* Уровни на ценовой шкале: зона риска и зона цели */}
        <svg viewBox={`0 0 300 ${H}`} className="mt-5 w-full overflow-visible" aria-hidden>
          <rect x="0" y={y(LEVELS.target)} width="300" height={y(LEVELS.entry) - y(LEVELS.target)} fill="rgb(var(--lp-profit) / 0.08)" />
          <rect x="0" y={y(LEVELS.entry)} width="300" height={y(LEVELS.stop) - y(LEVELS.entry)} fill="rgb(var(--lp-loss) / 0.1)" />
          {rows.map((r) => (
            <g key={r.k}>
              <line x1="0" x2="300" y1={y(r.v)} y2={y(r.v)} stroke={r.c} strokeWidth="1.4" strokeDasharray={r.k === p.entry ? undefined : "4 3"} />
              <text x="4" y={y(r.v) - 5} fontSize="10" fill={r.c}>{r.k}</text>
              <text x="296" y={y(r.v) - 5} fontSize="10" textAnchor="end" fill="rgb(var(--lp-text-2))" fontFamily="var(--lp-font-mono)">{f.price(r.v)}</text>
            </g>
          ))}
        </svg>
        <div className="mt-3 text-[13px] text-lp-text-2">{p.rr}</div>
      </div>
      <div className="flex flex-col sm:border-l sm:border-lp-line sm:pl-8">
        <Label>{p.checklist}</Label>
        <ul className="mt-3 grid gap-2.5 text-[14px]">
          {p.checks.map((c, i) => {
            const ok = i < 3;
            return (
              <li key={c} className={`flex items-center gap-2.5 ${ok ? "text-lp-text" : "text-lp-muted"}`}>
                <span className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${ok ? "border-lp-accent bg-lp-accent text-lp-on-accent" : "border-lp-line"}`}>
                  {ok && <Check size={11} strokeWidth={3} aria-hidden />}
                </span>
                {c}
              </li>
            );
          })}
        </ul>
        <span aria-hidden className="mt-auto inline-flex h-10 items-center justify-center rounded-control bg-lp-accent px-4 text-[14px] font-medium text-lp-on-accent">{p.toTrade}</span>
      </div>
    </div>
  );
}

// 3. Ошибки с ценой — 6 месяцев. 13 + 11 + 4 + 3 = 31 раз; 1 870 + 1 390 + 1 040 + 760 = 5 060.
const MISTAKES = [
  { n: 13, usd: 1870, trend: [4, 3, 2, 2, 1, 1] },
  { n: 11, usd: 1390, trend: [1, 2, 3, 2, 2, 1] },
  { n: 4, usd: 1040, trend: [0, 1, 1, 0, 1, 1] },
  { n: 3, usd: 760, trend: [2, 0, 1, 0, 0, 0] },
];

export function MistakesScreen({ t, f }: { t: T; f: F }) {
  const m = t.mistakes;
  const max = Math.max(...MISTAKES.map((x) => x.usd));
  const spark = (v: number[]) => v.map((n, i) => `${i ? "L" : "M"}${i * 12},${16 - n * 3.5}`).join("");
  return (
    <div className="flex h-full flex-col">
      <div className="text-[14px] font-medium text-lp-text">{m.title}</div>
      <table className="mt-4 w-full text-left text-[14px] tabular-nums">
        <thead>
          <tr className="border-b border-lp-line text-[12px] text-lp-muted">
            {m.cols.map((c, i) => <th key={c} scope="col" className={`pb-2 font-normal ${i === 0 ? "" : "text-right"}`}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {MISTAKES.map((x, i) => (
            <tr key={i} className="border-b border-lp-line">
              <th scope="row" className="py-3 pr-4 font-normal text-lp-text">
                {m.rows[i]}
                <span data-grow className="mt-1.5 block h-[3px] rounded-full bg-lp-loss/70" style={{ width: `${(x.usd / max) * 100}%` }} />
              </th>
              <td className="py-3 text-right text-lp-text-2">{x.n}</td>
              <td className="py-3 text-right text-lp-loss">{f.usd(-x.usd)}</td>
              <td className="py-3 pl-4 text-right">
                <svg viewBox="0 0 60 18" className="ml-auto h-[18px] w-[60px]" aria-hidden>
                  <path d={spark(x.trend)} fill="none" stroke="rgb(var(--lp-text) / 0.6)" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <span className="text-[12px] text-lp-muted">{m.note}</span>
        <span className="text-right">
          <span className="block text-[12px] text-lp-muted">{m.total} · {MISTAKES.reduce((a, x) => a + x.n, 0)}</span>
          <span className="font-display text-[28px] font-medium leading-none tracking-[-0.03em] text-lp-loss tabular-nums">{f.usd(-MISTAKES.reduce((a, x) => a + x.usd, 0))}</span>
        </span>
      </div>
    </div>
  );
}
