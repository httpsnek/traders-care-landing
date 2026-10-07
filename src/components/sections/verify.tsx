import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Container } from "@/components/ui/container";
import { VerifyProof } from "./verify-proof";

// Блок 7 «Цифры, которым можно верить»: доверие + проверяемые результаты + безопасность.
// 1) Схема пути данных на всю ширину: Брокер → стеклянный ключ img-06 («инвесторский пароль, только чтение») → Traders Care →
//    Журнал / Публичная карточка. От бородки ключа вверх — перечёркнутые ветки «открыть сделку», «вывести деньги».
// 2) Сверка: публичная карточка сделки ↔ строка выписки MT5 (verify-proof.tsx). 3) Четыре факта безопасности.

// Точки ключа в img-06-*.webp (1660×820), сняты по пикселям: вход линии в головку, выход из кончика, верх бородки.
const KEY = { inY: 44.2, inX: 10.9, outY: 41.6, outX: 87.35, bladeTop: 34 };
// Раскладка схемы (в % ширины контейнера): картинка 54 % по центру (от 23 %); высота контейнера = высота картинки
// (1660×820 при ширине 54 % → пропорция контейнера 3.748 : 1). at() переводит % картинки в % контейнера.
const IMG = { left: 23, width: 54 }; // ключ по центру контейнера
const at = (xInImg: number) => +(IMG.left + (xInImg * IMG.width) / 100).toFixed(3);
// Мобильная схема: рамка W×H (условные единицы), ключ повёрнут на 90° по часовой: точка (x, y) картинки → (1 − y, x).
const KEY_ASPECT = 1660 / 820;
const M = (() => {
  const W = 350, H = 385, keyW = 44, keyT = 7;
  const keyH = (keyW * KEY_ASPECT * W) / H;              // высота рамки ключа, % высоты схемы
  const px = (u: number) => u * keyW;                     // доля ширины ключа → % ширины схемы
  const py = (v: number) => keyT + v * keyH;              // доля высоты ключа → % высоты схемы
  const headU = 1 - KEY.inY / 100, keyL = 50 - px(headU); // головка ключа — ровно по центру
  return {
    W, H, keyW, keyH, keyT, keyL,
    head: { x: 50, y: py(KEY.inX / 100) },
    tip: { x: keyL + px(1 - KEY.outY / 100), y: py(KEY.outX / 100) },
    blade: { x: keyL + px(1 - KEY.bladeTop / 100), y: [py(0.56), py(0.78)] },
  };
})();
const BROKER_AT = 24;   // точка «Брокер» — зеркально APP_AT относительно ключа
const APP_AT = 75;      // точка «Traders Care»

export function Verify({ t, locale }: { t: Dictionary["verify"]; locale: Locale }) {
  const d = t.diagram;
  const blocked = [d.trade, d.withdraw];
  const keyImg = (
    <>
      <Image src="/media/verify/img-06-dark.webp" alt="" fill unoptimized sizes="(min-width: 1024px) 740px, 100vw" className="object-cover [[data-theme=light]_&]:hidden" />
      <Image src="/media/verify/img-06-light.webp" alt="" fill unoptimized sizes="(min-width: 1024px) 740px, 100vw" className="hidden object-cover [[data-theme=light]_&]:block" />
    </>
  );
  const fade = "[mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_4%,#000_96%,transparent),linear-gradient(to_bottom,transparent,#000_4%,#000_96%,transparent)]";
  const struck = (label: string) => (
    <span className="whitespace-nowrap text-lp-small text-lp-muted">
      <span className="line-through decoration-lp-text/50">{label}</span>
      <span className="ml-1.5 text-[12px]">× {d.blocked}</span>
    </span>
  );

  return (
    <section id="verify" aria-labelledby="verify-title" className="py-section-sm lg:py-section">
      <Container>
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
          <h2 id="verify-title" className="text-lp-h2 text-lp-text lg:col-span-6">{t.title}</h2>
          <p className="max-w-[48ch] text-lp-lead text-lp-text-2 lg:col-span-5 lg:col-start-8">{t.lead}</p>
        </div>

        {/* Схема пути данных — десктоп. Всё в одной системе координат (высота контейнера = высота картинки),
            каждая линия — один сплошной отрезок от подписи до ключа, без стыков. */}
        <Reveal as="figure" amount={0.45} aria-label={d.aria} className="relative mt-16 hidden aspect-[3.748/1] lg:block">
          <div className={`absolute inset-y-0 ${fade} -translate-x-6 opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100 group-data-[seen]/rv:translate-x-0 motion-reduce:translate-x-0`} style={{ transitionDelay: "250ms", left: `${IMG.left}%`, width: `${IMG.width}%` }}>{keyImg}</div>

          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* Брокер → головка ключа. Зеркально правой стороне: точка, короткая линия, подпись выровнена вправо к точке. */}
            <div className="absolute -mt-[15px] text-right opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ top: `${KEY.inY}%`, right: `${100 - BROKER_AT}%` }}>
              <div className="flex h-[30px] items-center justify-end gap-3">
                <span className="whitespace-nowrap font-display text-[20px] font-medium tracking-[-0.01em] text-lp-text">{d.broker}</span>
                <span className="-mr-[4.5px] size-[9px] shrink-0 rounded-full bg-lp-accent" />
              </div>
              <div className="ml-auto mr-[-0.75px] mt-2 flex max-w-[20ch] flex-col items-end gap-2 border-r border-lp-text/35 py-1 pr-4 text-lp-small text-lp-text-2">
                {d.brokerSub.split(/,\s*/).map((x) => <span key={x} className="whitespace-nowrap">{x}</span>)}
              </div>
            </div>
            <span className="absolute h-[1.5px] bg-lp-accent origin-left scale-x-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:scale-x-100 motion-reduce:scale-x-100" style={{ transitionDelay: "150ms", top: `${KEY.inY}%`, left: `${BROKER_AT}%`, width: `${at(KEY.inX) - BROKER_AT}%` }} />

            {/* Кончик ключа → Traders Care */}
            <span className="absolute h-[1.5px] bg-lp-accent origin-left scale-x-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:scale-x-100 motion-reduce:scale-x-100" style={{ transitionDelay: "900ms", top: `${KEY.outY}%`, left: `${at(KEY.outX)}%`, width: `${APP_AT - at(KEY.outX)}%` }} />
            <div className="absolute -mt-[15px] opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ transitionDelay: "1250ms", top: `${KEY.outY}%`, left: `${APP_AT}%` }}>
              <div className="flex h-[30px] items-center gap-3">
                <span className="-ml-[4.5px] size-[9px] shrink-0 rounded-full bg-lp-accent" />
                <span className="whitespace-nowrap font-display text-[20px] font-medium tracking-[-0.01em] text-lp-text">{d.app}</span>
              </div>
              <div className="ml-[-0.75px] mt-2 flex flex-col gap-2 border-l border-lp-text/35 py-1 pl-4 text-lp-small text-lp-text-2">
                <span className="whitespace-nowrap">{d.journal}</span>
                <span className="whitespace-nowrap">{d.card}</span>
              </div>
            </div>

            {/* От бородки вверх — недоступные действия */}
            {[56, 78].map((xPct, k) => (
              <span key={xPct} className="absolute w-0 border-l border-dashed border-lp-text/35 translate-y-2 opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:translate-y-0 group-data-[seen]/rv:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100" style={{ transitionDelay: `${1100 + k * 150}ms`, left: `${at(xPct)}%`, top: "2%", height: `${KEY.bladeTop - 2}%` }}>
                <span className={`absolute -top-2 -translate-y-full ${k === 0 ? "right-0 translate-x-3" : "left-0 -translate-x-3"}`}>{struck(blocked[k])}</span>
              </span>
            ))}

            <span className="absolute -translate-x-1/2 text-center opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ transitionDelay: "700ms", top: "80%", left: `${at(50)}%` }}>
              <span className="block text-[15px] font-medium text-lp-text">{d.key}</span>
              <span className="block text-[12px] text-lp-muted">{d.keySub}</span>
            </span>
          </div>
        </Reveal>

        {/* Схема — мобильный и планшет: та же схема, что на десктопе, но вертикально и по центру.
            Ключ повёрнут на 90° по часовой: головка сверху, кончик снизу, бородка справа. Точки — из тех же замеров KEY,
            пересчитанных в координаты рамки (все % — от ширины/высоты рамки, см. M ниже). */}
        <Reveal as="figure" amount={0.35} aria-label={d.aria} className="mx-auto mt-10 w-full max-w-[400px] lg:hidden">
          <div className="text-center">
            <div className="font-display text-[20px] font-medium text-lp-text">{d.broker}</div>
            <div className="mt-1 text-[12px] leading-snug text-lp-muted">MetaTrader · cTrader · Match-Trader · DXtrade</div>
          </div>
          <div aria-hidden className="relative mt-3 w-full" style={{ aspectRatio: `${M.W}/${M.H}` }}>
            {/* Ключ: рамка 44 % ширины, картинка внутри повёрнута */}
            <div className="absolute -translate-y-4 opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100 group-data-[seen]/rv:translate-y-0 motion-reduce:translate-y-0" style={{ transitionDelay: "300ms", left: `${M.keyL}%`, top: `${M.keyT}%`, width: `${M.keyW}%`, height: `${M.keyH}%` }}>
              <div className={`absolute left-1/2 top-1/2 ${fade}`}
                style={{ width: `${KEY_ASPECT * 100}%`, height: `${100 / KEY_ASPECT}%`, transform: "translate(-50%, -50%) rotate(90deg)" }}>{keyImg}</div>
            </div>
            {/* Брокер → головка */}
            <span className="absolute w-[1.5px] -translate-x-1/2 bg-lp-accent origin-top scale-y-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:scale-y-100 motion-reduce:scale-y-100" style={{ transitionDelay: "100ms", left: `${M.head.x}%`, top: 0, height: `${M.head.y}%` }} />
            {/* Кончик → Traders Care */}
            <span className="absolute w-[1.5px] -translate-x-1/2 bg-lp-accent origin-top scale-y-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:scale-y-100 motion-reduce:scale-y-100" style={{ transitionDelay: "900ms", left: `${M.tip.x}%`, top: `${M.tip.y}%`, bottom: 0 }} />
            {/* От бородки вправо — недоступные действия */}
            {blocked.map((label, k) => (
              <span key={label} className="absolute flex -translate-y-1/2 items-center opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ transitionDelay: `${1100 + k * 150}ms`, left: `${M.blade.x}%`, top: `${M.blade.y[k]}%`, right: 0 }}>
                <span className="w-[14%] shrink-0 border-t border-dashed border-lp-text/35" />
                <span className="ml-2 min-w-0 text-[13px] leading-tight text-lp-muted">
                  <span className="block line-through decoration-lp-text/50">{label}</span>
                  <span className="block text-[11px]">× {d.blocked}</span>
                </span>
              </span>
            ))}
            {/* Подпись ключа — слева, на уровне бородки */}
            <span className="absolute -translate-y-1/2 text-right opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ transitionDelay: "700ms", left: 0, width: `${M.keyL - 3}%`, top: `${(M.blade.y[0] + M.blade.y[1]) / 2}%` }}>
              <span className="block text-[14px] font-medium leading-tight text-lp-text">{d.key}</span>
              <span className="mt-1 block text-[11px] leading-snug text-lp-muted">{d.keySub}</span>
            </span>
          </div>
          <div className="relative flex flex-col opacity-0 transition-[opacity,transform] duration-700 ease-lp motion-reduce:transition-none group-data-[seen]/rv:opacity-100 motion-reduce:opacity-100" style={{ transitionDelay: "1250ms", paddingLeft: `${M.tip.x}%` }}>
            <div className="-ml-[4.5px] flex items-center gap-3">
              <span className="size-[9px] shrink-0 rounded-full bg-lp-accent" />
              <span className="font-display text-[20px] font-medium text-lp-text">{d.app}</span>
            </div>
            <div className="ml-[-0.75px] mt-2 flex flex-col gap-1.5 border-l border-lp-text/35 py-1 pl-4 text-lp-small text-lp-text-2">
              <span>{d.journal}</span><span>{d.card}</span>
            </div>
          </div>
        </Reveal>

        {/* Результаты, которые нельзя нарисовать: публичная карточка ↔ выписка брокера */}
        <div className="mt-16 border-t border-lp-line pt-12 lg:mt-20 lg:pt-16">
          <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
            <h3 className="font-display text-[clamp(26px,2.6vw,36px)] font-medium leading-tight tracking-[-0.02em] text-lp-text lg:col-span-6">{t.proof.title}</h3>
            <p className="max-w-[48ch] text-lp-body text-lp-text-2 lg:col-span-5 lg:col-start-8">{t.proof.text}</p>
          </div>
          <div className="mt-12 lg:mt-16"><VerifyProof t={t.proof} locale={locale} /></div>
        </div>

        {/* Четыре факта безопасности — в строку, через тонкие разделители, без иконок */}
        <div className="mt-14 border-t border-lp-line pt-10 lg:mt-20">
          <h3 className="text-lp-h3 text-lp-text">{t.safety.title}</h3>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-lp-line">
            {t.safety.facts.map((fact) => (
              <li key={fact.t} className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
                <div className="text-[16px] font-semibold text-lp-text">{fact.t}</div>
                <p className="mt-2 text-lp-small text-lp-text-2">{fact.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
