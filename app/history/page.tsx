"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useWallet } from "@solana/wallet-adapter-react";

type Data={ok:boolean;positions:any[];events:any[];error?:string};

export default function History(){
  const {publicKey}=useWallet();
  const [data,setData]=useState<Data|null>(null);
  const [loading,setLoading]=useState(false);

  async function load(){
    if(!publicKey){setData(null);return}
    setLoading(true);
    try{
      const r=await fetch("/api/autopilot/spot-status?wallet="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"});
      setData(await r.json());
    }catch(e:any){setData({ok:false,positions:[],events:[],error:e?.message||"History unavailable"})}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load();const id=window.setInterval(load,10000);return()=>window.clearInterval(id)},[publicKey]);

  const positions=data?.positions||[];
  const closed=positions.filter((p:any)=>p.status!=="open");
  const events=data?.events||[];

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/discover" className="flex items-center gap-2 text-sm font-semibold">FLOW</Link>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs">Connect</Link></div>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="mono text-[9px] tracking-[.18em] text-[var(--muted)]">ACCOUNT / HISTORY</div>
      <div className="mt-3 flex items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold tracking-[-.05em]">History</h1><p className="mt-2 text-sm text-[var(--muted)]">Your recorded Autopilot positions and execution events.</p></div><button onClick={load} className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px]">{loading?"Refreshing…":"Refresh"}</button></div>
      {!publicKey?<div className="mt-8 rounded-3xl border border-[var(--line)] p-12 text-center"><div className="text-sm">Connect your wallet to view account history.</div><Link href="/discover" className="mt-4 inline-block text-xs underline">Continue exploring →</Link></div>:
      <><div className="mt-8 grid gap-3 sm:grid-cols-3">{[["CLOSED POSITIONS",closed.length],["TOTAL EVENTS",events.length],["ACCOUNT",publicKey.toBase58().slice(0,8)+"…"]].map(([k,v])=><div key={String(k)} className="rounded-2xl border border-[var(--line)] p-4"><div className="mono text-[8px] text-[var(--muted)]">{k}</div><div className="mt-2 text-lg font-semibold">{v}</div></div>)}</div>
      <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--line)]"><div className="border-b border-[var(--line)] px-5 py-4 mono text-[9px] text-[var(--muted)]">POSITION HISTORY</div>
      {closed.length===0?<div className="p-10 text-sm text-[var(--muted)]">No completed positions have been recorded.</div>:closed.map((p:any)=><div key={p.id} className="grid gap-3 border-b border-[var(--line)] px-5 py-5 md:grid-cols-[1fr_auto_auto] md:items-center"><div><div className="font-semibold">{p.symbol||p.token_address?.slice(0,8)+"…"}</div><div className="mono mt-1 text-[9px] text-[var(--muted)]">{p.status?.toUpperCase()} · {p.input_sol??"—"} SOL</div></div><div className="mono text-sm">{p.realized_pnl_sol==null?"—":String(p.realized_pnl_sol)+" SOL"}</div><div className="mono text-[9px] text-[var(--muted)]">{p.closed_at?new Date(p.closed_at).toLocaleString():"DATE UNAVAILABLE"}</div></div>)}</section>
      <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--line)]"><div className="border-b border-[var(--line)] px-5 py-4 mono text-[9px] text-[var(--muted)]">EXECUTION EVENTS</div>{events.length===0?<div className="p-10 text-sm text-[var(--muted)]">No execution events recorded.</div>:events.slice(0,50).map((e:any)=><div key={e.id} className="grid gap-2 border-b border-[var(--line)] px-5 py-4 md:grid-cols-[180px_160px_1fr]"><div className="mono text-[9px] text-[var(--muted)]">{e.created_at?new Date(e.created_at).toLocaleString():"—"}</div><div className="mono text-[9px]">{e.event_type||"EVENT"}</div><div className="truncate text-xs text-[var(--muted)]">{typeof e.payload==="string"?e.payload:JSON.stringify(e.payload||{})}</div></div>)}</section></>}
      {data?.error&&<p className="mt-4 text-xs text-[var(--muted)]">{data.error}</p>}
    </section>
    <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 p-2 backdrop-blur md:hidden"><Link href="/discover" className="py-3 text-center text-[10px]">Discover</Link><Link href="/watch" className="py-3 text-center text-[10px]">Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px]">Auto</Link><Link href="/trade" className="py-3 text-center text-[10px]">Trade</Link></nav>
  </main>
}