import { BatteryFull, RotateCcw, Search, Wifi } from "lucide-react";
import type { Dictionary } from "@/i18n";

// Экран ноутбука на первом экране: macOS-строка меню с «чёлкой» + приложение Traders Care, обзор квартала.
// Свёрстан в пикселях стекла последнего кадра видео (825×534) и натягивается гомографией в hero-laptop.tsx.
export const SCREEN_W = 825, SCREEN_H = 534;
// «Чёлка» в координатах экрана (замерено по кадру): x, ширина, высота; строка меню — её высоты, как в macOS.
export const NOTCH = { x: 362.5, w: 98, h: 16.5 };

// Демо-данные: эквити по неделям квартала, $. «По системе» всегда не ниже факта. Те же, что во всём лендинге.
const FACT = [0, 420, 310, 890, 1240, 980, 1650, 2100, 1880, 2650, 3120, 3700, 4180];
const RULES = [0, 520, 610, 1180, 1690, 1900, 2600, 3150, 3400, 4300, 5050, 5800, 6520];
const OFF = [2, 5, 8, 9, 11];
export const WEEKS = FACT.length - 1;
const GW = 420, GH = 150, MAX = 7000;
const gx = (i: number) => (i / WEEKS) * GW;
const gy = (v: number) => GH - (v / MAX) * GH;
const at = (s: number[], p: number) => { const i = Math.floor(p), f = p - i; return i >= WEEKS ? s[WEEKS] : s[i] + (s[i + 1] - s[i]) * f; };
const upto = (s: number[], p: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= Math.min(Math.floor(p), WEEKS); i++) pts.push(`${i ? "L" : "M"}${gx(i).toFixed(1)},${gy(s[i]).toFixed(1)}`);
  if (p < WEEKS && p % 1) pts.push(`L${gx(p).toFixed(1)},${gy(at(s, p)).toFixed(1)}`);
  return pts.join("");
};
const gapUpto = (p: number) => {
  const n = Math.min(Math.floor(p), WEEKS), idx = Array.from({ length: n + 1 }, (_, i) => i);
  const top = idx.map((i) => `${i ? "L" : "M"}${gx(i).toFixed(1)},${gy(RULES[i]).toFixed(1)}`).join("");
  const tail = p < WEEKS && p % 1 ? `L${gx(p).toFixed(1)},${gy(at(RULES, p)).toFixed(1)}L${gx(p).toFixed(1)},${gy(at(FACT, p)).toFixed(1)}` : "";
  return `${top}${tail}${idx.reverse().map((i) => `L${gx(i).toFixed(1)},${gy(FACT[i]).toFixed(1)}`).join("")}Z`;
};
const money = (n: number, en: boolean) => `−$${en ? Math.round(n).toLocaleString("en-US") : Math.round(n).toLocaleString("ru").replace(/\s/g, " ")}`;
const OFF_MAX = 910; // самая дорогая категория (после 16:00) — полоса во всю ширину. Разбивка = чек в «Как это работает».

const Card = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-[7px] border border-lp-line/80 bg-lp-raised ${className}`}>{children}</div>
);

type T = Dictionary["hero"]["visual"];

/** p — неделя прорисовки (0..WEEKS), done — квартал дорисован, play — повтор. */
export function LaptopScreen({ t, p, onReplay, compact = false }: { t: T; p: number; onReplay: () => void; compact?: boolean }) {
  const en = t.gap.includes(","), s = t.screen, done = p >= WEEKS;
  const fade = `transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`;
  return (
    <div className="relative size-full overflow-hidden rounded-t-[6px] bg-lp-ground text-[9px] leading-none text-lp-text">
      {/* Строка меню macOS и «чёлка» */}
      <div className="relative flex items-center justify-between bg-[#1c1c20] px-[10px] text-[8px] text-white/85 [[data-theme=light]_&]:bg-[#e6e7eb] [[data-theme=light]_&]:text-black/75" style={{ height: NOTCH.h }}>
        <span className="font-semibold text-white [[data-theme=light]_&]:text-black">Traders Care</span>
        <span className="flex items-center gap-[8px]">
          <Search size={8} strokeWidth={2.2} /><Wifi size={9} strokeWidth={2.2} /><BatteryFull size={11} strokeWidth={1.8} />
          <span className="tabular-nums">14:32</span>
        </span>
        <span className="absolute top-0 rounded-b-[5px] bg-black" style={{ left: NOTCH.x, width: NOTCH.w, height: NOTCH.h }} />
      </div>

      {compact ? (
        // Телефон: экран после «наезда» ~360 px шириной — только главное, крупно.
        <div className="flex flex-col px-[40px] pb-[30px] pt-[30px]" style={{ height: SCREEN_H - NOTCH.h }}>
          <div className="flex items-baseline justify-between text-[21px] text-lp-text/66">
            <span className="font-medium text-lp-text/80">{t.period}</span>
            <span className="flex items-center gap-[8px] text-[18px]">{t.demo}
              <button type="button" tabIndex={-1} onClick={onReplay}
                className={`pointer-events-auto rounded-full transition-opacity ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                <RotateCcw size={18} />
              </button>
            </span>
          </div>
          <div className="mt-[22px] font-display text-[104px] font-medium leading-[0.9] tracking-[-0.045em] text-lp-loss tabular-nums">{money(at(RULES, p) - at(FACT, p), en)}</div>
          <div className={`mt-[12px] text-[24px] text-lp-text/70 ${fade}`}>{t.gapCaption}</div>
          <div className="mt-[24px] flex min-h-0 flex-1 flex-col">
            <svg viewBox={`0 0 ${GW} ${GH}`} className="min-h-0 w-full flex-1 overflow-visible" preserveAspectRatio="none">
              <defs>
                <pattern id="scr-hatch-c" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="7" stroke="rgb(var(--lp-loss))" strokeWidth="1.6" strokeOpacity="0.55" />
                </pattern>
              </defs>
              {[0, 2000, 4000, 6000].map((v) => <line key={v} x1="0" x2={GW} y1={gy(v)} y2={gy(v)} stroke="rgb(var(--lp-text))" strokeOpacity="0.08" vectorEffect="non-scaling-stroke" />)}
              {p > 0 && <path d={gapUpto(p)} fill="url(#scr-hatch-c)" />}
              <path d={upto(RULES, p)} fill="none" stroke="rgb(var(--lp-accent))" strokeWidth="3" strokeDasharray="8 6" vectorEffect="non-scaling-stroke" />
              <path d={upto(FACT, p)} fill="none" stroke="rgb(var(--lp-text))" strokeWidth="3.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {OFF.filter((w) => w <= p).map((w) => (
                <line key={w} x1={gx(w)} x2={gx(w)} y1={gy(FACT[w])} y2={gy(RULES[w])} stroke="rgb(var(--lp-loss))" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="hero-mark" />
              ))}
            </svg>
            <div className="mt-[10px] flex justify-between text-[17px] text-lp-text/60">{t.months.map((m) => <span key={m}>{m}</span>)}</div>
          </div>
          <div className={`mt-[18px] grid grid-cols-2 gap-[24px] text-[19px] ${fade}`}>
            <div><div className="flex items-center gap-[8px] text-lp-text/70"><span className="h-[3px] w-[22px] bg-lp-text" />{t.fact}</div><div className="mt-[6px] font-display text-[34px] font-semibold text-lp-profit">{t.factValue}</div></div>
            <div><div className="flex items-center gap-[8px] text-lp-text/70"><span className="w-[22px] border-t-[3px] border-dashed border-lp-accent" />{t.rules}</div><div className="mt-[6px] font-display text-[34px] font-semibold text-lp-profit">{t.rulesValue}</div></div>
          </div>
        </div>
      ) : (
      <div className="flex" style={{ height: SCREEN_H - NOTCH.h }}>
        {/* Боковое меню */}
        <div className="flex w-[128px] shrink-0 flex-col border-r border-lp-line/80 bg-lp-raised/60 px-[8px] py-[12px]">
          <div className="flex items-center gap-[6px] px-[6px]">
            <svg viewBox="0 0 64 64" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="6" aria-hidden className="text-lp-text">
              <path d="M51 17C46.5 11.6 40 8.5 32 8.5C19 8.5 8.5 19 8.5 32C8.5 45 19 55.5 32 55.5C40 55.5 46.5 52.4 51 47" /><path d="M21 24.5H55" /><path d="M38 24.5V44" />
            </svg>
            <span className="font-display text-[10.5px] font-semibold tracking-[-0.01em]">Traders Care</span>
          </div>
          <div className="mt-[16px] flex flex-col gap-[2px]">
            {s.nav.map((n, i) => (
              <span key={n} className={`rounded-[5px] px-[6px] py-[5.5px] ${i === 0 ? "bg-lp-text/[0.07] text-lp-text" : "text-lp-text/66"}`}>{n}</span>
            ))}
          </div>
          <div className="mt-auto rounded-[6px] border border-lp-line/80 px-[7px] py-[7px]">
            <div className="text-[8.5px] font-medium">{s.account}</div>
            <div className="mt-[5px] flex items-center gap-[4px] text-[7.5px] text-lp-text/62"><span className="size-[4px] shrink-0 rounded-full bg-lp-profit" /><span className="truncate">{s.synced}</span></div>
          </div>
        </div>

        {/* Обзор квартала */}
        <div className="flex min-w-0 flex-1 flex-col gap-[9px] px-[14px] py-[12px]">
          <div className="flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold tracking-[-0.01em]">{t.period}</span>
            <span className="flex items-center gap-[8px]">
              <span className="flex items-center gap-[4px] text-[8px] text-lp-text/60">{t.demo}
                <button type="button" tabIndex={-1} onClick={onReplay}
                  className={`pointer-events-auto rounded-full transition-opacity hover:text-lp-text ${done ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                  <RotateCcw size={9} />
                </button>
              </span>
              <span className="flex rounded-[5px] border border-lp-line/80 p-[2px] text-[8px]">
                {s.range.map((r, i) => <span key={r} className={`rounded-[3.5px] px-[6px] py-[3.5px] ${i === 1 ? "bg-lp-text/10 text-lp-text" : "text-lp-text/62"}`}>{r}</span>)}
              </span>
            </span>
          </div>

          {/* Показатели */}
          <div className="grid grid-cols-4 gap-[8px]">
            {[
              [s.result, t.factValue, "text-lp-profit"],
              [s.cost, money(at(RULES, p) - at(FACT, p), en), "text-lp-loss"],
              [s.trades, s.tradesValue, ""],
              [s.adherence, s.adherenceValue, ""],
            ].map(([label, value, cls], i) => (
              <Card key={label} className={`px-[9px] py-[8px] ${i === 1 ? "border-lp-loss/40" : ""}`}>
                <div className="text-[8px] text-lp-text/62">{label}</div>
                <div className={`mt-[6px] font-display text-[17px] font-semibold tracking-[-0.02em] tabular-nums ${cls}`}>{value}</div>
              </Card>
            ))}
          </div>

          {/* График и разбор отступлений */}
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_178px] gap-[8px]">
            <Card className="flex min-w-0 flex-col px-[10px] pb-[7px] pt-[9px]">
              <div className="flex items-center gap-[12px] text-[8px] text-lp-text/66">
                <span className="flex items-center gap-[4px]"><span className="h-[1.5px] w-[12px] bg-lp-text" />{t.fact} <b className="font-semibold text-lp-profit">{t.factValue}</b></span>
                <span className="flex items-center gap-[4px]"><span className="w-[12px] border-t-[1.5px] border-dashed border-lp-accent" />{t.rules} <b className="font-semibold text-lp-profit">{t.rulesValue}</b></span>
              </div>
              <div className="mt-[8px] flex min-h-0 flex-1 gap-[6px]">
                <div className="flex flex-col justify-between py-[1px] text-right text-[7px] tabular-nums text-lp-text/66">
                  {["$6k", "$4k", "$2k", "$0"].map((v) => <span key={v}>{v}</span>)}
                </div>
                <svg viewBox={`0 0 ${GW} ${GH}`} className="h-full min-w-0 flex-1 overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <pattern id="scr-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="5" stroke="rgb(var(--lp-loss))" strokeWidth="1.1" strokeOpacity="0.55" />
                    </pattern>
                  </defs>
                  {[0, 2000, 4000, 6000].map((v) => <line key={v} x1="0" x2={GW} y1={gy(v)} y2={gy(v)} stroke="rgb(var(--lp-text))" strokeOpacity="0.07" vectorEffect="non-scaling-stroke" />)}
                  {p > 0 && <path d={gapUpto(p)} fill="url(#scr-hatch)" />}
                  <path d={upto(RULES, p)} fill="none" stroke="rgb(var(--lp-accent))" strokeWidth="1.4" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                  <path d={upto(FACT, p)} fill="none" stroke="rgb(var(--lp-text))" strokeWidth="1.7" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  {OFF.filter((w) => w <= p).map((w) => (
                    <line key={w} x1={gx(w)} x2={gx(w)} y1={gy(FACT[w])} y2={gy(RULES[w])} stroke="rgb(var(--lp-loss))" strokeWidth="1.8" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} className="hero-mark" />
                  ))}
                </svg>
              </div>
              <div className="ml-[22px] mt-[5px] flex justify-between text-[7px] text-lp-text/58">{t.months.map((m) => <span key={m}>{m}</span>)}</div>
            </Card>

            <Card className="flex flex-col px-[10px] py-[9px]">
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] font-semibold">{s.offTitle}</span>
                <span className="text-[8px] tabular-nums text-lp-text/62">14</span>
              </div>
              <ul className="mt-[12px] flex flex-col gap-[15px]">
                {s.off.map(([name, n, sum]) => (
                  <li key={name}>
                    <div className="flex items-baseline justify-between gap-[6px] text-[8px]">
                      <span className="truncate text-lp-text/75">{name} <span className="text-lp-text/58">×{n}</span></span>
                      <span className="shrink-0 font-medium tabular-nums text-lp-loss">{sum}</span>
                    </div>
                    <div className="mt-[5px] h-[4px] rounded-full bg-lp-text/[0.06]">
                      <div className="h-full rounded-full bg-lp-loss/80 transition-[width] duration-700 ease-out"
                        style={{ width: done ? `${(Number(sum.replace(/[^\d]/g, "")) / OFF_MAX) * 100}%` : "0%" }} />
                    </div>
                  </li>
                ))}
              </ul>
              {/* Недели квартала: красная — были сделки вне системы */}
              <div className="mt-auto border-t border-lp-line/80 pt-[8px]">
                <div className="flex gap-[3px]">
                  {Array.from({ length: WEEKS }, (_, w) => w + 1).map((w) => (
                    <span key={w} className={`h-[11px] flex-1 rounded-[2px] transition-colors duration-300 ${w > p ? "bg-lp-text/[0.06]" : OFF.includes(w) ? "bg-lp-loss/80" : "bg-lp-profit/55"}`} />
                  ))}
                </div>
                <div className={`mt-[6px] text-[8px] text-lp-text/66 ${fade}`}>{t.gapCaption}</div>
              </div>
            </Card>
          </div>

          {/* Последние сделки */}
          <Card className="px-[10px] py-[8px]">
            <div className="text-[9px] font-semibold">{s.lastTitle}</div>
            <table className="mt-[5px] w-full border-collapse text-[8.5px] tabular-nums">
              <tbody>
                {s.last.map(([sym, side, r, pnl, tag]) => (
                  <tr key={sym} className="border-t border-lp-line/60 first:border-t-0">
                    <td className="py-[5px] font-medium">{sym}</td>
                    <td className="text-lp-text/66">{side}</td>
                    <td className="text-lp-text/66">{r}</td>
                    <td className="text-right">{tag && <span className="rounded-[3px] bg-lp-loss/12 px-[5px] py-[2px] text-[7.5px] text-lp-loss">{tag}</span>}</td>
                    <td className={`w-[56px] text-right font-medium ${pnl.startsWith("+") ? "text-lp-profit" : "text-lp-loss"}`}>{pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
}
