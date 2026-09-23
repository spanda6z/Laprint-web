export default function FlowMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "flow-mark flow-mark-compact" : "flow-mark"} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 9.5C9 9.5 10.2 22.5 16 22.5C21.8 22.5 23 9.5 28 9.5" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
        <path d="M4 16C9 16 10.2 26.5 16 26.5C21.8 26.5 23 16 28 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
      </svg>
    </span>
  );
}
