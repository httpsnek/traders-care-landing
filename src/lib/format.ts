import type { Locale } from "@/i18n/config";

/** Форматирование демо-чисел лендинга: знак — настоящий минус (U+2212), разряды — неразрывным пробелом. */
export function makeFormat(locale: Locale) {
  const tag = locale === "en" ? "en-US" : locale;
  const int = new Intl.NumberFormat(tag, { maximumFractionDigits: 0 });
  const nbsp = (s: string) => s.replace(/\s/g, " ");
  return {
    /** $825 · +$825 · −$640 */
    usd: (n: number, signed = true) => `${n < 0 ? "−" : signed ? "+" : ""}$${nbsp(int.format(Math.abs(n)))}`,
    /** 4 031.40 — цены с фиксированным числом знаков */
    price: (n: number, digits = 2) =>
      nbsp(new Intl.NumberFormat(tag, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)),
    pct: (n: number) => (locale === "en" ? `${n}%` : `${n} %`),
  };
}
