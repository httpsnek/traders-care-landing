// Демо-журнал для блока «ИИ-ассистент»: 214 сделок за квартал (64 торговых дня).
// Генерация детерминирована (сид), поэтому сервер и клиент рисуют одно и то же, а подмножества
// под сносками совпадают с цифрами в тексте ответа (см. словарь ai.qa и проверку check() ниже).

export type Trade = { i: number; day: number; slot: number; win: boolean; session: "m" | "d" | "l" };

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260927);
const shuffle = <T,>(a: T[]) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
const take = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);

// 64 торговых дня, 1–6 сделок в день, всего 214.
export const DAYS = 64;
const perDay: number[] = Array.from({ length: DAYS }, () => 2 + Math.floor(rand() * 3)); // 2–4
let extra = 214 - perDay.reduce((a, b) => a + b, 0);
while (extra !== 0) {
  const d = Math.floor(rand() * DAYS);
  if (extra > 0 && perDay[d] < 6) { perDay[d]++; extra--; }
  if (extra < 0 && perDay[d] > 1) { perDay[d]--; extra++; }
}
export const MAX_PER_DAY = Math.max(...perDay);

// Сессии: утро 120, день 46, после 16:00 — 48. Внутри дня сделки идут по порядку: утро → день → вечер,
// поэтому «после 16:00» — это верхушки столбцов.
const sessions = shuffle([...Array(120).fill("m"), ...Array(46).fill("d"), ...Array(48).fill("l")] as Trade["session"][]);
const order = { m: 0, d: 1, l: 2 };
export const TRADES: Trade[] = [];
{
  let k = 0;
  perDay.forEach((n, day) => {
    sessions.slice(k, k + n).sort((a, b) => order[a] - order[b]).forEach((session, slot) => {
      TRADES.push({ i: TRADES.length, day, slot, win: false, session });
    });
    k += n;
  });
}
// Результаты: утро 70 в плюс (58 %), день 23, вечер 15 (31 %).
const bySession = (s: Trade["session"]) => TRADES.filter((t) => t.session === s);
([["m", 70], ["d", 23], ["l", 15]] as const).forEach(([s, w]) => take(bySession(s), w).forEach((t) => { t.win = true; }));

const ids = (a: Trade[]) => new Set(a.map((t) => t.i));
const losses = (a: Trade[]) => a.filter((t) => !t.win);
const wins = (a: Trade[]) => a.filter((t) => t.win);

// Вопрос 1: где теряю. [1] вечер, [2] утро, [3] 14 ошибок (6 — «после 16:00», 8 — прочие убыточные).
const late = bySession("l"), morning = bySession("m");
const mistakes = [...take(losses(late), 6), ...take(losses([...morning, ...bySession("d")]), 8)];

// Вопрос 2: сетап. London reversal — утренние: по правилам 38 (23 в плюс), с отступлениями 15 (4 в плюс).
const mWins = shuffle(wins(morning)), mLoss = shuffle(losses(morning));
const bySystem = [...mWins.slice(0, 23), ...mLoss.slice(0, 15)];
const offSystem = [...mWins.slice(23, 27), ...mLoss.slice(15, 26)];

// Вопрос 3: сделки сразу после убытка в тот же день: 31, из них 9 в плюс.
const afterLoss = TRADES.filter((t) => t.slot > 0 && !TRADES[t.i - 1].win);
const revengeWins = take(wins(afterLoss), 9), revengeLoss = take(losses(afterLoss), 22);

// Вопрос 4: [1] последние 34 сделки (с пика эквити), [2] пять худших дней на 19 сделок, [3] все.
const dayTrades = (d: number) => TRADES.filter((t) => t.day === d);
function worstDays(total: number, count: number) {
  const cand = Array.from({ length: DAYS }, (_, d) => d)
    .map((d) => ({ d, n: perDay[d], l: losses(dayTrades(d)).length }))
    .sort((a, b) => b.l / b.n - a.l / a.n || b.l - a.l).slice(0, 16);
  let best: number[] = [], bestL = -1;
  const walk = (start: number, pick: typeof cand) => {
    if (pick.length === count) {
      if (pick.reduce((a, c) => a + c.n, 0) === total) {
        const l = pick.reduce((a, c) => a + c.l, 0);
        if (l > bestL) { bestL = l; best = pick.map((c) => c.d); }
      }
      return;
    }
    for (let i = start; i < cand.length; i++) walk(i + 1, [...pick, cand[i]]);
  };
  walk(0, []);
  return TRADES.filter((t) => best.includes(t.day));
}

/** Подмножества под сносками: SUBSETS[вопрос][сноска] = множество индексов сделок. */
export const SUBSETS: Set<number>[][] = [
  [ids(late), ids(morning), ids(mistakes)],
  [ids(bySystem), ids(offSystem), ids([...bySystem, ...offSystem])],
  [ids([...revengeWins, ...revengeLoss]), ids(revengeWins), ids(revengeLoss)],
  [ids(TRADES.slice(-34)), ids(worstDays(19, 5)), ids(TRADES)],
];

/** Сколько сделок и сколько из них в плюс — чтобы сверить с текстом сносок. */
export function check() {
  return SUBSETS.map((q) => q.map((s) => ({ n: s.size, w: [...s].filter((i) => TRADES[i].win).length })));
}
