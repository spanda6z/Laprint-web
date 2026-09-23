"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

type Token={
  address:string; name:string; symbol:string; image:string|null; priceUsd:string|null;
  liquidityUsd:number; volume1h:number; volume24h:number; change1h:number; change24h:number;
  buys5m:number; sells5m:number; buys1h:number; sells1h:number; buys24h?:number; sells24h?:number; marketCap?:number|null;
  marketCapUsd?:number|null; fdvUsd?:number|null; holders?:number|null;
  txns5m?:number|null; txns1h?:number|null;
  mintAuthority?:string|null; freezeAuthority?:string|null; lpStatus?:string|null;
};

const money=(n:number)=>n>=1e6?"$"+(n/1e6).toFixed(1)+"M":n>=1e3?"$"+(n/1e3).toFixed(1)+"K":"$"+n.toFixed(0);
const price=(v:string|null)=>{if(!v)return "—";const n=Number(v);if(!Number.isFinite(n))return "—";return n>=1?"$"+n.toFixed(2):n>=.01?"$"+n.toFixed(4):"$"+n.toPrecision(4)};
const compact=(n:number|null|undefined)=>n==null?"—":n.toLocaleString();
const unavailable=(v:unknown)=>v==null||v==="";

function metricLabel(value:number){return value>=70?"High":value>=40?"Moderate":"Low"}
function shorten(v:string){return v.length>18?v.slice(0,8)+"…"+v.slice(-8):v}

function TokenContent(){
  const q=useSearchParams();
  const address=q.get("address");
  const [t,setT]=useState<Token|null>(null);
  const [error,setError]=useState("");
  const [watched,setWatched]=useState(false);
  const [copied,setCopied]=useState(false);\n  const [social,setSocial]=useState<any[]>([]);\n  const [socialConfigured,setSocialConfigured]=useState(false);

  async function load(){
    if(!address)return;
    try{
      const r=await fetch("/api/discovery",{cache:"no-store"});
      const d=await r.json();
      const x=(d.tokens||[]).find((v:Token)=>v.address===address);
      if(x){setT(x);setError("")}else setError("Token is no longer in the current discovery set.");
    }catch{setError("Market data unavailable.")}
  }

  useEffect(()=>{
    void load();
    const id=window.setInterval(load,30000);
    try{setWatched(JSON.parse(localStorage.getItem("velocity-watchlist")||"[]").some((x:Token)=>x.address===address))}catch{}
    return()=>{window.clearInterval(id);window.clearInterval(sid)};
  },[address]);

  function toggleWatch(){
    if(!t)return;
    try{
      const key="velocity-watchlist";
      const list:Token[]=JSON.parse(localStorage.getItem(key)||"[]");
      const exists=list.some(x=>x.address===t.address);
      localStorage.setItem(key,JSON.stringify(exists?list.filter(x=>x.address!==t.address):[...list,t]));
      setWatched(!exists);
    }catch{}
  }

  async function copyAddress(){
    if(!t)return;
    try{await navigator.clipboard.writeText(t.address);setCopied(true);window.setTimeout(()=>setCopied(false),1400)}catch{}
  }

  const stats=useMemo(()=>{
    if(!t)return null;
    const flowTotal=t.buys5m+t.sells5m;
    const buyPressure=flowTotal?Math.round(t.buys5m/flowTotal*100):0;
    const activity=t.buys1h+t.sells1h;
    const liquidity=t.liquidityUsd>0?Math.min(100,(t.liquidityUsd/100000)*100):0;
    return {buyPressure,activity,liquidity};
  },[t]);

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/discover" className="text-sm text-[var(--muted)]">← Discover</Link>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs">Connect</Link></div>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      {error?<div className="rounded-3xl border border-[var(--line)] p-8 text-sm text-[var(--muted)]">{error}<Link href="/discover" className="mt-5 block text-[var(--fg)] underline">Return to discovery</Link></div>:!t?<div className="py-20 text-sm text-[var(--muted)]">Loading live market data…</div>:<>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {t.image?<img src={t.image} alt="" className="h-14 w-14 rounded-full object-cover"/>:<div className="h-14 w-14 rounded-full border border-[var(--line)]"/>}
            <div><div className="mono text-[9px] text-[var(--muted)]">TOKEN / SOLANA</div><h1 className="mt-1 text-3xl font-semibold">{t.symbol}</h1><div className="text-xs text-[var(--muted)]">{t.name}</div></div>
          </div>
          <div className="flex gap-2"><button onClick={toggleWatch} className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-xs">{watched?"Watching":"Watch"}</button><Link href={"/trade?token="+encodeURIComponent(t.address)+"&symbol="+encodeURIComponent(t.symbol)} className="rounded-full bg-[var(--fg)] px-6 py-3 text-xs font-bold text-[var(--bg)]">Trade {t.symbol}</Link></div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_.85fr]">
          <div>
            <div className="flex items-end justify-between"><div><div className="text-5xl font-semibold tracking-[-.05em]">{price(t.priceUsd)}</div><div className="mt-2 text-sm">{t.change1h>=0?"+":""}{t.change1h.toFixed(1)}% <span className="text-[var(--muted)]">1H</span></div></div><div className="mono text-[9px] text-[var(--muted)]">LIVE SNAPSHOT · 30S</div></div>
            <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6">
              <div className="mono text-[9px] text-[var(--muted)]">PRICE HISTORY</div>
              <div className="mt-6 flex h-52 items-center justify-center border-b border-[var(--line)] text-center"><div><div className="text-sm">Historical candles are not available from the current discovery feed.</div><div className="mt-2 text-[10px] text-[var(--muted)]">The page will not fabricate a chart from snapshot data.</div></div></div>
              <div className="mt-4 flex justify-between text-[9px] text-[var(--muted)]"><span>5M</span><span>30M</span><span>1H</span><span>6H</span><span>24H</span></div>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-3xl border border-[var(--line)] p-5">
              <div className="mono text-[9px] text-[var(--muted)]">MARKET SNAPSHOT</div>
              <div className="mt-5 grid grid-cols-2 gap-5">
                <div><div className="mono text-[8px] text-[var(--muted)]">MARKET CAP</div><div className="mt-1">{unavailable(t.marketCap ?? t.marketCapUsd)?"—":money((t.marketCap ?? t.marketCapUsd) as number)}</div></div>
                <div><div className="mono text-[8px] text-[var(--muted)]">24H VOLUME</div><div className="mt-1">{money(t.volume24h)}</div></div>
                <div><div className="mono text-[8px] text-[var(--muted)]">LIQUIDITY</div><div className="mt-1">{money(t.liquidityUsd)}</div></div>
                <div><div className="mono text-[8px] text-[var(--muted)]">1H CHANGE</div><div className="mt-1">{t.change1h>=0?"+":""}{t.change1h.toFixed(1)}%</div></div>
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--line)] p-5">
              <div className="mono text-[9px] text-[var(--muted)]">FLOW</div>
              <div className="mt-5 flex justify-between text-sm"><span>Buy pressure</span><span>{stats?.buyPressure}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-[var(--line)]"><div className="h-full bg-[var(--fg)]" style={{width:(stats?.buyPressure||0)+"%"}}/></div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-[var(--muted)]"><div>1H buys <b className="text-[var(--fg)]">{t.buys1h}</b></div><div>1H sells <b className="text-[var(--fg)]">{t.sells1h}</b></div></div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl border border-[var(--line)] p-6">
          <div className="mono text-[9px] text-[var(--muted)]">MARKET DETAILS</div>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {[["MARKET CAP",t.marketCap ?? t.marketCapUsd],["FDV",t.fdvUsd],["24H VOLUME",t.volume24h],["LIQUIDITY",t.liquidityUsd]].map(([label,value])=><div key={label as string} className="bg-[var(--bg)] p-4"><div className="mono text-[8px] text-[var(--muted)]">{label}</div><div className="mt-2 text-lg font-semibold">{unavailable(value)?"—":money(value as number)}</div></div>)}
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div><div className="mono text-[9px] text-[var(--muted)]">FLOW SUMMARY</div><div className="mt-1 text-sm">Buy and sell activity across the live feed</div></div>
              <div className="mono text-[9px] text-[var(--muted)]">24H</div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div><div className="mono text-[8px] text-[var(--muted)]">BUYS</div><div className="mt-1 text-lg font-semibold">{compact(t.buys24h)}</div></div>
              <div><div className="mono text-[8px] text-[var(--muted)]">SELLS</div><div className="mt-1 text-lg font-semibold">{compact(t.sells24h)}</div></div>
              <div><div className="mono text-[8px] text-[var(--muted)]">BUY PRESSURE</div><div className="mt-1 text-lg font-semibold">{stats?.buyPressure}%</div></div>
              <div><div className="mono text-[8px] text-[var(--muted)]">1H TXNS</div><div className="mt-1 text-lg font-semibold">{compact(t.txns1h ?? (t.buys1h+t.sells1h))}</div></div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <div className="mono text-[9px] text-[var(--muted)]">ACTIVITY</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">5M transactions</div><div className="mt-2 text-xl font-semibold">{compact(t.txns5m ?? (t.buys5m+t.sells5m))}</div></div>
                <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">1H transactions</div><div className="mt-2 text-xl font-semibold">{compact(t.txns1h ?? (t.buys1h+t.sells1h))}</div></div>
                <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">1H buys</div><div className="mt-2 text-xl font-semibold">{compact(t.buys1h)}</div></div>
                <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">1H sells</div><div className="mt-2 text-xl font-semibold">{compact(t.sells1h)}</div></div>
              </div>
            </div>
            <div>
              <div className="mono text-[9px] text-[var(--muted)]">HOLDERS</div>
              <div className="mt-3 rounded-2xl border border-[var(--line)] p-4">
                <div className="text-[10px] text-[var(--muted)]">Total holders</div>
                <div className="mt-2 text-2xl font-semibold">{compact(t.holders)}</div>
                <div className="mt-3 text-[10px] text-[var(--muted)]">Holder concentration is shown only when supplied by the market feed.</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mono text-[9px] text-[var(--muted)]">CONTRACT</div>
            <button onClick={copyAddress} className="mt-3 flex w-full items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-left hover:border-[var(--line-strong)]"><span className="mono truncate text-[10px]">{t.address}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">{copied?"COPIED":"COPY"}</span></button>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">Mint authority</div><div className="mt-2 text-xs">{unavailable(t.mintAuthority)?"Unavailable":shorten(t.mintAuthority as string)}</div></div>
              <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">Freeze authority</div><div className="mt-2 text-xs">{unavailable(t.freezeAuthority)?"Unavailable":shorten(t.freezeAuthority as string)}</div></div>
              <div className="rounded-2xl border border-[var(--line)] p-4"><div className="text-[10px] text-[var(--muted)]">LP status</div><div className="mt-2 text-xs">{unavailable(t.lpStatus)?"Unavailable":t.lpStatus}</div></div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[var(--panel)] p-4 text-[10px] leading-5 text-[var(--muted)]">Only fields supplied by the live discovery feed are displayed as data. Missing holder, contract, LP, or market-cap fields remain unavailable rather than being estimated or fabricated.</div>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--line)] p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div><div className="mono text-[9px] text-[var(--muted)]">WHY IT&apos;S MOVING</div><h2 className="mt-2 text-2xl font-semibold tracking-tight">Live signals behind this market</h2></div>
            <div className="mono text-[9px] text-[var(--muted)]">CURRENT SNAPSHOT</div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="mono text-[8px] text-[var(--muted)]">PRICE</div><div className="mt-2 text-xl font-semibold">{t.change1h>=0?"+":""}{t.change1h.toFixed(1)}% <span className="text-xs font-normal text-[var(--muted)]">1H</span></div><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">Current price movement in the live discovery feed.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="mono text-[8px] text-[var(--muted)]">FLOW</div><div className="mt-2 text-xl font-semibold">{stats?.buyPressure}% <span className="text-xs font-normal text-[var(--muted)]">BUY PRESSURE</span></div><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">{compact(t.buys5m)} buys vs {compact(t.sells5m)} sells in the latest 5M window.</p></div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="mono text-[8px] text-[var(--muted)]">VOLUME</div><div className="mt-2 text-xl font-semibold">{money(t.volume24h)}</div><p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">Reported 24H trading volume from the market-data feed.</p></div>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--line)] p-4">
            <div className="mono text-[8px] text-[var(--muted)]">SOCIAL SIGNALS</div>
            <div className="mt-2 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><div className="text-sm">X / creator activity</div><div className="mt-1 text-[10px] text-[var(--muted)]">No verified social signal is attached to this token in the current feed.</div></div><span className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-[9px] text-[var(--muted)]">NOT AVAILABLE</span></div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--line)] p-6">
          <div className="mono text-[9px] text-[var(--muted)]">ANALYZE · DERIVED FROM CURRENT FEED</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[["Buy pressure",stats?.buyPressure||0,stats?.buyPressure?metricLabel(stats.buyPressure):"No flow"],["1H activity",stats?.activity||0,stats?.activity?String(stats.activity)+" transactions":"No activity"],["Liquidity depth",stats?.liquidity||0,stats?.liquidity?metricLabel(stats.liquidity):"No liquidity"]].map(([label,value,detail])=><div key={label as string} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"><div className="text-sm">{label}</div><div className="mt-3 text-2xl font-semibold">{typeof value==="number"&&label!=="1H activity"?Math.round(value as number)+"%":value}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{detail}</div></div>)}
          </div>
          <p className="mt-5 text-[10px] leading-5 text-[var(--muted)]">These are mechanical summaries of the current market snapshot, not a recommendation. They can change as new data arrives.</p>
        </section>
      </>}
    </section>
  </main>
}

export default function TokenPage(){
  return <Suspense fallback={<main className="min-h-screen bg-[var(--bg)] p-8 text-[var(--muted)]">Loading token…</main>}><TokenContent /></Suspense>;
}
