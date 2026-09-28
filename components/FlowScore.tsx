"use client";
import { bandClass, flowScore, type FlowToken } from "@/lib/flow";
export default function FlowScore({ token, compact = false }: { token: FlowToken; compact?: boolean }) {
  const result = flowScore(token);
  return <div className={compact ? "" : "rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5"}>
    <div className="flex items-end justify-between gap-4"><div><div className="mono text-[8px] tracking-[.16em] text-[var(--muted)]">FLOW SCORE</div><div className="mt-2 text-3xl font-semibold tracking-[-.05em]">{result.score}</div></div><div className="text-right"><div className={"text-sm font-semibold " + bandClass(result.band)}>{result.band}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{result.confidence} confidence</div></div></div>
    {!compact && <><div className="mt-5 grid grid-cols-2 gap-3">{[["Buy / sell flow", result.buyPressure == null ? "Missing" : Math.round(result.buyPressure) + "% buy"],["Liquidity depth", result.liquidityComponent == null ? "Missing" : Math.round(result.liquidityComponent) + "/100"],["Volume quality", result.volumeQuality == null ? "Missing" : Math.round(result.volumeQuality) + "/100"],["Holder spread", result.missing.includes("holder spread") ? "Missing" : "Available"],["Risk flags", result.missing.length ? "Incomplete" : "Checked"]].map(([label,value])=><div key={label} className="rounded-xl border border-[var(--line)] p-3"><div className="text-[9px] text-[var(--muted)]">{label}</div><div className="mt-1 text-xs font-medium">{value}</div></div>)}</div>{result.missing.length>0&&<div className="mt-4 text-[9px] leading-5 text-[var(--muted)]">Missing data lowers confidence, and we show it. Structural fields currently unavailable: {result.missing.join(", ")}.</div>}</>}
  </div>;
}
