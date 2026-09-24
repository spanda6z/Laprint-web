"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Positions(){
  const {publicKey}=useWallet();
  const [data,setData]=useState<any|null>(null);
  async function load(){if(!publicKey){setData(null);return}try{const r=await fetch("/api/autopilot/spot-status?wallet="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"});setData(await r.json())}catch(e:any){setData({ok:false,positions:[],error:e?.message||"Positions unavailable"})}}
  useEffect(()=>{void load();const id=window.setInterval(load,10000);return()=>window.clearInterval(id)},[publicKey]);
  const open=(data?.positions||[]).filter((p:any)=>p.status==="open");
  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8"><Link href="/discover" className="font-semibold">FLOW</Link><div className="flex gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs">Connect</Link></div></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10 md:px-8"><div className="mono text-[9px] tracking-[.18em] text-[var(--muted)]">ACCOUNT / POSITIONS</div><div className="mt-3 flex items-end justify-between"><div><h1 className="text-4xl font-semibold">Positions</h1><p className="mt-2 text-sm text-[var(--muted)]">Monitor live spot positions opened through FLOW Autopilot.</p></div><Link href="/autopilot" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px]">Open Autopilot</Link></div>
    {!publicKey?<div className="mt-8 rounded-3xl border border-[var(--line)] p-12 text-center text-sm text-[var(--muted)]">Connect your wallet to view positions.</div>:<section className="mt-8 overflow-hidden rounded-3xl border border-[var(--line)]">{open.length===0?<div className="p-12 text-center"><div className="text-sm">No open positions.</div><Link href="/discover" className="mt-4 inline-block text-xs underline">Find a market →</Link></div>:open.map((p:any)=><div key={p.id} className="grid gap-4 border-b border-[var(--line)] px-5 py-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center"><div><div className="font-semibold">{p.symbol||p.token_address?.slice(0,8)+"…"}</div><div className="mono mt-1 text-[9px] text-[var(--muted)]">{p.input_sol??"—"} SOL · entry {p.entry_price_sol??"—"}</div></div><div className="mono text-xs">{p.current_price_sol??"—"}</div><div className="mono text-xs">{p.unrealized_pnl_sol==null?"OPEN":String(p.unrealized_pnl_sol)+" SOL"}</div><Link href={"/autopilot?position="+encodeURIComponent(p.id)} className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] text-center">Monitor</Link></div>)}</section>}
    {data?.error&&<p className="mt-4 text-xs text-[var(--muted)]">{data.error}</p>}</section>
    <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-[var(--line)] bg-[var(--bg)]/95 p-2 backdrop-blur md:hidden"><Link href="/discover" className="py-3 text-center text-[10px]">Discover</Link><Link href="/watch" className="py-3 text-center text-[10px]">Watch</Link><Link href="/autopilot" className="py-3 text-center text-[10px]">Auto</Link><Link href="/trade" className="py-3 text-center text-[10px]">Trade</Link></nav>
  </main>
}