import type { Dictionary } from "@/i18n";
import { APP_URL } from "@/i18n/config";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TabletScreen } from "./tablet-screen";

// Блок 11 «Финальный призыв»: сцена img-08 — рабочее место на рассвете.
// Десктоп: сцена на всю ширину, текст поверх тёмной левой части кадра (текст всегда светлый — сцена тёмная в обеих темах).
//   Тёмная тема — края растворяются в фон страницы; светлая — чистые края (растворение в светлый фон давало серую муть).
// Телефон: текст сверху на фоне страницы, сцена ниже, кадрирована на стол (поверх окна текст не читался).
// На планшете у чашки — знак Traders Care (tablet-screen.tsx).
export function FinalCta({ t }: { t: Dictionary["final"] }) {
  const text = (light: boolean) => (
    <>
      <h2 id={light ? "final-title" : undefined} className={`text-lp-h2 ${light ? "text-[#EDEDF0]" : "text-lp-text"}`}>{t.title}</h2>
      <p className={`mt-5 max-w-[44ch] text-lp-lead ${light ? "text-[#EDEDF0]/75" : "text-lp-text-2"}`}>{t.lead}</p>
      <ButtonLink href={`${APP_URL}/register`} size="lg" className="mt-9">{t.cta}</ButtonLink>
      <p className={`mt-5 text-lp-small ${light ? "text-[#EDEDF0]/60" : "text-lp-muted"}`}>{t.note}</p>
    </>
  );
  const scene = (sizes: string, cls: string) => (
    <Image src="/media/final/img-08-dark.webp" alt="" fill unoptimized sizes={sizes} className={`object-cover ${cls}`} />
  );

  return (
    <section id="final" aria-labelledby="final-title" className="relative overflow-hidden">
      {/* Десктоп */}
      <div className="relative hidden aspect-[2/1] max-h-[820px] w-full lg:block">
        {scene("100vw", "object-[50%_72%]")}
        <TabletScreen pos={[0.5, 0.72]} />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(var(--lp-ground))_0%,transparent_14%,transparent_80%,rgb(var(--lp-ground))_100%)] [[data-theme=light]_&]:hidden" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgb(11_11_13/0.35)_0%,transparent_50%)]" />
        <Container className="relative flex h-full items-center">
          <div className="max-w-[560px]">{text(true)}</div>
        </Container>
      </div>

      {/* Телефон и планшет */}
      <div className="lg:hidden">
        <Container className="py-section-sm">
          {text(false)}
        </Container>
        <div className="relative aspect-square w-full">
          {scene("100vw", "object-[82%_50%]")}
          <TabletScreen pos={[0.82, 0.5]} />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(var(--lp-ground))_0%,transparent_25%)] [[data-theme=light]_&]:hidden" />
        </div>
      </div>
    </section>
  );
}
