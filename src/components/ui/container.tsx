import type { ComponentProps } from "react";

/** Контейнер 1280 с полями 20 / 40 / 80. */
export function Container({ className = "", ...rest }: ComponentProps<"div">) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 md:px-10 2xl:px-20 ${className}`} {...rest} />;
}
