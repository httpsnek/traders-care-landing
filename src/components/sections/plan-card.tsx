"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";
import { INK, MetalCard, type Material } from "./metal-card";

// Карта тарифа с переворотом: лицо — название и цена; оборот — характеристики гравировкой.
// Переворот — альтернативный способ посмотреть данные (они же есть под картой), поэтому по клику, не по наведению.
// Тень (filter) живёт внутри каждой стороны: filter на вращающемся родителе сломал бы 3D (preserve-3d).
// При reduced motion — мгновенная смена без вращения.

export function PlanCard({ material, name, price, perMonth, specs, flip, flipBack, sizes }: {
  material: Material; name: string; price: number; perMonth: string;
  specs: [string, string][]; flip: string; flipBack: string; sizes: string;
}) {
  const [back, setBack] = useState(false);
  const ink = INK[material];
  const face = "absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

  return (
    <button type="button" aria-pressed={back} aria-label={`${name}, $${price} ${perMonth}. ${back ? flipBack : flip}`}
      onClick={() => setBack((b) => !b)}
      className="group relative block aspect-[1305/831] w-full text-left [perspective:1400px] focus-visible:outline-none">
      <span className={`absolute inset-0 transition-transform duration-700 ease-lp [transform-style:preserve-3d] motion-reduce:transition-none ${back ? "[transform:rotateY(180deg)]" : ""}`}>
        {/* Лицо */}
        <span className={face}>
          <MetalCard material={material} sizes={sizes}>
            <span className="flex h-full flex-col justify-between">
              <span className="flex items-start justify-between">
                <span className={`font-display text-[8cqw] font-semibold leading-none tracking-[-0.02em] ${ink.main}`}>{name}</span>
                <RotateCw aria-hidden className={`size-[5cqw] opacity-60 transition-transform duration-500 group-hover:rotate-90 ${ink.sub}`} strokeWidth={1.75} />
              </span>
              <span className="flex items-baseline gap-[1.5cqw]">
                <span className={`font-display text-[17cqw] font-medium leading-none tracking-[-0.04em] tabular-nums ${ink.main}`}>${price}</span>
                <span className={`text-[5cqw] ${ink.sub}`}>{perMonth}</span>
              </span>
            </span>
          </MetalCard>
        </span>
        {/* Оборот — характеристики гравировкой */}
        <span className={`${face} [transform:rotateY(180deg)]`}>
          <MetalCard material={material} sizes={sizes}>
            <span className="flex h-full flex-col justify-between">
              <span className="flex items-start justify-between">
                <span className={`font-display text-[6.5cqw] font-semibold leading-none tracking-[-0.02em] ${ink.main}`}>{name}</span>
                <span className={`font-display text-[6.5cqw] font-medium leading-none tabular-nums ${ink.main}`}>${price}</span>
              </span>
              <span className="grid gap-[1.8cqw] font-mono text-[4.3cqw] leading-none">
                {specs.map(([k, v]) => (
                  <span key={k} className="flex justify-between gap-[3cqw] border-t pt-[1.8cqw]" style={{ borderColor: "currentColor" }}>
                    <span className={ink.sub}>{k}</span><span className={ink.main}>{v}</span>
                  </span>
                ))}
              </span>
            </span>
          </MetalCard>
        </span>
      </span>
      <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[22px] ring-2 ring-lp-accent opacity-0 transition-opacity group-focus-visible:opacity-100" />
    </button>
  );
}
