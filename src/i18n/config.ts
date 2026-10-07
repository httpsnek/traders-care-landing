export const locales = ["en", "ru", "uk"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Английский без префикса, остальные — /ru, /uk (как на текущем traderscare.io). */
export const localePath = (locale: Locale, path = "") =>
  `${locale === defaultLocale ? "" : `/${locale}`}${path}` || "/";

export const localeLabel: Record<Locale, string> = { en: "EN", ru: "RU", uk: "UA" };
export const htmlLang: Record<Locale, string> = { en: "en", ru: "ru", uk: "uk" };

/** Основной домен платформы: на него ведут ссылки на регистрацию, вход и другие страницы. */
export const APP_URL = "https://traderscare.io";
