export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16.5 9.5 11l3.5 3.5L20 7.5" />
          <path d="M15 7.5h5v5" />
        </svg>
      </span>
      <span className="text-[15px] leading-tight font-semibold tracking-tight text-fg">
        Personal Finance
      </span>
    </span>
  );
}
