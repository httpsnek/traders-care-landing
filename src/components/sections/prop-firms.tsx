import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/i18n";
import { APP_URL } from "@/i18n/config";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FirmTools } from "./firm-tools";
import { Reveal } from "@/components/ui/reveal";
import { INK, MetalCard, type Material } from "./metal-card";

// Блок 8 «Проп-фирмы и инструменты»: две «входные двери» продукта.
// Ряд 1: каскад металлических карт фирм (img-07-*.webp: все карты одной формы, вырезаны
// по геометрии; раскладка, тени и данные — здесь) + подбор.
// Ряд 2: бесплатные калькуляторы (firm-tools.tsx).

// [ДАННЫЕ] Фирмы и число программ на картах — примеры; заменить на фирмы из каталога.
// На картах только то, что относится к нашему сервису: программы в каталоге и дата сверки правил — без цифр о самих фирмах.
// Каскад вниз-вправо: у нижних карт видна верхняя полоса с названием, верхняя карта видна целиком.
const FIRMS: { name: string; programs: number; card: Material; x: number; y: number }[] = [
  { name: "FundedNext", programs: 3, card: "graphite", x: 2, y: 4 },
  { name: "The5ers", programs: 4, card: "titanium", x: 16, y: 20 },
  { name: "FTMO", programs: 3, card: "violet", x: 30, y: 36 },
];
// [ДАННЫЕ] Адреса каталога и калькуляторов на traderscare.io.
const LINKS = { pick: `${APP_URL}/prop-firms/match`, catalog: `${APP_URL}/prop-firms`, tools: ["risk", "consistency", "position-size"].map((p) => `${APP_URL}/tools/${p}`) };

export function PropFirms({ t }: { t: Dictionary["firms"] }) {
  return (
    <section id="prop-firms" aria-labelledby="firms-title" className="py-section-sm lg:py-section">
      <Container>
        {/* Ряд 1 — каталог */}
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
          {/* Каскад карт. Размеры текста — в cqw от ширины карты, чтобы гравировка масштабировалась вместе с картой. */}
          {/* Появление: карты лежат одной стопкой на месте верхней и разъезжаются веером, когда блок попал в кадр.
              Сдвиг — в % от размеров карты: по x (Δx / 64 % ширины), по y (Δy × (2/3 высоты контейнера) / высоту карты). */}
          <Reveal amount={0.4} aria-label={t.cardsAria} role="img" className="relative aspect-[3/2] lg:col-span-7">
            {FIRMS.map((f, i) => {
              const top = i === FIRMS.length - 1;
              const ink = INK[f.card];
              const last = FIRMS[FIRMS.length - 1];
              const dx = ((last.x - f.x) / 64) * 100, dy = ((last.y - f.y) * (2 / 3)) / (0.64 / (1305 / 831)) * 1;
              return (
                <MetalCard key={f.name} material={f.card} sizes="(min-width: 1024px) 520px, 64vw"
                  className="absolute w-[64%] transition-transform duration-[1100ms] ease-lp [transform:translate(var(--dx),var(--dy))_rotate(var(--r))] group-data-[seen]/rv:[transform:none] motion-reduce:[transform:none] motion-reduce:transition-none"
                  style={{ left: `${f.x}%`, top: `${f.y}%`, zIndex: i, transitionDelay: `${(FIRMS.length - 1 - i) * 90}ms`,
                    ["--dx" as string]: `${dx}%`, ["--dy" as string]: `${dy}%`, ["--r" as string]: `${(FIRMS.length - 1 - i) * -2.5}deg` }}>
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-baseline justify-between gap-[3cqw]">
                      <span className={`font-display text-[6.2cqw] font-semibold leading-none tracking-[-0.02em] ${ink.main}`}>{f.name}</span>
                      {!top && <span className={`text-[3.2cqw] ${ink.sub}`}>{f.programs} · {t.programs}</span>}
                    </div>
                    {top && (
                      <div className="flex items-end justify-between gap-[4cqw]">
                        <div>
                          <div className={`font-display text-[11cqw] font-medium leading-none tracking-[-0.03em] tabular-nums ${ink.main}`}>{f.programs}</div>
                          <div className={`mt-[1.5cqw] text-[3.3cqw] ${ink.sub}`}>{t.programs}</div>
                        </div>
                        <div className={`text-right text-[3.3cqw] leading-snug ${ink.sub}`}>{t.checked}<br /><span className={ink.main}>{t.checkedDate}</span></div>
                      </div>
                    )}
                  </div>
                </MetalCard>
              );
            })}
          </Reveal>

          <div className="lg:col-span-5 lg:col-start-8">
            <h2 id="firms-title" className="text-lp-h2 text-lp-text">{t.title}</h2>
            <p className="mt-5 max-w-[46ch] text-lp-lead text-lp-text-2">{t.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ButtonLink href={LINKS.pick} size="lg">{t.pick}</ButtonLink>
              <a href={LINKS.catalog} className="group inline-flex items-center gap-2 text-[15px] font-medium text-lp-text">
                {t.catalog}<ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </a>
            </div>
          </div>
        </div>

        {/* Ряд 2 — калькуляторы: строки-калькуляторы слева переключают график справа (firm-tools.tsx) */}
        <div className="mt-14 border-t border-lp-line pt-12 lg:mt-20 lg:pt-16">
          <FirmTools t={t.tools} links={LINKS.tools} />
        </div>
      </Container>
    </section>
  );
}
