import { notFound } from "next/navigation";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Product } from "@/components/sections/product";
import { AiAssistant } from "@/components/sections/ai-assistant";
import { Verify } from "@/components/sections/verify";
import { PropFirms } from "@/components/sections/prop-firms";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { PropRules } from "@/components/sections/prop-rules";
import { Trust } from "@/components/sections/trust";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <Header locale={locale} t={t.header} />
      <main>
        <Hero t={t.hero} />
        <Trust t={t.trust} />
        <PropRules t={t.prop} locale={locale} />
        <HowItWorks t={t.how} locale={locale} />
        <Product t={t.product} locale={locale} />
        <AiAssistant t={t.ai} />
        <PropFirms t={t.firms} />
        <Verify t={t.verify} locale={locale} />
        <Pricing t={t.pricing} />
        <Faq t={t.faq} />
        <FinalCta t={t.final} />
      </main>
      <Footer t={t.footer} locale={locale} themeLabels={{ toLight: t.header.themeToLight, toDark: t.header.themeToDark }} />
    </>
  );
}
