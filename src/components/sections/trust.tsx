import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/container";

// Блок 2 «Доверие».
// Полоса: платформы набраны шрифтом, без логотипов ([ДАННЫЕ] нужно разрешение на логотипы) + три числа.
export function Trust({ t }: { t: Dictionary["trust"] }) {
  return (
    <section id="trust" aria-label={t.works} className="border-y border-lp-line">
      <Container>
        <div className="grid gap-8 py-10 lg:grid-cols-12 lg:items-center lg:gap-6">
          <div className="lg:col-span-7">
            <div className="text-lp-small text-lp-muted">{t.works}</div>
            <ul className="mt-3 flex flex-wrap gap-x-7 gap-y-2">
              {t.platforms.map((p) => <li key={p} className="font-display text-[19px] font-medium tracking-[-0.01em] text-lp-text-2">{p}</li>)}
            </ul>
          </div>
          <dl className="grid grid-cols-3 gap-4 lg:col-span-5 lg:divide-x lg:divide-lp-line">
            {t.stats.map((s) => (
              <div key={s.l} className="lg:pl-5 lg:first:pl-0">
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-[clamp(26px,2.6vw,34px)] font-medium leading-none tracking-[-0.03em] text-lp-text tabular-nums">{s.v}</dd>
                <dd className="mt-2 text-[13px] leading-snug text-lp-muted">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
