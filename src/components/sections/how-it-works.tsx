"use client";

import { Check, RefreshCw } from "lucide";
import { MorphIcon } from "morphicons/react";
import { animate, useInView } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/container";
import { CountUp, Typed } from "@/components/ui/reveal";

// Блок 4 «Как это работает». Ряд 1 — три шага с фрагментами интерфейса.
// Ряд 2 — чек img-04: строки печатает код моноширинным шрифтом поверх плоской части бумаги, рядом итоговая сумма.

// Плоская часть бумаги в img-04-*.webp (1040×1380): левый верхний угол (204.7, 142.8),
// ширина 353.8 px, плоский участок до скрутки ≈ 880 px, наклон −9.83°. Размеры — в cqw от ширины картинки.
const PAPER = { left: "19.68%", top: "10.35%", width: "34.02cqw", height: "81cqw", angle: -9.83 };

// Пример данных: 5 + 6 + 2 + 1 = 14 сделок, 640 + 910 + 520 + 270 = 2 340.
const ITEMS = [{ n: 5, usd: 640 }, { n: 6, usd: 910 }, { n: 2, usd: 520 }, { n: 1, usd: 270 }];
const TOTAL = ITEMS.reduce((s, i) => s + i.usd, 0);

const LINE_MS = 140; // шаг печати строк
// Штрихкод внизу чека — ширины полос (детерминированно).
const BARS = [1, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 3, 1];

export function HowItWorks({ t, locale }: { t: Dictionary["how"]; locale: Locale }) {
  const nf = useMemo(() => new Intl.NumberFormat(locale === "en" ? "en-US" : locale, { maximumFractionDigits: 0 }), [locale]);
  const money = (n: number) => `${n < 0 ? "\u2212" : ""}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(Math.abs(n))}`;
  const usd = (n: number) => `−$${nf.format(n).replace(/\s/g, " ")}`;

  // Шаг 2: иконка синхронизации превращается в галочку, когда шаги входят в экран.
  const stepsRef = useRef<HTMLOListElement>(null);
  const stepsSeen = useInView(stepsRef, { once: true, amount: 0.25 });
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!stepsSeen) return;
    const id = window.setTimeout(() => setSynced(true), 1100);
    return () => window.clearTimeout(id);
  }, [stepsSeen]);

  // Чек: строки печатаются по одной, затем крупная сумма досчитывает от нуля.
  const paperRef = useRef<HTMLDivElement>(null);
  const printed = useInView(paperRef, { once: true, amount: 0.35 });
  const sumRef = useRef<HTMLSpanElement>(null);
  const lines = 11 + ITEMS.length * 2 + 5; // шапка, разделители, позиции по две строки, итог
  useEffect(() => {
    if (!printed || !sumRef.current) return;
    const el = sumRef.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Считаем вместе с печатью и заканчиваем, когда чек допечатан.
    const c = animate(0, TOTAL, {
      duration: (lines * LINE_MS) / 1000 + 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = usd(Math.round(v)); },
    });
    return () => c.stop();
    // Счёт запускается один раз — когда чек начал печататься; формат суммы на это не влияет.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printed]);

  // Задержка печати каждой строки — по порядку появления в разметке.
  let line = 0;
  const d = () => ({ "--d": `${line++ * LINE_MS}ms` }) as React.CSSProperties;

  return (
    <section id="how" aria-labelledby="how-title" className="py-section-sm lg:py-section">
      <Container>
        <h2 id="how-title" className="max-w-[640px] text-lp-h2 text-lp-text">{t.title}</h2>

        {/* Ряд 1 — шаги. На десктопе соединены линией на уровне номеров, на мобильном — вертикальной слева. */}
        <ol ref={stepsRef} className="relative mt-9 grid gap-8 border-l border-lp-line pl-5 md:mt-12 md:grid-cols-3 md:gap-6 md:border-l-0 md:pl-0 lg:mt-16">
          <span aria-hidden className={`absolute inset-x-0 top-[28px] hidden h-px origin-left bg-lp-line transition-transform duration-[1400ms] ease-lp motion-reduce:scale-x-100 motion-reduce:transition-none md:block ${stepsSeen ? "scale-x-100" : "scale-x-0"}`} />
          {t.steps.map((s, i) => (
            <li key={i} style={{ transitionDelay: `${i * 160}ms` }}
              className={`relative flex flex-col transition-[opacity,transform] duration-700 ease-lp motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${stepsSeen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
              <span className="relative inline-flex w-fit bg-lp-ground pr-5 font-display text-[34px] font-medium leading-none md:text-[56px] tracking-[-0.04em] text-lp-muted tabular-nums">{i + 1}</span>
              <h3 className="mt-3 text-lp-h3 text-lp-text md:mt-6">{s.title}</h3>
              <p className="mt-2 max-w-[36ch] text-lp-body text-lp-text-2">{s.text}</p>

              <div aria-hidden className="mt-4 rounded-screen border border-lp-line bg-lp-raised p-4 text-[13px] md:mt-6">
                {i === 0 && (
                  <div className="grid gap-2">
                    {[[t.form.server, "Broker-Live 07"], [t.form.login, "5102 3381"], [t.form.password, "••••••••••"]].map(([k, v], j) => (
                      <div key={k} className="flex items-center justify-between gap-3 rounded-control border border-lp-line px-3 py-2">
                        <span className="text-lp-muted">{k}</span><span className="font-mono text-lp-text"><Typed text={v} start={stepsSeen} delay={500 + j * 650} step={j === 2 ? 45 : 55} /></span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center gap-2 text-lp-text-2">
                      <span className="h-[6px] w-[6px] rounded-full bg-lp-accent" />{t.form.readOnly}
                    </div>
                  </div>
                )}
                {i === 1 && (
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${synced ? "bg-lp-accent text-lp-on-accent" : "bg-lp-text/[0.06] text-lp-text-2"}`}>
                      <MorphIcon icon={synced ? Check : RefreshCw} size={18} strokeWidth={2} spring="snappy" reducedMotion="user" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lp-text">{synced ? t.sync.done : t.sync.syncing}</span>
                      <span className={`block text-lp-muted transition-opacity duration-500 ${synced ? "opacity-100" : "opacity-0"}`}>{t.sync.trades} · XAUUSD, EURUSD</span>
                    </span>
                  </div>
                )}
                {i === 2 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-lp-text">{t.mistake.name}</span>
                      <span className="block text-lp-muted">{t.mistake.times}</span>
                    </span>
                    <span className="font-display text-[20px] font-medium tracking-[-0.02em] text-lp-loss tabular-nums"><CountUp to={640} start={synced} format={(n) => usd(Math.round(n))} delay={0.5} /></span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* Ряд 2 — чек и сумма */}
        <div className="mt-10 grid items-center gap-6 md:mt-14 lg:mt-20 lg:grid-cols-12 lg:gap-6">
          <figure className="-mx-5 overflow-hidden md:mx-0 lg:order-2 lg:col-span-6 lg:col-start-7" aria-label={t.receipt.aria}>
            {/* На узком экране картинка чуть шире колонки: пустые поля по бокам уходят за край, чек не на весь экран. */}
            <div className="mx-auto w-[118%] max-w-none -translate-x-[8%] [container-type:inline-size] md:w-full md:max-w-[560px] md:translate-x-0">
              <div ref={paperRef} className="relative aspect-[1040/1380] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent),linear-gradient(to_bottom,transparent,#000_5%,#000_92%,transparent)]">
                <Image src="/media/how/img-04-dark.webp" alt="" fill unoptimized sizes="(min-width: 768px) 560px, 118vw" className="object-cover [[data-theme=light]_&]:hidden" />
                <Image src="/media/how/img-04-light.webp" alt="" fill unoptimized sizes="(min-width: 768px) 560px, 118vw" className="hidden object-cover [[data-theme=light]_&]:block" />

                {/* Печать: цвет задан бумагой, а не темой — чек белый в обеих темах. */}
                {/* Термопечать: только чёрная краска, заглавные, узкий моноширинный, точечные лидеры, итог двойной высоты.
                    Лёгкое «растекание» точек (blur) и разная плотность строк — как у настоящего термопринтера. */}
                <div aria-hidden data-printed={printed || undefined}
                  className="receipt thermal absolute flex origin-top-left flex-col px-[2.6cqw] pb-[1.2cqw] pt-[3cqw] font-mono text-[1.85cqw] uppercase leading-[1.38] [&>*]:shrink-0 tracking-[0.02em] text-[#1c1c20] mix-blend-multiply"
                  style={{ left: PAPER.left, top: PAPER.top, width: PAPER.width, height: PAPER.height, transform: `rotate(${PAPER.angle}deg)` }}>
                  <div className="receipt-line text-center text-[2.8cqw] font-bold leading-[1.2] tracking-[0.18em] [transform:scaleY(1.2)]" style={d()}>{t.receipt.head}</div>
                  <div className="receipt-line mt-[0.45em] text-center tracking-[0.1em]" style={d()}>{t.receipt.sub}</div>
                  <div className="receipt-line text-center normal-case opacity-80" style={d()}>traderscare.io</div>
                  <div className="receipt-line my-[0.3em] overflow-hidden whitespace-nowrap opacity-70" style={d()}>{"=".repeat(40)}</div>
                  {[[t.receipt.kAccount, t.receipt.account.replace("Phase ", "PH ")], [t.receipt.kPeriod, t.receipt.dates], [t.receipt.kNo, t.receipt.no.replace(/[^0-9]/g, "")]].map(([k, v]) => (
                    <div key={k} className="receipt-line flex justify-between gap-[1cqw]" style={d()}><span>{k}</span><span className="text-right">{v}</span></div>
                  ))}
                  <div className="receipt-line my-[0.3em] overflow-hidden whitespace-nowrap opacity-70" style={d()}>{"-".repeat(40)}</div>
                  <div className="receipt-line flex justify-between opacity-80" style={d()}><span>{t.receipt.col}</span><span>USD</span></div>
                  {ITEMS.map((it, k) => (
                    <div key={k} className="mt-[0.15em]">
                      <div className="receipt-line truncate" style={d()}>{t.receipt.lines[k]}</div>
                      <div className="receipt-line flex items-baseline gap-[0.6cqw] whitespace-nowrap" style={d()}>
                        <span className="pl-[1.5cqw]">×{it.n}</span>
                        <span className="min-w-0 flex-1 overflow-hidden opacity-60">{".".repeat(40)}</span>
                        <span>{money(-it.usd)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="receipt-line my-[0.3em] overflow-hidden whitespace-nowrap opacity-70" style={d()}>{"-".repeat(40)}</div>
                  <div className="receipt-line flex items-baseline justify-between text-[3cqw] font-bold leading-[1.15] [transform:scaleY(1.3)]" style={d()}>
                    <span>{t.receipt.totalShort}</span><span>{money(-TOTAL)}</span>
                  </div>
                  <div className="receipt-line mt-[0.5em] flex justify-between" style={d()}><span>{t.receipt.count}</span><span>{ITEMS.reduce((a, i) => a + i.n, 0)}</span></div>
                  <div className="receipt-line my-[0.3em] overflow-hidden whitespace-nowrap opacity-70" style={d()}>{"=".repeat(40)}</div>
                  <div className="receipt-line mt-auto" style={d()}>
                    <div className="mx-auto flex h-[3.8cqw] w-[82%] items-stretch justify-between">
                      {BARS.map((w, i) => <span key={i} className="bg-current" style={{ width: `${w * 0.26}cqw` }} />)}
                    </div>
                    <div className="mt-[0.2em] text-center text-[1.6cqw] tracking-[0.3em]">0039 3009 2026</div>
                    <div className="mt-[0.5em] text-center text-[1.7cqw] opacity-80">{t.receipt.thanks}</div>
                  </div>
                </div>
              </div>
            </div>
          </figure>

          <div className="lg:order-1 lg:col-span-5">
            <p className="text-lp-small text-lp-muted">{t.costLabel}</p>
            <p className="mt-3 font-display text-[clamp(56px,8vw,112px)] font-medium leading-[0.95] tracking-[-0.045em] text-lp-loss tabular-nums">
              <span ref={sumRef}>{usd(TOTAL)}</span>
            </p>
            <p className="mt-4 max-w-[46ch] text-lp-lead text-lp-text-2 md:mt-6">{t.costText}</p>
            <p className="mt-6 text-lp-small text-lp-muted">{t.demo}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
