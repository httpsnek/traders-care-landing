// Переход между темами: «полоса света».
// Страница меняется одним снимком (View Transitions API), новая тема проявляется за мягкой
// диагональной полосой, которая проходит из левого верхнего угла в правый нижний — как свет по стеклу.
// Маска задаётся в globals.css по html[data-tt="sweep"], здесь — только её движение.

export type Theme = "light" | "dark";

const DURATION = 1000;
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

export function switchTheme(next: Theme) {
  const root = document.documentElement;

  const apply = () => {
    root.classList.add("theme-switching"); // на время смены — без собственных transition элементов
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  };

  // Без API или при reduced motion — мгновенно. Во вкладке, которую не видно, браузер сам отменяет переход.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) { apply(); return; }

  root.setAttribute("data-tt", "sweep");
  const vt = document.startViewTransition(apply);
  vt.finished.finally(() => root.removeAttribute("data-tt"));

  vt.ready.then(() => {
    root.animate(
      { maskPosition: ["100% 100%", "0% 0%"], webkitMaskPosition: ["100% 100%", "0% 0%"] } as PropertyIndexedKeyframes,
      { duration: DURATION, easing: EASE_IN_OUT, pseudoElement: "::view-transition-new(root)", fill: "both" },
    );
  }).catch(() => {});
}
