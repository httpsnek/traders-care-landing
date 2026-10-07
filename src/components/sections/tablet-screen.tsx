"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { toQuad } from "@/lib/homography";

// Планшет на столе в финальной сцене (img-08-dark.webp 2800×2089) лежит задней крышкой вверх:
// на ней полированный знак Traders Care. FACE — углы крышки в px картинки: левый, дальний, правый, ближний.
// При замене картинки — перемерить.
const IMG_W = 2800, IMG_H = 2089;
const FACE = [[1725, 1600], [2000, 1535], [2285, 1595], [2002.5, 1667.5]];
const UI_W = 800, UI_H = 600;

/** Накладывается внутрь контейнера со сценой (object-cover); pos — object-position сцены, доли 0..1. */
export function TabletScreen({ pos }: { pos: [number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current?.parentElement; if (!el) return;
    const upd = () => {
      const w = el.clientWidth, h = el.clientHeight, s = Math.max(w / IMG_W, h / IMG_H);
      const ox = (w - IMG_W * s) * pos[0], oy = (h - IMG_H * s) * pos[1];
      setM(toQuad(UI_W, UI_H, FACE.map(([x, y]) => [ox + x * s, oy + y * s])));
    };
    upd(); const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
  }, [pos]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute left-0 top-0 origin-top-left mix-blend-screen"
      style={{ width: UI_W, height: UI_H, transform: m ?? undefined, visibility: m ? "visible" : "hidden" }}>
        <div className="grid size-full place-items-center">
          <svg viewBox="0 0 64 64" width="210" height="210" fill="none" strokeWidth="6.8" aria-hidden>
            <defs>
              <linearGradient id="tab-logo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0" stopColor="#c4c4d2" /><stop offset="0.45" stopColor="#f4f4fa" /><stop offset="0.65" stopColor="#a2a2b6" /><stop offset="1" stopColor="#d8d8e4" />
              </linearGradient>
            </defs>
            <g stroke="url(#tab-logo)" opacity="0.85">
              <path d="M51 17C46.5 11.6 40 8.5 32 8.5C19 8.5 8.5 19 8.5 32C8.5 45 19 55.5 32 55.5C40 55.5 46.5 52.4 51 47" /><path d="M21 24.5H55" /><path d="M38 24.5V44" />
            </g>
          </svg>
        </div>
    </div>
  );
}
