import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "./i18n/config";

// Английский живёт без префикса: /pricing → внутренний маршрут /en/pricing.
// Явный /en/... перенаправляем на адрес без префикса, чтобы не было дублей.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const first = pathname.split("/")[1];

  if (first === defaultLocale) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if ((locales as readonly string[]).includes(first)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|brand|media|favicon|.*\\..*).*)"],
};
