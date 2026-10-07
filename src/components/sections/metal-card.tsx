import Image from "next/image";

// Металлическая карта (public/media/firms/img-07-*.webp, фон вырезан): картинка + тень + слой для «гравировки».
// Используется в «Проп-фирмах» (каскад) и в «Тарифах» (шапка колонок). Размеры текста внутри — в cqw от ширины карты.

export type Material = "graphite" | "titanium" | "violet" | "ceramic";


/** Цвет «гравировки» под материал: на тёмном металле светлый, на светлом — тёмный. Текст лежит на фото — от темы не зависит. */
export const INK: Record<Material, { main: string; sub: string }> = {
  graphite: { main: "text-white/90", sub: "text-white/55" },
  violet: { main: "text-white/90", sub: "text-white/60" },
  titanium: { main: "text-[#1d1d22]/85 mix-blend-multiply", sub: "text-[#1d1d22]/60 mix-blend-multiply" },
  ceramic: { main: "text-[#1d1d22]/85 mix-blend-multiply", sub: "text-[#1d1d22]/55 mix-blend-multiply" },
};

export function MetalCard({ material, sizes, className = "", style, children }: {
  material: Material; sizes: string; className?: string; style?: React.CSSProperties; children?: React.ReactNode;
}) {
  return (
    <div className={`[container-type:inline-size] ${className}`} style={style}>
      <div className="relative aspect-[1305/831] [filter:drop-shadow(0_2px_2px_rgb(0_0_0/0.35))_drop-shadow(0_24px_32px_rgb(0_0_0/0.45))] [[data-theme=light]_&]:[filter:drop-shadow(0_2px_2px_rgb(20_20_40/0.18))_drop-shadow(0_22px_30px_rgb(20_20_40/0.18))]">
        <Image src={`/media/firms/img-07-${material}.webp`} alt="" fill unoptimized sizes={sizes} className="select-none" />
        <div className="absolute inset-0 p-[7.5cqw]">{children}</div>
      </div>
    </div>
  );
}
