import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-sans font-semibold " +
  "transition-[background-color,border-color,color,transform] duration-200 ease-lp active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-lp-accent text-lp-on-accent hover:bg-lp-accent/90",
  secondary: "border border-lp-line text-lp-text hover:border-lp-text/40 hover:bg-lp-text/[0.04]",
  ghost: "text-lp-text-2 hover:text-lp-text",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-[15px]",
  lg: "h-[52px] px-6 text-base",
};

const buttonClass = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();

type Props = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

/** Кнопка-ссылка. На лендинге все действия — переходы, поэтому <a>, а не <button>. */
export function ButtonLink({ variant, size, className = "", ...rest }: Props) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
