import { ArrowDown } from "lucide-react";
import { APP_URL } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroLaptop } from "./hero-laptop";

// Первый экран — закрытый ноутбук по центру (видео, разложенное на кадры). При прокрутке крышка открывается, на экране
// «включается» квартал трейдера: график «факт против системы», сумма отступлений набегает до −$2 340.
// Сцена тёмная в обеих темах (.lp-dark).
export function Hero({ t }: { t: Dictionary["hero"] }) {
  return (
    <section className="relative pt-header">
      <HeroLaptop t={t.visual}>
        <Container className="w-full">
          <div className="mx-auto flex max-w-[880px] flex-col items-center pt-6 text-center lg:pt-0">
            <h1 className="text-balance text-[clamp(28px,8vw,36px)] lg:text-[clamp(36px,4vw,60px)] font-display font-medium leading-[1.04] tracking-[-0.035em] text-lp-text">{t.title}</h1>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-snug text-lp-text-2 lg:mt-4 lg:text-lp-lead">{t.lead}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:mt-6 lg:gap-3">
              <ButtonLink href={`${APP_URL}/register`} size="lg" className="max-lg:h-11 max-lg:px-3.5 max-lg:text-[14px]">{t.primary}</ButtonLink>
              <ButtonLink href="#how" variant="secondary" size="lg" className="max-lg:h-11 max-lg:px-3.5 max-lg:text-[14px]">
                {t.secondary}
                <ArrowDown size={16} strokeWidth={1.75} aria-hidden />
              </ButtonLink>
            </div>
            <ul className="mt-3 flex flex-wrap max-lg:[@media(max-height:700px)]:hidden justify-center gap-y-1 text-[13px] text-lp-muted lg:mt-4 lg:text-lp-small">
              {t.facts.map((f, i) => (
                <li key={f} className={i === 0 ? "pr-3" : "border-l border-lp-line px-3"}>{f}</li>
              ))}
            </ul>
          </div>
        </Container>
      </HeroLaptop>
    </section>
  );
}
