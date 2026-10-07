import type { Dictionary } from "@/i18n";
import { APP_URL, localeLabel, locales, type Locale } from "@/i18n/config";
import { Container } from "@/components/ui/container";
import { LocaleLink } from "./locale-link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// Подвал. Спокойный, без крупного вордмарка и карточек:
// логотип + одна строка сути слева, 4 колонки ссылок справа; снизу — язык (ссылками, не выпадашкой),
// тема, копирайт; дисклеймер о рисках отдельной строкой с контрастом AA (text-2, не muted).
// [ДАННЫЕ] Адреса документов, соцсетей и почты.

const href = (h: string) => (h.startsWith("/") ? `${APP_URL}${h}` : h);

export function Footer({ t, locale, themeLabels }: {
  t: Dictionary["footer"]; locale: Locale; themeLabels: { toLight: string; toDark: string };
}) {
  return (
    <footer className="overflow-x-clip border-t border-lp-line">
      <Container className="pb-10 pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-5 max-w-[30ch] text-lp-body text-lp-text-2">{t.tagline}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:col-span-8">
            {t.cols.map((c) => (
              <div key={c.title}>
                <div className="text-[13px] text-lp-muted">{c.title}</div>
                <ul className="mt-4 grid gap-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <a href={href(l.href)} className="relative break-words text-[15px] before:absolute before:content-[''] before:-inset-x-2 before:-inset-y-2.5 text-lp-text-2 transition-colors duration-200 hover:text-lp-text">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-lp-line pt-6">
          <span className="text-lp-small text-lp-muted">{t.copyright}</span>
          <div className="flex items-center gap-6">
            <nav aria-label={t.language} className="flex items-center gap-1 text-[14px]">
              {locales.map((l, i) => (
                <span key={l} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden className="text-lp-line">/</span>}
                  <LocaleLink to={l} current={locale}
                    className="rounded-[6px] px-1.5 py-1 text-lp-muted transition-colors hover:text-lp-text aria-[current=true]:text-lp-text">
                    {localeLabel[l]}
                  </LocaleLink>
                </span>
              ))}
            </nav>
            <ThemeToggle labels={themeLabels} className="-mr-3" />
          </div>
        </div>
        <p className="mt-6 max-w-[110ch] text-[13px] leading-relaxed text-lp-text-2">{t.disclaimer}</p>
      </Container>
    </footer>
  );
}
