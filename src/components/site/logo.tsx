// Знак Traders Care (контурная версия из шапки traderscare.io) + название.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5.6"
        strokeLinecap="butt" strokeLinejoin="miter" aria-hidden="true" className="shrink-0 text-lp-text">
        <path d="M51 17C46.5 11.6 40 8.5 32 8.5C19 8.5 8.5 19 8.5 32C8.5 45 19 55.5 32 55.5C40 55.5 46.5 52.4 51 47" />
        <path d="M21 24.5H55" />
        <path d="M38 24.5V44" />
      </svg>
      <span className="font-display text-[17px] font-semibold tracking-[-0.01em] text-lp-text">Traders Care</span>
    </span>
  );
}
