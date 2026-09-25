"use client";

type Snapshot = {
  capturedAt?: string;
  priceUsd?: number|null;
  liquidityUsd?: number;
  volume24hUsd?: number;
  buys5m?: number;
  sells5m?: number;
};

const money=(n:number)=>Math.abs(n)>=1e6?"$"+(n/1e6).toFixed(1)+"M":Math.abs(n)>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0);

export default function MarketResponse({ snapshots }: { snapshots: Snapshot[] }) {
  const rows=[...snapshots].filter(x=>x.capturedAt).sort((a,b)=>new Date(a.capturedAt!).getTime()-new Date(b.capturedAt!).getTime());
  if(rows.length<2) return <section className="mt-8 rounded-3xl border border-[var(--line)] p-6"><div className="mono text-[9px] text-[var(--muted)]">OBSERVED MARKET RESPONSE</div><div className="mt-3 text-sm text-[var(--muted)]">Collecting enough real snapshots to compare market response.</div><div className="mt-2 text-[10px] text-[var(--muted)]">FLOW does not invent historical movement when the feed has not supplied it.</div></section>;
  const first=rows[0], last=rows[rows.length-1];
  const delta=(a:number|undefined|null,b:number|undefined|null)=>a!=null&&b!=null?((b-a)/Math.max(Math.abs(a),1e-12))*100:null;
  const priceDelta=delta(first.priceUsd,last.priceUsd);
  const liqDelta=delta(first.liquidityUsd,last.liquidityUsd);
  const volDelta=delta(first.volume24hUsd,last.volume24hUsd);
  const buy0=(first.buys5m||0)+(first.sells5m||0), buy1=(last.buys5m||0)+(last.sells5m||0);
  const pressure0=buy0?(first.buys5m||0)/buy0*100:null, pressure1=buy1?(last.buys5m||0)/buy1*100:null;
  const pressureDelta=pressure0!=null&&pressure1!=null?pressure1-pressure0:null;
  const cards=[
    ["PRICE",priceDelta==null?"—":(priceDelta>=0?"+":"")+priceDelta.toFixed(1)+"%","Snapshot-to-snapshot change"],
    ["LIQUIDITY",liqDelta==null?"—":(liqDelta>=0?"+":"")+liqDelta.toFixed(1)+"%","Observed liquidity change"],
    ["24H VOLUME",volDelta==null?"—":(volDelta>=0?"+":"")+volDelta.toFixed(1)+"%","Reported volume change"],
    ["BUY PRESSURE",pressureDelta==null?"—":(pressureDelta>=0?"+":"")+pressureDelta.toFixed(1)+" pts","5M pressure change"],
  ];
  return <section className="mt-8 rounded-3xl border border-[var(--line)] p-6">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><div className="mono text-[9px] text-[var(--muted)]">OBSERVED MARKET RESPONSE</div><h2 className="mt-2 text-2xl font-semibold tracking-tight">What changed while FLOW watched</h2></div><div className="mono text-[8px] text-[var(--muted)]">{rows.length} REAL SNAPSHOTS</div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label,value,detail])=><div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="mono text-[8px] text-[var(--muted)]">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div><div className="mt-1 text-[9px] text-[var(--muted)]">{detail}</div></div>)}</div>
    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-[10px] leading-5 text-[var(--muted)]">Time-aligned observation across stored market snapshots. A change occurring after another signal does not establish that the signal caused the move.</div>
  </section>;
}
