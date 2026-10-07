"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ставит data-seen, когда блок впервые попал в кадр (при reduced motion — сразу).
 *  Анимации — в CSS потомков через group-data-[seen]/rv: … (Tailwind), поэтому работает и внутри серверных компонентов. */
export function Reveal({ as: Tag = "div", amount = 0.3, className = "", children, ...rest }:
  { as?: "div" | "figure" | "ol" | "ul"; amount?: number; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const [instant, setInstant] = useState(false);
  useEffect(() => setInstant(reduced()), []);
  const El = Tag as "div";
  return <El ref={ref as React.Ref<HTMLDivElement>} data-seen={inView || instant ? "" : undefined} className={`group/rv ${className}`} {...rest}>{children}</El>;
}

/** Число набегает от 0 до `to`, когда start стал true. format — как показывать промежуточные значения. */
export function CountUp({ to, start, format, duration = 1.1, delay = 0 }: { to: number; start: boolean; format: (n: number) => string; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = useRef(format); fmt.current = format; // формат не перезапускает счёт при перерисовке
  useEffect(() => {
    const el = ref.current; if (!el || !start) return;
    if (reduced()) { el.textContent = fmt.current(to); return; }
    const c = animate(0, to, { duration, delay, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { el.textContent = fmt.current(v); } });
    return () => c.stop();
  }, [start, to, duration, delay]);
  return <span ref={ref}>{format(start ? 0 : to)}</span>;
}

/** Текст «печатается» по символу после start (с задержкой delay, шаг step мс). */
export function Typed({ text, start, delay = 0, step = 55 }: { text: string; start: boolean; delay?: number; step?: number }) {
  const [n, setN] = useState(text.length);
  useEffect(() => {
    if (!start || reduced()) { setN(text.length); return; }
    setN(0);
    let i = 0, id = 0;
    const t0 = window.setTimeout(() => { id = window.setInterval(() => { i++; setN(i); if (i >= text.length) clearInterval(id); }, step); }, delay);
    return () => { clearTimeout(t0); clearInterval(id); };
  }, [start, text, delay, step]);
  return <span>{text.slice(0, n)}<span className="invisible">{text.slice(n)}</span></span>;
}
