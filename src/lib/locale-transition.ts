// Смена языка без перезагрузки: навигация Next.js с сохранением прокрутки, обёрнутая в View Transition.
// Старый снимок страницы уходит с лёгким размытием, новый проявляется (стили — globals.css, html[data-tt="lang"]).
// Снимок новой страницы браузер делает, когда промис из startViewTransition разрешится —
// разрешаем его из переключателя языка после того, как новая страница смонтировалась (localeReady).

let pending: (() => void) | null = null;

export function localeReady() {
  pending?.();
  pending = null;
}

export function switchLocale(href: string, push: (href: string) => void) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) { push(href); return; }

  root.setAttribute("data-tt", "lang");
  const vt = document.startViewTransition(() => new Promise<void>((resolve) => {
    pending = resolve;
    push(href);
    setTimeout(localeReady, 1500); // страховка: если навигация не случилась, переход не зависнет
  }));
  vt.finished.finally(() => root.removeAttribute("data-tt"));
}
