"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type Token = {
  address:string; name:string; symbol:string; image:string|null; priceUsd:string|null;
  liquidityUsd:number; volume1h:number; volume24h:number; change1h:number; change24h:number;
  buys5m:number; sells5m:number; buys1h:number; sells1h:number; promoted:boolean;
};
type State = {ok:boolean; updatedAt?:string; tokens?:Token[]; error?:string};

const money=(n:number)=>n>=1e6?"$"+(n/1e6).toFixed(1)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0);
const price=(v:string|null)=>{if(!v)return "—";const n=Number(v);if(!Number.isFinite(n))return "—";return n>=1?"$"+n.toFixed(2):n>=.01?"$"+n.toFixed(4):"$"+n.toPrecision(4)};

export default function Discover() {
  const [state,setState]=useState<State|null>(null);
  const [filter,setFilter]=useState<"trending"|"moving"|"volume"|"new">("trending");
  async function load(){try{const r=await fetch("/api/discovery",{cache:"no-store"});setState(await r.json())}catch(e:any){setState({ok:false,error:e?.message||"Discovery unavailable"})}}
  useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t)},[]);
  const tokens=useMemo(()=>{const a=[...(state?.tokens||[])];if(filter==="volume")return a.sort((x,y)=>y.volume24h-x.volume24h);if(filter==="moving")return a.sort((x,y)=>y.change1h-x.change1h);if(filter==="new")return a.sort((x,y)=>y.buys5m+y.sells5m-x.buys5m-x.sells5m);return a.sort((x,y)=>(y.buys5m-y.sells5m)-(x.buys5m-x.sells5m))},[state?.tokens,filter]);
  const moving=tokens.filter(t=>t.change1h>0).length;
  const volume=tokens.reduce((n,t)=>n+t.volume24h,0);

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="font-semibold tracking-tight">La😂Print <span className="text-[var(--muted)]">/ VELOCITY</span></Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex"><Link className="text-[var(--fg)]" href="/discover">Discover</Link><Link href="/autopilot">Autopilot</Link><Link href="/trade">Trade</Link></nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs font-semibold">Connect</Link></div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 md:px-8 md:pt-16">
      <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
        <div><div className="mono text-[9px] uppercase tracking-[.2em] text-[var(--muted)]">Solana / live discovery</div><h1 className="mt-3 text-5xl font-semibold tracking-[-.055em] md:text-7xl">What&apos;s moving?</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Explore the market first. Follow price, liquidity, volume and transaction flow before deciding whether to act.</p></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[9px] text-[var(--muted)]">TRACKED</div><div className="mt-1 text-lg">{tokens.length}</div></div>
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[9px] text-[var(--muted)]">MOVING</div><div className="mt-1 text-lg">{moving}</div></div>
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[9px] text-[var(--muted)]">24H VOL</div><div className="mt-1 text-lg">{money(volume)}</div></div>
        </div>
      </div>

      <div className="mt-10 flex gap-2 overflow-x-auto pb-1">
        {([["trending","🔥 Trending"],["moving","⚡ Moving"],["volume","💧 Volume"],["new","◌ Active"]] as const).map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={"whitespace-nowrap rounded-full border px-4 py-2 text-xs "+(filter===v?"border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]":"border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--panel)]")}>{l}</button>)}
      </div>

      {state?.error&&<div className="mt-5 rounded-2xl border border-[var(--line)] p-5 text-sm text-[var(--muted)]">{state.error}</div>}

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map(t=>{const total=t.buys5m+t.sells5m;const buy=total?Math.round(t.buys5m/total*100):0;return <article key={t.address} className="group rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
          <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3">{t.image?<img src={t.image} alt="" className="h-10 w-10 rounded-full object-cover"/>:<div className="h-10 w-10 rounded-full border border-[var(--line)]"/>}<div><div className="font-semibold">{t.symbol}</div><div className="max-w-[150px] truncate text-[10px] text-[var(--muted)]">{t.name}</div></div></div><div className={"mono text-xs "+(t.change1h>=0?"":"text-[var(--muted)]")}>{t.change1h>=0?"+":""}{t.change1h.toFixed(1)}%</div></div>
          <div className="mt-7 flex items-end justify-between"><div className="text-2xl font-semibold tracking-tight">{price(t.priceUsd)}</div><div className="mono text-[9px] text-[var(--muted)]">1H</div></div>
          <div className="mt-5"><div className="flex justify-between text-[9px] text-[var(--muted)]"><span>BUY FLOW</span><span>{buy}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full bg-[var(--fg)]" style={{width:buy+"%"}}/></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4"><div><div className="mono text-[8px] text-[var(--muted)]">VOLUME</div><div className="mt-1 text-sm">{money(t.volume24h)}</div></div><div><div className="mono text-[8px] text-[var(--muted)]">LIQUIDITY</div><div className="mt-1 text-sm">{money(t.liquidityUsd)}</div></div></div>
          <div className="mt-5 flex gap-2"><button onClick={()=>{try{const k="velocity-watchlist";const a=JSON.parse(localStorage.getItem(k)||"[]");if(!a.some((x:any)=>x.address===t.address)){a.push(t);localStorage.setItem(k,JSON.stringify(a))}}catch{}}} className="rounded-full border border-[var(--line-strong)] px-4 py-3 text-xs">Watch</button><Link href={"/token?address="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="flex-1 rounded-full bg-[var(--fg)] px-4 py-3 text-center text-xs font-bold text-[var(--bg)]">View token</Link><Link href={"/trade?token="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="rounded-full border border-[var(--line-strong)] px-4 py-3 text-xs">Trade</Link></div>
        </article>})}
      </div>
      {!state?.error&&tokens.length===0&&<div className="rounded-2xl border border-[var(--line)] p-12 text-center text-sm text-[var(--muted)]">Waiting for live indexed Solana markets.</div>}
      <p className="mt-8 text-[10px] leading-5 text-[var(--muted)]">Market discovery is informational. A token appearing here is not a recommendation or guarantee of performance. Data is supplied by the connected market-data provider.</p>
    </section>
    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 p-2 backdrop-blur md:hidden"><Link href="/discover" className="py-3 text-center text-[10px] font-semibold">🔥 Discover</Link><Link href="/watch" className="py-3 text-center text-[10px] text-[var(--muted)]">◎ Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px] text-[var(--muted)]">⚡ Auto</Link><Link href="/connect/fund" className="py-3 text-center text-[10px] text-[var(--muted)]">◉ Wallet</Link></nav>
  </main>;
}
