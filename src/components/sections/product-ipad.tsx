"use client";

import { BarChart3, BookOpen, CalendarCheck, CircleAlert, Compass, Crosshair } from "lucide-react";
import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

// img-09: iPad Pro + Apple Pencil, строго сверху, обе темы (геометрия кадров совпадает).
// Экран в img-09-*.webp (1330×887) снят по пикселям: ровный прямоугольник без наклона,
// поэтому интерфейс не натягивается матрицей, а просто масштабируется — текст остаётся резким.
// Приложение свёрстано в «родных» 820×588 (пропорция экрана 937×672).
const SCREEN = { left: 10.526, top: 12.176, width: 70.451, height: 75.761 };
const UI_W = 820, UI_H = 588;
const NAV_ICONS = [Crosshair, BookOpen, BarChart3, CircleAlert, Compass, CalendarCheck];

export function ProductIpad({ tabs, active, onSelect, synced, demo, children }: {
  tabs: string[]; active: number; onSelect?: (i: number) => void; synced: string; demo: string; children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setScale(+((el.getBoundingClientRect().width * SCREEN.width) / 100 / UI_W).toFixed(4));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="relative aspect-[1330/887] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent),linear-gradient(to_bottom,transparent,#000_3%,#000_97%,transparent)]">
      <Image src="/media/product/img-09-dark.webp" alt="" fill unoptimized sizes="(min-width: 1440px) 1280px, 100vw" className="object-cover [[data-theme=light]_&]:hidden" />
      <Image src="/media/product/img-09-light.webp" alt="" fill unoptimized sizes="(min-width: 1440px) 1280px, 100vw" className="hidden object-cover [[data-theme=light]_&]:block" />

      {/* Экран iPad: приложение в тёмном или светлом режиме — вслед за темой сайта. Пока масштаб не посчитан — скрыт. */}
      <div className="absolute origin-top-left"
        style={{ left: `${SCREEN.left}%`, top: `${SCREEN.top}%`, width: UI_W, height: UI_H, transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        <div className="relative flex h-full overflow-hidden rounded-[14px] bg-lp-ground font-sans text-lp-text">
          {/* Статус-бар iPad */}
          <div aria-hidden className="absolute inset-x-0 top-0 z-10 flex h-[26px] items-center justify-between px-[18px] text-[11px] font-semibold">
            <span>9:41</span>
            <span className="flex items-center gap-[5px]">
              <span className="text-[10px] font-medium text-lp-text-2">100%</span>
              <span className="relative h-[10px] w-[21px] rounded-[3px] border border-lp-text/60 p-[1.5px]"><span className="block h-full w-full rounded-[1.5px] bg-lp-text" /></span>
            </span>
          </div>

          {/* Боковое меню приложения — активный пункт = выбранная вкладка на лендинге; пункты кликабельны (дублируют вкладки над iPad) */}
          <aside aria-hidden className="flex w-[196px] shrink-0 flex-col border-r border-lp-line bg-lp-raised/60 px-3 pb-4 pt-[40px]">
            <div className="px-2 font-display text-[15px] font-semibold tracking-[-0.01em]">Traders Care</div>
            <div className="mt-0.5 px-2 text-[11px] text-lp-muted">Prop 100K · Phase 1</div>
            <div className="mt-6 flex flex-col gap-0.5">
              {tabs.map((label, i) => {
                const Icon = NAV_ICONS[i];
                const on = i === active;
                return (
                  <button key={label} type="button" tabIndex={-1} onClick={() => onSelect?.(i)}
                    className={`flex w-full items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-left text-[13px] transition-colors duration-300 ${on ? "bg-lp-text/[0.07] text-lp-text" : "text-lp-text-2 hover:bg-lp-text/[0.04] hover:text-lp-text"}`}>
                    <Icon size={15} strokeWidth={1.8} className={on ? "text-lp-accent" : "text-lp-muted"} />{label}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto flex items-center gap-2 px-2 text-[11px] text-lp-muted">
              <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-lp-accent" />{synced}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col pt-[26px]">
            <div className="flex items-baseline justify-between px-6 pb-3 pt-4">
              <span className="font-display text-[20px] font-semibold tracking-[-0.02em]">{tabs[active]}</span>
              <span className="text-[11px] text-lp-muted">{demo}</span>
            </div>
            <div key={active} className="screen-in min-h-0 flex-1 px-6 pb-6 [&>*]:h-full">{children}</div>
          </div>

          {/* Лёгкий блик стекла поверх интерфейса */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.05)_0%,rgb(255_255_255/0)_40%)]" />
        </div>
      </div>
    </div>
  );
}
