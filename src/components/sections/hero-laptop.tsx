"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { toQuad } from "@/lib/homography";
import { LaptopScreen, NOTCH, SCREEN_H, SCREEN_W, WEEKS } from "./laptop-screen";

// Крышка ноутбука открывается по мере прокрутки. Кадры — public/media/hero/lid/000..143.webp (1920×1080)
// и lid-m/ (960×540, для телефона); для светлой темы — lid-light/ и lid-light-m/. Когда крышка встала, на экране
// «включается» интерфейс с кварталом трейдера.
//
// Геометрия кадра задаётся только CSS (рамка box), canvas и первый кадр-картинка рисуются внутри неё —
// поэтому при загрузке ничего не прыгает. Экран ноутбука — тоже внутри рамки, в её координатах.
//
// Десктоп (lg+): сцена на весь экран, текст над закрытым ноутбуком; прокрутка открывает крышку, текст уходит.
// Телефон: текст сверху, ноутбук во всю ширину под ним; прокрутка открывает крышку, затем камера «наезжает»
// на экран, текст уходит — на экране крупный (компактный) интерфейс. Reduced motion — сразу финал, без залипания.
//
// Производительность (телефон): кадры 960 px, кадры вокруг текущего распаковываются заранее (decode), перерисовка — только при смене кадра,
// геометрия наезда считается при изменении размеров, а не на каждое событие прокрутки; маски на большом слое нет
// (края растворяются градиентами поверх).
const FRAMES = 144;
const DESK_MQ = "(min-width: 1024px)";
type Theme = "dark" | "light";
// Тёмная тема — ноутбук Space Black на чёрном (lid/), светлая — серебристый на светлом (lid-light/); у каждой -m для телефона.
const src = (i: number, mobile: boolean, theme: Theme) =>
  `/media/hero/lid${theme === "light" ? "-light" : ""}${mobile ? "-m" : ""}/${String(i).padStart(3, "0")}.webp`;
// Стекло экрана в последнем кадре, в долях кадра: TL, TR, BR, BL (замер по кадру 143 каждой темы, 1920×1080).
const toFrac = (q: number[][]) => q.map(([x, y]) => [x / 1920, y / 1080]);
const SCREENS: Record<Theme, number[][]> = {
  dark: toFrac([[548.75, 113], [1373.75, 113], [1373.75, 647], [548.75, 647]]),
  light: toFrac([[546, 114], [1376, 114], [1376, 650], [546, 650]]),
};

// Фазы прокрутки (доля пути секции): крышка → короткая пауза ~15 % экрана (ноутбук стоит открытым — открытие и
// наезд не сливаются при инерционной прокрутке) → наезд камеры на экран → пауза ~0,55–0,7 экрана, чтобы график
// дорисовался. Общая длина прежняя (пауза взята из конечной). Десктоп: путь 180svh — крышка 0–0,45, наезд 0,53–0,69.
// Телефон: путь 190svh — крышка 0–0,342, наезд 0,42–0,62.
// fitW / fitH — какую долю ширины/высоты закреплённой области занимает экран ноутбука после наезда.
const DESK = { open: 0.45, zoomFrom: 0.53, zoomTo: 0.69, textFrom: 0.02, textTo: 0.2, fitW: 0.84, fitH: 0.78 };
const MOB = { open: 0.342, zoomFrom: 0.42, zoomTo: 0.62, textFrom: 0.42, textTo: 0.55, fitW: 0.94, fitH: 0.8 };
// Ограничение скорости: картинка догоняет прокрутку плавно (TAU) и не быстрее MAX_FPS кадров видео в секунду —
// при резком взмахе крышка всё равно проходит все кадры (без прыжков), а браузер успевает распаковать следующие.
// Саму прокрутку не трогаем. Если сцена ушла с экрана — сразу конечное состояние.
const MAX_FPS = 150, TAU = 0.06;
const WEEK_MS = 230; // квартал на экране прорисовывается за ~3 с

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// Сколько кадров вокруг текущего просим распаковать заранее (в сторону движения и обратно).
const AHEAD = 8;

export function HeroLaptop({ t, children }: { t: Dictionary["hero"]["visual"]; children: React.ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imgs = useRef<(HTMLImageElement | undefined)[]>([]);
  const warmed = useRef(new Set<number>());
  const frame = useRef(0);
  const drawn = useRef(-1);
  const onRef = useRef(false);
  // Геометрия наезда: пересчитывается при изменении размеров.
  const geo = useRef({ cx: 0, cy: 0, tx: 0, ty: 0, s: 1 });
  const [quad, setQuad] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [compact, setCompact] = useState(false);
  const [on, setOn] = useState(false);
  const [p, setP] = useState(0);
  const raf = useRef(0);

  // Заранее просим браузер распаковать кадры вокруг текущего (decode()): drawImage потом не ждёт распаковки.
  // Распакованные копии держит и выгружает сам браузер — вручную (ImageBitmap) это роняло вкладку.
  const warm = useCallback((center: number) => {
    for (let d = -AHEAD; d <= AHEAD; d++) {
      const i = center + d, im = imgs.current[i];
      if (!im || warmed.current.has(i)) continue;
      warmed.current.add(i);
      im.decode().catch(() => {}).finally(() => { if (Math.abs(i - frame.current) > AHEAD * 3) warmed.current.delete(i); });
    }
    // Далёкие кадры забываем — при возврате снова попросим распаковать.
    if (warmed.current.size > AHEAD * 6) for (const k of warmed.current) if (Math.abs(k - center) > AHEAD * 2) warmed.current.delete(k);
  }, []);

  // Ближайший загруженный кадр (пока грузятся — ближайший предыдущий). Рисуем только при смене кадра.
  const draw = useCallback((force = false) => {
    const c = canvas.current; if (!c) return;
    let i = frame.current;
    while (i > 0 && !imgs.current[i]) i--;
    const f = imgs.current[i];
    if (!f || (i === drawn.current && !force)) return;
    c.getContext("2d")?.drawImage(f, 0, 0, c.width, c.height);
    drawn.current = i;
    warm(i);
  }, [warm]);

  // Тема задаётся атрибутом data-theme на <html> (переключатель темы меняет его без перезагрузки).
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    read(); const mo = new MutationObserver(read); mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // Загрузка: первый кадр сразу, остальные — после загрузки страницы, в простое браузера (или сразу, если начали
  // прокручивать). Кадры хранятся сжатыми (onload, без decode()): распакованные 144 кадра — больше гигабайта,
  // вкладка падает. Распаковывается только окно вокруг текущего кадра (warm).
  useEffect(() => {
    const mobile = !matchMedia(DESK_MQ).matches;
    let cancelled = false, idle = 0;
    const asked = new Set<number>();
    // Смена темы — другие кадры: сбрасываем загруженные.
    imgs.current = []; warmed.current.clear(); drawn.current = -1;
    const c = canvas.current; c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    const load = (i: number) => {
      if (cancelled || asked.has(i)) return;
      asked.add(i);
      const im = new Image(); im.decoding = "async";
      im.onload = () => {
        if (cancelled) return;
        imgs.current[i] = im;
        if (Math.abs(i - frame.current) <= AHEAD) warm(frame.current);
        if (Math.abs(i - frame.current) <= 2 || i === 0) draw(true);
      };
      im.src = src(i, mobile, theme);
    };
    load(0); load(frame.current);
    let started = false;
    const rest = () => { if (started) return; started = true; load(FRAMES - 1); for (let i = 1; i < FRAMES - 1; i++) load(i); };
    const start = () => { idle = "requestIdleCallback" in window ? requestIdleCallback(rest, { timeout: 1200 }) : (setTimeout(rest, 300) as unknown as number); };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
    window.addEventListener("scroll", rest, { once: true, passive: true });
    return () => {
      cancelled = true; window.removeEventListener("load", start); window.removeEventListener("scroll", rest);
      if ("cancelIdleCallback" in window) cancelIdleCallback(idle); else clearTimeout(idle);
    };
  }, [draw, warm, theme]);

  // Размеры: canvas, экран ноутбука, геометрия наезда.
  useLayoutEffect(() => {
    const b = box.current, st = stage.current, pn = pin.current; if (!b || !st || !pn) return;
    const SCREEN = SCREENS[theme];
    const upd = () => {
      const bw = b.offsetWidth, bh = b.offsetHeight;
      const c = canvas.current;
      if (c) {
        const dpr = Math.min(2, devicePixelRatio || 1);
        const w = Math.round(bw * dpr), h = Math.round(bh * dpr);
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; draw(true); }
      }
      setQuad(toQuad(SCREEN_W, SCREEN_H, SCREEN.map(([x, y]) => [x * bw, y * bh])));
      // Наезд: центр экрана ноутбука → центр закреплённой области, экран → fitW ширины (но не выше fitH высоты).
      // Рамка: на телефоне по центру сцены, на десктопе прижата к низу и сдвинута вниз на 10 % своей высоты.
      const desk = matchMedia(DESK_MQ).matches, ph = desk ? DESK : MOB;
      const bx = (st.offsetWidth - bw) / 2, by = desk ? st.offsetHeight - bh * 0.9 : (st.offsetHeight - bh) / 2;
      const cx = bx + ((SCREEN[0][0] + SCREEN[1][0]) / 2) * bw, cy = by + ((SCREEN[0][1] + SCREEN[2][1]) / 2) * bh;
      const sw = (SCREEN[1][0] - SCREEN[0][0]) * bw, sh = (SCREEN[2][1] - SCREEN[0][1]) * bh;
      geo.current = { cx, cy, tx: pn.offsetWidth / 2, ty: pn.offsetHeight / 2 - st.offsetTop, s: Math.min((pn.offsetWidth * ph.fitW) / sw, (pn.offsetHeight * ph.fitH) / sh) };
      if (zoomRef.current) zoomRef.current.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    };
    upd(); const ro = new ResizeObserver(upd); ro.observe(b); ro.observe(pn); return () => ro.disconnect();
  }, [draw, theme]);

  // Прокрутка → кадр, экран, текст, наезд камеры. В обработчике только чтение одной позиции и запись стилей.
  useEffect(() => {
    const desk = matchMedia(DESK_MQ), still = matchMedia("(prefers-reduced-motion: reduce)");
    const setText = (k: number, dy: number) => {
      const tx = textRef.current; if (!tx) return;
      tx.style.opacity = k ? String(1 - k) : "";
      tx.style.transform = k ? `translate3d(0,${(-k * dy).toFixed(1)}px,0)` : "";
      tx.style.pointerEvents = k > 0.5 ? "none" : "";
    };
    const setZoom = (k: number) => {
      const z = zoomRef.current; if (!z) return;
      if (!k) { z.style.transform = ""; return; }
      const g = geo.current, s = 1 + (g.s - 1) * k;
      z.style.transform = `translate3d(${((g.tx - g.cx) * k).toFixed(1)}px, ${((g.ty - g.cy) * k).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    };
    const setScreen = (v: boolean) => { if (onRef.current !== v) { onRef.current = v; setOn(v); } };
    // Прокрутка задаёт только цель; показанное положение догоняет её в цикле кадров.
    let target = 0, shown = 0, last = 0, loop = 0, running = false;
    const apply = (pr: number) => {
      const ph = desk.matches ? DESK : MOB;
      frame.current = Math.round(clamp(pr / ph.open) * (FRAMES - 1));
      draw();
      setScreen(pr >= ph.open);
      setText(smooth(ph.textFrom, ph.textTo, pr), desk.matches ? 60 : 90);
      setZoom(smooth(ph.zoomFrom, ph.zoomTo, pr));
    };
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const ph = desk.matches ? DESK : MOB;
      const vmax = (MAX_FPS / (FRAMES - 1)) * ph.open; // доля пути в секунду при MAX_FPS кадрах видео
      const d = target - shown;
      // Ограничение нужно только там, где меняются кадры видео (крышка). В паузе и наезде кадр стоит —
      // там догоняем в 4 раза быстрее, чтобы, например, возврат наверх не «проигрывал» пустые участки.
      const cap = Math.min(shown, target) < ph.open ? vmax : vmax * 4;
      shown += Math.sign(d) * Math.min(Math.abs(d) * (1 - Math.exp(-dt / TAU)), cap * dt);
      if (Math.abs(target - shown) < 0.0004) shown = target;
      apply(shown);
      if (shown !== target) loop = requestAnimationFrame(step); else running = false;
    };
    const onScroll = () => {
      const el = section.current, pn = pin.current; if (!el || !pn) return;
      const r = el.getBoundingClientRect();
      target = clamp(-r.top / Math.max(1, el.offsetHeight - pn.offsetHeight));
      // Сцена за пределами экрана — анимировать некому: сразу в цель.
      if (r.bottom <= 0 || r.top >= innerHeight) { shown = target; cancelAnimationFrame(loop); running = false; apply(shown); return; }
      if (!running) { running = true; last = performance.now(); loop = requestAnimationFrame(step); }
    };
    const jump = () => { onScroll(); shown = target; apply(shown); };
    const setup = () => {
      setCompact(!desk.matches);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", jump);
      setText(0, 0); setZoom(0);
      if (still.matches) { frame.current = FRAMES - 1; draw(); setScreen(true); return; }
      window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", jump);
      jump(); // при загрузке посреди страницы — сразу нужное состояние, без анимации
    };
    setup();
    desk.addEventListener("change", setup); still.addEventListener("change", setup);
    return () => {
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", jump);
      desk.removeEventListener("change", setup); still.removeEventListener("change", setup); cancelAnimationFrame(loop);
    };
  }, [draw]);

  // Экран включился — квартал прорисовывается заново.
  const play = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(WEEKS); return; }
    const t0 = performance.now() + 450;
    const tick = (now: number) => { const v = clamp((now - t0) / WEEK_MS, 0, WEEKS); setP(v); if (v < WEEKS) raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => { if (on) play(); else { cancelAnimationFrame(raf.current); setP(0); } return () => cancelAnimationFrame(raf.current); }, [on, play]);

  const edge = "pointer-events-none absolute from-lp-ground to-transparent";
  return (
    <div ref={section} className="relative h-[290svh] bg-lp-ground lg:h-[280svh] motion-reduce:h-auto">
      <div ref={pin} className="sticky top-header flex h-[calc(100svh-var(--lp-header-h))] flex-col overflow-hidden motion-reduce:static motion-reduce:h-auto">
        <div ref={textRef} className="relative z-10 shrink-0 lg:absolute lg:inset-x-0 lg:top-[clamp(20px,5svh,56px)]">{children}</div>

        {/* Для скринридеров: сцена — декорация (aria-hidden), её смысл — одной фразой. Заголовок и кнопки выше — обычный текст. */}
        <p className="sr-only">{t.aria}</p>
        <div ref={stage} aria-hidden className="relative flex-1 [container-type:size] motion-reduce:min-h-[70vw] lg:absolute lg:inset-0 lg:min-h-0 lg:[container-type:normal]">
          <div ref={zoomRef} className="absolute inset-0">
            {/* Рамка кадра. Телефон: 140 % ширины (ноутбук во всю ширину), но не выше сцены (215cqh — открытый ноутбук целиком), по центру.
                Десктоп: по высоте сцены, видимая часть — 84 % высоты, низ срезан на 10 %. */}
            <div ref={box}
              className="absolute left-1/2 top-1/2 aspect-video w-[min(140cqw,215cqh)] -translate-x-1/2 -translate-y-1/2 lg:bottom-0 lg:top-auto lg:h-[93.334%] lg:w-auto lg:translate-y-[10%]">
              {/* Первый кадр каждой темы; лишняя тема скрыта CSS до загрузки JS — без вспышки не той темы */}
              {(["dark", "light"] as const).map((th) => (
                <picture key={th} className={th === "light" ? "hidden [[data-theme=light]_&]:contents" : "contents [[data-theme=light]_&]:hidden"}>
                  <source media={DESK_MQ} srcSet={src(0, false, th)} />
                  <img src={src(0, true, th)} alt="" fetchPriority={th === "dark" ? "high" : "auto"} className="absolute inset-0 size-full" />
                </picture>
              ))}
              <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
              {/* Края кадра растворяются в фоне страницы (вместо маски — дешевле при прокрутке) */}
              <div aria-hidden className={`${edge} inset-x-0 top-0 h-[14%] bg-gradient-to-b`} />
              <div aria-hidden className={`${edge} inset-y-0 left-0 w-[12%] bg-gradient-to-r`} />
              <div aria-hidden className={`${edge} inset-y-0 right-0 w-[12%] bg-gradient-to-l`} />
              <div aria-hidden className={`${edge} inset-x-0 bottom-0 h-[16%] bg-gradient-to-t lg:hidden`} />

              {/* Экран: интерфейс «включается», когда крышка встала */}
              <div aria-hidden className="absolute left-0 top-0 origin-top-left"
                style={{ width: SCREEN_W, height: SCREEN_H, transform: quad ?? undefined, visibility: quad ? "visible" : "hidden" }}>
                <div className={`relative size-full rounded-t-[6px] transition-opacity ease-out ${on ? "opacity-100 duration-700" : "opacity-0 duration-300"}`}>
                  {/* Светлая тема: на верхней рамке экрана в кадре засветка от студийного света — закрываем рамку чёрной
                      подложкой точно по её форме в кадре (lid-light/143: рамка слева 16, справа 14,5, сверху 16 px,
                      радиус внешнего угла ~25 px; 1 ед. экрана ≈ 1 px кадра). */}
                  <span aria-hidden className="pointer-events-none absolute hidden bg-[#070708] [[data-theme=light]_&]:block"
                    style={{ left: -16, right: -14.5, top: -16, bottom: -10, borderRadius: "25px 25px 6px 6px" }} />
                  <LaptopScreen t={t} p={p} onReplay={play} compact={compact} />
                  {/* Чёлка поверх экрана с заходом в рамку: внутри экрана её верхний край обрезается по скруглённому
                      краю, и в субпиксельный просвет проглядывала строка меню (светлая полоска). */}
                  <span className="pointer-events-none absolute rounded-b-[5px] bg-black [[data-theme=light]_&]:bg-[#070708]" style={{ left: NOTCH.x, width: NOTCH.w, top: -3, height: NOTCH.h + 3 }} />
                  {/* Блик студийного света на стекле — только в тёмной теме: на светлом интерфейсе он выглядит как засветка */}
                  <div className="pointer-events-none absolute inset-0 rounded-t-[6px] bg-[radial-gradient(70%_45%_at_50%_0%,rgb(255_255_255/0.06),transparent_70%)] [[data-theme=light]_&]:hidden" />
                </div>
              </div>
            </div>
          </div>
          {/* Стык с фоном страницы снизу */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%] bg-gradient-to-b from-transparent to-lp-ground" />
        </div>
      </div>
    </div>
  );
}
