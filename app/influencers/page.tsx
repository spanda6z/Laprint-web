"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type Influencer={handle:string;displayName:string;profileUrl:string;status:string;signals:number;lastSignalAt:string|null};

export default function InfluencersPage(){
  const [items,setItems]=useState<Influencer[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch("/api/influencers",{cache:"no-store"})
      .then(r=>r.json())
      .then(d=>setItems(Array.isArray(d.influencers)?d.influencers:[]))
      .catch(()=>setItems([]))
      .finally(()=>setLoading(false));
  },[]);

  return <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/discover" className="font-semibold tracking-tight">La😂Print</Link>
        <nav className="hidden items-center gap-6 text-xs text-[var(--muted)] md:flex">
          <Link href="/discover">Discover</Link><Link href="/influencers" className="text-[var(--fg)]">Influencers</Link><Link href="/watch">Watch</Link><Link href="/autopilot">Auto</Link>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/connect/fund" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-xs">Connect</Link></div>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
      <div className="max-w-3xl">
        <div className="mono text-[9px] text-[var(--muted)]">SOCIAL INTELLIGENCE · X</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] md:text-6xl">Who is talking about the market?</h1>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">Track public creator activity, detect token mentions and connect those signals with market movement. Social activity and on-chain activity stay separate until evidence links them.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-center justify-between"><div><div className="mono text-[9px] text-[var(--muted)]">TRACKED CREATORS</div><div className="mt-1 text-lg font-semibold">{loading?"Loading…":items.length}</div></div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-[9px] text-[var(--muted)]">PUBLIC SIGNALS ONLY</span></div>
          <div className="mt-4 space-y-3">
            {items.length?items.map(x=><Link key={x.handle} href={x.profileUrl} target="_blank" className="block rounded-3xl border border-[var(--line)] p-5 transition hover:border-[var(--line-strong)]"><div className="flex items-center justify-between gap-4"><div><div className="font-semibold">{x.displayName}</div><div className="mt-1 text-xs text-[var(--muted)]">@{x.handle}</div></div><div className="text-right"><div className="text-lg font-semibold">{x.signals}</div><div className="mono text-[8px] text-[var(--muted)]">SIGNALS</div></div></div></Link>):<div className="rounded-3xl border border-dashed border-[var(--line-strong)] p-8"><div className="text-lg font-semibold">No creator feed connected yet.</div><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">La😂Print will only show creator activity after a legitimate X data source is connected. There is no placeholder influencer activity here.</p></div>}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-[var(--line)] p-5"><div className="mono text-[9px] text-[var(--muted)]">SIGNAL TYPES</div><div className="mt-5 space-y-4 text-sm"><div><b>MENTION</b><p className="mt-1 text-xs text-[var(--muted)]">A tracked creator publicly references a token.</p></div><div><b>CONTRACT</b><p className="mt-1 text-xs text-[var(--muted)]">A token contract address is detected in a post.</p></div><div><b>REPEAT</b><p className="mt-1 text-xs text-[var(--muted)]">Repeated references to the same token.</p></div><div><b>ENGAGEMENT</b><p className="mt-1 text-xs text-[var(--muted)]">A measurable change in post engagement.</p></div></div></div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><div className="mono text-[9px] text-[var(--muted)]">EVIDENCE RULE</div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">A mention does not mean a creator launched or bought a token. Those claims require separate on-chain evidence.</p></div>
        </aside>
      </div>
    </section>
  </main>
}