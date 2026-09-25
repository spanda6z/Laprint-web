"use client";

export default function MarketIntelStrip({ tracked, moving, volume, updatedLabel }: { tracked:number; moving:number; volume:string; updatedLabel:string }) {
  const cells = [
    ["MARKETS TRACKED", tracked.toLocaleString(), "LIVE INDEX"],
    ["MOVING NOW", moving.toLocaleString(), "1H POSITIVE"],
    ["24H VOLUME", volume, "CURRENT FEED"],
    ["DATA FRESHNESS", updatedLabel, "LAST SNAPSHOT"],
  ];
  return <div className="grid overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] sm:grid-cols-2 lg:grid-cols-4">
    {cells.map(([label,value,meta], i)=><div key={label} className={"p-4 "+(i<3?"border-b sm:border-b-0 sm:border-r":"")+" border-[var(--line)]"}>
      <div className="mono text-[8px] tracking-[.16em] text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-lg font-semibold tracking-tight">{value}</div>
      <div className="mono mt-1 text-[7px] text-[var(--muted)]">{meta}</div>
    </div>)}
  </div>;
}
