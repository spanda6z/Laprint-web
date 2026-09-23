"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import FlowMark from "@/components/FlowMark";

type Token = {
  address:string; name:string; symbol:string; image:string|null; priceUsd:string|null;
  liquidityUsd:number; volume1h:number; volume24h:number; change1h:number; change24h:number;
  buys5m:number; sells5m:number; buys1h:number; sells1h:number; buys24h:number; sells24h:number;
  marketCap:number|null; promoted:boolean; createdAt?:number|null;
};
type State = {ok:boolean; updatedAt?:string; tokens?:Token[]; error?:string};

const money=(n:number)=>n>=1e9?"$"+(n/1e9).toFixed(1)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0);
const price=(v:string|null)=>{if(!v)return "—";const n=Number(v);if(!Number.isFinite(n))return "—";return n>=1?"$"+n.toFixed(2):n>=.01?"$"+n.toFixed(4):"$"+n.toPrecision(4)};
const pct=(n:number)=>(n>=0?"+":"")+n.toFixed(1)+"%";
const age=(ts?:number|null)=>{if(!ts)return "—";const mins=Math.max(0,Math.floor((Date.now()-ts*1000)/60000));return mins<60?mins+"m":mins<1440?Math.floor(mins/60)+"h":Math.floor(mins/1440)+"d"};

function FlowBar({buy}:{buy:number}) {
  return <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full bg-[var(--fg)] transition-[width] duration-500" style={{width:buy+"%"}} /></div>;
}

export default function Discover() {
  const [state,setState]=useState<State|null>(null);
  const [filter,setFilter]=useState<"trending"|"moving"|"volume"|"new">("trending");
  const [query,setQuery]=useState("");
  const [watching,setWatching]=useState<Set<string>>(new Set());

  async function load(){
    try{const r=await fetch("/api/discovery",{cache:"no-store"});setState(await r.json())}
    catch(e:any){setState({ok:false,error:e?.message||"Discovery unavailable"})}
  }

  useEffect(()=>{
    void load();
    const t=setInterval(load,30000);
    try{const saved=JSON.parse(localStorage.getItem("velocity-watchlist")||"[]");setWatching(new Set(saved.map((x:Token)=>x.address)))}catch{}
    return()=>clearInterval(t);
  },[]);

  const allTokens=state?.tokens||[];
  const tokens=useMemo(()=>{
    const q=query.trim().toLowerCase();
    const a=[...allTokens].filter(x=>!q||x.symbol.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)||x.address.toLowerCase()===q);
    if(filter==="volume")return a.sort((x,y)=>y.volume24h-x.volume24h);
    if(filter==="moving")return a.sort((x,y)=>y.change1h-x.change1h);
    if(filter==="new")return a.sort((x,y)=>(y.createdAt||0)-(x.createdAt||0));
    return a.sort((x,y)=>(y.buys5m-y.sells5m)-(x.buys5m-x.sells5m));
  },[allTokens,filter,query]);

  const moving=allTokens.filter(t=>t.change1h>0).length;
  const volume=allTokens.reduce((n,t)=>n+t.volume24h,0);
  const pulse=[...allTokens].sort((a,b)=>b.change1h-a.change1h).slice(0,6);
  const updated=state?.updatedAt?new Date(state.updatedAt).getTime():0;
  const updatedLabel=updated?Math.max(0,Math.floor((Date.now()-updated)/1000))+"s ago":"waiting";

  function toggleWatch(t:Token){
    try{
      const key="velocity-watchlist";
      const list:Token[]=JSON.parse(localStorage.getItem(key)||"[]");
      const exists=list.some(x=>x.address===t.address);
      const next=exists?list.filter(x=>x.address!==t.address):[...list,t];
      localStorage.setItem(key,JSON.stringify(next));
      setWatching(new Set(next.map(x=>x.address)));
    }catch{}
  }

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3"><FlowMark compact/><span className="font-semibold tracking-[-.04em]">FLOW</span></Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          <Link className="text-[var(--fg)]" href="/discover">Discover</Link><Link href="/watch">Watch</Link><Link href="/autopilot">Auto</Link><Link href="/trade">Trade</Link>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs font-semibold">Connect</Link></div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 pb-12 pt-10 md:px-8 md:pt-14">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <div className="mono flex items-center gap-2 text-[9px] uppercase tracking-[.2em] text-[var(--muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"/>Solana / live market intelligence</div>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-.065em] md:text-7xl">See what&apos;s <span className="text-[var(--accent)]">moving.</span></h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">Explore live markets, then investigate the price, liquidity, volume and transaction flow behind every move.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 md:min-w-[360px]">
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[8px] text-[var(--muted)]">TRACKED</div><div className="mt-1 text-xl font-semibold">{allTokens.length}</div></div>
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[8px] text-[var(--muted)]">MOVING</div><div className="mt-1 text-xl font-semibold">{moving}</div></div>
          <div className="border-l border-[var(--line-strong)] pl-3"><div className="mono text-[8px] text-[var(--muted)]">24H VOL</div><div className="mt-1 text-xl font-semibold">{money(volume)}</div></div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-y border-[var(--line)] py-3">
        <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"/><span className="mono text-[8px] uppercase tracking-[.16em]">Data live</span><span className="text-[10px] text-[var(--muted)]">Updated {updatedLabel}</span></div>
        <div className="mono hidden text-[8px] text-[var(--muted)] sm:block">{allTokens.length} MARKETS IN CURRENT FEED</div>
      </div>

      {pulse.length>0&&<section className="mt-6 overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div><div className="mono text-[8px] tracking-[.18em] text-[var(--muted)]">MARKET PULSE</div><div className="mt-1 text-xs text-[var(--muted)]">Largest positive 1H moves in the current feed</div></div><span className="mono text-[8px] text-[var(--muted)]">LIVE</span></div>
        <div className="grid divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-6">
          {pulse.map(t=>{const total=t.buys5m+t.sells5m;const buy=total?Math.round(t.buys5m/total*100):0;return <Link key={t.address} href={"/token?address="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="group p-4 transition hover:bg-[var(--panel)]">
            <div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm">{t.symbol}</span><span className="mono text-[9px]">{pct(t.change1h)}</span></div>
            <div className="mt-3 text-[10px] text-[var(--muted)]">{price(t.priceUsd)}</div>
            <div className="mt-3 flex items-center justify-between text-[8px] text-[var(--muted)]"><span>BUY FLOW</span><span>{buy}%</span></div><FlowBar buy={buy}/>
          </Link>})}
        </div>
      </section>}

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search token, symbol or contract address…" className="w-full bg-transparent pr-12 text-sm outline-none placeholder:text-[var(--muted)]" /><span className="mono pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-[var(--muted)]">⌘K</span></div>
        {query&&<button onClick={()=>setQuery("")} className="rounded-2xl border border-[var(--line-strong)] px-5 py-3 text-xs">Clear</button>}
      </div>

      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        {([["trending","Trending"],["moving","Moving"],["volume","Volume"],["new","New"]] as const).map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={"whitespace-nowrap rounded-full border px-4 py-2 text-xs "+(filter===v?"border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)]":"border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--panel)]")}>{l}</button>)}
      </div>

      {state?.error&&<div className="mt-5 rounded-2xl border border-[var(--line)] p-5 text-sm text-[var(--muted)]">{state.error}</div>}

      <div className="mt-7 flex items-end justify-between">
        <div><div className="mono text-[8px] tracking-[.18em] text-[var(--muted)]">{filter.toUpperCase()}</div><h2 className="mt-1 text-2xl font-semibold tracking-tight">{query?"Results for “"+query+"”":filter==="trending"?"Markets with active buy flow":filter==="moving"?"Largest 1H price changes":filter==="volume"?"Highest 24H volume":"Recently created markets"}</h2></div>
        <div className="mono hidden text-[8px] text-[var(--muted)] sm:block">{tokens.length} RESULTS</div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tokens.map(t=>{
          const total5=t.buys5m+t.sells5m; const buy=total5?Math.round(t.buys5m/total5*100):0; const net5=t.buys5m-t.sells5m;
          return <article key={t.address} className="group rounded-[26px] border border-[var(--line)] bg-[var(--panel)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--line-strong)]">
            <div className="flex items-start justify-between gap-4">
              <Link href={"/token?address="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="flex min-w-0 items-center gap-3">
                {t.image?<img src={t.image} alt="" className="h-11 w-11 rounded-full object-cover"/>:<div className="h-11 w-11 rounded-full border border-[var(--line)]"/>}
                <div className="min-w-0"><div className="font-semibold">{t.symbol}</div><div className="max-w-[150px] truncate text-[10px] text-[var(--muted)]">{t.name}</div></div>
              </Link>
              <div className="text-right"><div className={"mono text-xs "+(t.change1h>=0?"":"text-[var(--muted)]")}>{pct(t.change1h)}</div><div className="mono mt-1 text-[8px] text-[var(--muted)]">1H</div></div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div><div className="text-2xl font-semibold tracking-tight">{price(t.priceUsd)}</div><div className="mt-1 text-[9px] text-[var(--muted)]">LIVE PRICE</div></div>
              <div className="text-right"><div className="text-sm font-semibold">{pct(t.change24h)}</div><div className="mono mt-1 text-[8px] text-[var(--muted)]">24H</div></div>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 p-4">
              <div className="flex items-center justify-between text-[9px]"><span className="mono text-[var(--muted)]">MARKET FLOW · 5M</span><span className="font-semibold">{buy}% BUY</span></div>
              <FlowBar buy={buy}/>
              <div className="mt-3 flex justify-between text-[9px] text-[var(--muted)]"><span>{t.buys5m} buys</span><span>{t.sells5m} sells</span></div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><div className="mono text-[8px] text-[var(--muted)]">MCAP</div><div className="mt-1 text-sm">{t.marketCap==null?"—":money(t.marketCap)}</div></div>
              <div><div className="mono text-[8px] text-[var(--muted)]">VOL 24H</div><div className="mt-1 text-sm">{money(t.volume24h)}</div></div>
              <div><div className="mono text-[8px] text-[var(--muted)]">LIQUIDITY</div><div className="mt-1 text-sm">{money(t.liquidityUsd)}</div></div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4 text-[8px] text-[var(--muted)]"><span>NET FLOW {net5>=0?"+":""}{net5}</span><span>24H TXNS {t.buys24h+t.sells24h}</span>{t.createdAt&&<span>NEW {age(t.createdAt)}</span>}</div>

            <div className="mt-4 flex gap-2">
              <button onClick={()=>toggleWatch(t)} className={"rounded-full border px-4 py-3 text-xs "+(watching.has(t.address)?"border-[var(--fg)]":"border-[var(--line-strong)]")}>{watching.has(t.address)?"Watching":"Watch"}</button>
              <Link href={"/token?address="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="flex-1 rounded-full bg-[var(--fg)] px-4 py-3 text-center text-xs font-bold text-[var(--bg)]">Investigate</Link>
              <Link href={"/trade?token="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="rounded-full border border-[var(--line-strong)] px-4 py-3 text-xs">Trade</Link>
            </div>
          </article>
        })}
      </div>

      {!state?.error&&tokens.length===0&&<div className="mt-5 rounded-3xl border border-[var(--line)] p-12 text-center"><div className="text-sm">{query?"No live markets matched “"+query+"”.":"Waiting for live indexed Solana markets."}</div><div className="mt-2 text-[10px] text-[var(--muted)]">FLOW does not substitute mock markets when live data is unavailable.</div></div>}

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--line)] p-4"><div className="mono text-[8px] text-[var(--muted)]">DISCOVER</div><div className="mt-2 text-sm font-semibold">Find markets changing now.</div></div>
        <div className="rounded-2xl border border-[var(--line)] p-4"><div className="mono text-[8px] text-[var(--muted)]">UNDERSTAND</div><div className="mt-2 text-sm font-semibold">Read price, liquidity, volume and flow.</div></div>
        <div className="rounded-2xl border border-[var(--line)] p-4"><div className="mono text-[8px] text-[var(--muted)]">ACT</div><div className="mt-2 text-sm font-semibold">Watch, trade or activate Autopilot.</div></div>
      </div>

      <p className="mt-8 text-[10px] leading-5 text-[var(--muted)]">Market discovery is informational. A token appearing here is not a recommendation or guarantee of performance. Data is supplied by the connected market-data provider.</p>
    </section>

    <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 p-2 backdrop-blur md:hidden">
      <Link href="/discover" className="py-3 text-center text-[10px] font-semibold">Discover</Link><Link href="/watch" className="py-3 text-center text-[10px] text-[var(--muted)]">Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px] text-[var(--muted)]">Auto</Link><Link href="/trade" className="py-3 text-center text-[10px] text-[var(--muted)]">Trade</Link>
    </nav>
  </main>;
}
