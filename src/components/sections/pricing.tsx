import type { Dictionary } from "@/i18n";
import { APP_URL } from "@/i18n/config";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Material } from "./metal-card";
import { Reveal } from "@/components/ui/reveal";
import { PlanCard } from "./plan-card";

// Блок 9 «Сравнение и тарифы». Без набора из 4 карточек с галочками:
// 1) сравнение — 3 колонки, колонка Traders Care на поднятой поверхности с акцентной линией сверху;
// 2) тарифы — одна таблица; шапка колонок — металлические карты img-07 (материал растёт с тарифом), Trader — фиолетовая;
// 3) «цена подписки против цены ошибки» — две полосы на одной шкале: $29 / мес против $128 за один вход без подтверждения
//    (из чека в «Как это работает»: 5 × = $640).
// [ДАННЫЕ] Цены, лимиты, уровни ИИ, способ оплаты — сверить с актуальными значениями; переключатель Месяц/Год — когда будет годовая цена.

const TC = 2; // индекс колонки Traders Care в сравнении
const MONTH = 29, CELLS = 5; // шкала «цена ошибки»: ячейка = месяц тарифа Trader
const REC = 2; // индекс рекомендуемого тарифа
const PLAN_LINKS = ["free", "solo", "trader", "pro"].map((p) => `${APP_URL}/register?plan=${p}`);
// Материал карты растёт вместе с тарифом: керамика → титан → фиолетовый анодированный алюминий (бренд) → графит.
const PLAN_CARD: Material[] = ["ceramic", "titanium", "violet", "graphite"];

const Mark = ({ v, hi }: { v: string; hi?: boolean }) =>
  v === "✓" ? <span className={hi ? "text-lp-accent" : "text-lp-text"}>✓</span>
    : v === "—" ? <span className="text-lp-muted">—</span>
      : <span className={hi ? "text-lp-text" : "text-lp-text-2"}>{v}</span>;

export function Pricing({ t }: { t: Dictionary["pricing"] }) {
  const c = t.compare;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="py-section-sm lg:py-section">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
          <h2 id="pricing-title" className="text-lp-h2 text-lp-text lg:col-span-7">{t.title}</h2>
          <p className="max-w-[46ch] text-lp-lead text-lp-text-2 lg:col-span-4 lg:col-start-9">{t.lead}</p>
        </div>

        {/* 2. Тарифы: карта (лицо — название и цена, по клику переворачивается — там характеристики гравировкой)
            + под картой «паспорт» тарифа: крупные значения вместо строк таблицы, строки выровнены по всем колонкам. */}
        {/* Телефон: карусель со свайпом — карта 84 % ширины, край следующей виден; с sm — сетка. */}
        <Reveal amount={0.15} className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-14 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-x-6 sm:gap-y-16 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          {t.plans.map((p, i) => {
            const rec = i === REC;
            const specs: [string, string][] = [[t.rowLabels[0], p.accounts], [t.rowLabels[1], p.sync], [t.rowLabels[2], p.ai], [t.rowLabels[3], p.tokens]];
            return (
              <div key={p.name} style={{ transitionDelay: `${i * 90}ms` }}
                className="flex w-[84%] shrink-0 snap-start flex-col translate-y-6 opacity-0 transition-[opacity,transform] duration-700 ease-lp group-data-[seen]/rv:translate-y-0 group-data-[seen]/rv:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:w-auto">
                <div className="mb-3 h-5 text-[13px] font-medium text-lp-accent">{rec ? t.recommended : ""}</div>
                <PlanCard material={PLAN_CARD[i]} name={p.name} price={p.price} perMonth={t.perMonth} specs={specs}
                  flip={t.flip} flipBack={t.flipBack} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 84vw" />
                <p className="mt-4 min-h-[2.6em] text-[15px] sm:mt-5 leading-snug text-lp-text">{p.note}</p>

                <dl className="mb-7 mt-5 border-t border-lp-line">
                  <div className="grid grid-cols-[1fr_auto] items-baseline border-b border-lp-line py-3">
                    <dt className="text-[13px] text-lp-muted">{t.rowLabels[0]}</dt>
                    <dd className={`font-display text-[26px] font-medium leading-none tabular-nums ${rec ? "text-lp-text" : "text-lp-text-2"}`}>{p.accounts}</dd>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline border-b border-lp-line py-3">
                    <dt className="text-[13px] text-lp-muted">{t.rowLabels[1]}</dt>
                    <dd className={`text-[15px] ${rec ? "text-lp-text" : "text-lp-text-2"}`}>{p.sync}</dd>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline border-b border-lp-line py-3">
                    <dt className="text-[13px] text-lp-muted">{t.rowLabels[2]}</dt>
                    <dd className={`text-[15px] ${rec ? "text-lp-text" : "text-lp-text-2"}`}>{p.ai}</dd>
                    {/* Уровень ИИ — три риски, как деления прибора (dd внутри той же группы — корректный список определений) */}
                    <dd aria-hidden className="col-span-2 mt-2.5 flex gap-1">
                      {[1, 2, 3].map((k) => (
                        <span key={k} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-lp-text/10">
                          {k <= i && <span className={`absolute inset-0 origin-left scale-x-0 rounded-full transition-transform duration-500 ease-lp group-data-[seen]/rv:scale-x-100 motion-reduce:scale-x-100 motion-reduce:transition-none ${rec ? "bg-lp-accent" : "bg-lp-text/55"}`}
                            style={{ transitionDelay: `${500 + i * 90 + k * 160}ms` }} />}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline border-b border-lp-line py-3">
                    <dt className="text-[13px] text-lp-muted">{t.rowLabels[3]}</dt>
                    <dd className={`font-display text-[20px] font-medium tabular-nums ${rec ? "text-lp-text" : "text-lp-text-2"}`}>{p.tokens}</dd>
                  </div>
                </dl>

                <ButtonLink href={PLAN_LINKS[i]} variant={rec ? "primary" : "secondary"} className="mt-auto w-full">{p.cta}</ButtonLink>
              </div>
            );
          })}
        </Reveal>
                <p className="mt-8 text-lp-small text-lp-text-2">{t.included}</p>
        <p className="mt-2 text-lp-small text-lp-muted">{t.payment}</p>

        {/* Сравнение — дополнительная информация, свёрнуто по умолчанию */}
        <details className="group mt-12 border-t border-lp-line pt-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium text-lp-text [&::-webkit-details-marker]:hidden">
            {c.title}<span aria-hidden className="text-lp-muted transition-transform duration-200 group-open:rotate-45">+</span>
          </summary>
          <div className="-mx-5 mt-6 overflow-x-auto px-5 md:mx-0 md:px-0">
            <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[34%] bg-lp-ground pb-4" />
                  {c.cols.map((col, i) => (
                    <th key={col} scope="col" className={`w-[22%] px-5 pb-4 pt-5 font-medium ${i === TC ? "rounded-t-screen border-t-2 border-lp-accent bg-lp-raised font-display text-[17px] text-lp-text" : "text-lp-text-2"}`}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r, ri) => (
                  <tr key={r.t} className="border-t border-lp-line">
                    <th scope="row" className="sticky left-0 z-10 bg-lp-ground py-4 pr-4 font-normal text-lp-text">{r.t}</th>
                    {r.v.map((v, i) => (
                      <td key={i} className={`px-5 py-4 ${i === TC ? `bg-lp-raised ${ri === c.rows.length - 1 ? "rounded-b-screen" : ""}` : ""}`}><Mark v={v} hi={i === TC} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-lp-small text-lp-text-2">{c.import}</p>
        </details>


        {/* 3. Цена подписки против цены ошибки */}
        <div className="mt-14 grid gap-10 border-t border-lp-line pt-12 lg:mt-20 lg:grid-cols-12 lg:items-center lg:gap-6 lg:pt-16">
          <div className="lg:col-span-5">
            <h3 className="font-display text-[clamp(22px,2.2vw,30px)] font-medium leading-tight tracking-[-0.02em] text-lp-text">{t.value.title}</h3>
            <p className="mt-4 max-w-[44ch] text-lp-body text-lp-text-2">{t.value.text}</p>
          </div>
          {/* Шкала в месяцах тарифа: 5 ячеек по $29. «Trader · месяц» — одна ячейка, одна ошибка ($128) — 4,4 ячейки.
              При появлении заливка бежит по ячейкам слева направо. */}
          <Reveal as="figure" amount={0.5} className="lg:col-span-6 lg:col-start-7" aria-label={t.value.aria}>
            {[{ label: t.value.sub, v: 29, fill: "bg-lp-accent", txt: "text-lp-text", start: 0 },
              { label: t.value.mistake, v: 128, fill: "bg-lp-loss", txt: "text-lp-loss", start: 350 }].map((b) => (
              <div key={b.label} className="mb-7 last:mb-0">
                <div className="flex items-baseline justify-between gap-4 text-[14px]">
                  <span className="text-lp-text-2">{b.label}</span>
                  <span className={`font-display text-[28px] font-medium tracking-[-0.02em] tabular-nums ${b.txt}`}>${b.v}</span>
                </div>
                <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                  {Array.from({ length: CELLS }, (_, c) => {
                    const f = Math.max(0, Math.min(1, b.v / MONTH - c));
                    return (
                      <div key={c} className="relative h-3.5 overflow-hidden rounded-[4px] bg-lp-text/[0.07]">
                        {f > 0 && <div className={`absolute inset-y-0 left-0 w-full origin-left scale-x-0 transition-transform ease-linear group-data-[seen]/rv:[transform:scaleX(var(--f))] motion-reduce:[transform:scaleX(var(--f))] motion-reduce:transition-none ${b.fill}`}
                          style={{ ["--f" as string]: f, transitionDuration: `${Math.round(f * 220)}ms`, transitionDelay: `${b.start + c * 220}ms` }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div aria-hidden className="mt-2 grid grid-cols-5 gap-1.5 text-right text-[12px] tabular-nums text-lp-muted">
              {Array.from({ length: CELLS }, (_, c) => <span key={c}>${MONTH * (c + 1)}</span>)}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
