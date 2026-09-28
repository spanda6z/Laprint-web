"use client";
import { bandClass, flowScore, type FlowResult, type FlowToken } from "@/lib/flow";

export default function FlowScore({
  token,
  compact = false,
  result: supplied,
}: {
  token: FlowToken;
  compact?: boolean;
  result?: FlowResult | null;
}) {
  const result = supplied ?? flowScore(token);
  return (
    <div className={compact ? "" : "rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mono text-[8px] tracking-[.16em] text-[var(--muted)]">FLOW SCORE · {result.formulaVersion}</div>
          <div className="mt-2 text-3xl font-semibold tracking-[-.05em]">{result.score ?? "—"}</div>
        </div>
        <div className="text-right">
          <div className={"text-sm font-semibold " + bandClass(result.band)}>{result.band}</div>
          <div className="mt-1 text-[10px] text-[var(--muted)]">{result.confidence.toLowerCase()} confidence</div>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-4 rounded-xl border border-[var(--line)] p-3 text-xs">
            {result.label}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {result.parts.map((part) => (
              <div key={part.key} className="rounded-xl border border-[var(--line)] p-3">
                <div className="text-[9px] text-[var(--muted)]">{part.key}</div>
                <div className="mt-1 text-xs font-medium">
                  {part.value == null ? "Missing" : `${part.pts} / ${part.weight}`}
                </div>
              </div>
            ))}
          </div>
          {result.causes.length > 0 && (
            <div className="mt-5">
              <div className="mono text-[8px] text-[var(--muted)]">OBSERVED SIGNALS</div>
              <ul className="mt-2 space-y-2 text-xs">
                {result.causes.map((cause) => <li key={cause}>• {cause}</li>)}
              </ul>
            </div>
          )}
          {result.cappedByRisk && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[10px] leading-5 text-amber-400">
              Score capped at 60 because an active token authority is present.
            </div>
          )}
          {result.missing.length > 0 && (
            <div className="mt-4 text-[9px] leading-5 text-[var(--muted)]">
              Missing data lowers confidence, and we show it: {result.missing.join(", ")}.
            </div>
          )}
          <div className="mt-5 text-[9px] leading-5 text-[var(--muted)]">
            High score is not a buy signal. FLOW describes measured market conditions; it does not predict price.
          </div>
        </>
      )}
    </div>
  );
}
