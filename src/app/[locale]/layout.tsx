import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { htmlLang, isLocale, localePath, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { HtmlLang } from "@/components/site/html-lang";

const SITE = "https://traderscare.io";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const url = `${SITE}${localePath(locale) === "/" ? "" : localePath(locale)}`;
  return {
    metadataBase: new URL(SITE),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: url,
      languages: {
        en: SITE, ru: `${SITE}/ru`, uk: `${SITE}/uk`, "x-default": SITE,
      },
    },
    openGraph: {
      title: t.meta.title, description: t.meta.description, url, siteName: "Traders Care",
      locale: { en: "en_US", ru: "ru_RU", uk: "uk_UA" }[locale], type: "website",
    },
    twitter: { card: "summary", title: t.meta.title, description: t.meta.description },
    icons: { icon: "/brand/icon.svg" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const lang = htmlLang[locale as Locale];
  return (
    <>
      {/* lang до первой отрисовки (корневой <html> общий для всех языков) */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(lang)}` }} />
      <HtmlLang lang={lang} />
      {children}
    </>
  );
}
