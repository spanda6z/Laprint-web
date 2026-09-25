"use client";

import Link from "next/link";
import TerminalShell from "@/components/TerminalShell";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

type State = {
  exists: boolean;
  userAccount?: string;
  quoteBalance?: string;
  health?: string;
  positions?: Array<{ marketIndex: number; baseAssetAmount: string; quoteEntryAmount: string; quoteBreakEvenAmount: string }>;
  error?: string;
};

export default function Dashboard() {
  const { publicKey } = useWallet();
  const [s, setS] = useState<State | null>(null);

  useEffect(() => {
    if (!publicKey) { setS(null); return; }
    let dead = false;
    const load = () => fetch("/api/velocity/account?owner=" + publicKey.toBase58(), { cache: "no-store" })
      .then(r => r.json())
      .then(x => { if (!dead) setS(x); })
      .catch(e => { if (!dead) setS({ exists: false, error: e.message }); });
    load();
    const t = setInterval(load, 5000);
    return () => { dead = true; clearInterval(t); };
  }, [publicKey]);

  const balance = s?.quoteBalance ? String(Number(s.quoteBalance) / 1e6) : "—";
  const count = s?.positions?.length ?? 0;

  return (
    <TerminalShell>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mono text-[10px] text-zinc-600">OVERVIEW / LIVE ACCOUNT</div>
        <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-.04em]">Trading terminal</h1>
            <p className="mt-2 text-sm text-zinc-500">Discovery, automation and live Velocity account state.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/discover" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm">Discover</Link>
            <Link href="/tier" className="rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-black">Configure autopilot</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            ["ACCOUNT", publicKey ? (s?.exists ? "ACTIVE" : "NOT INITIALIZED") : "NOT CONNECTED"],
            ["USDT COLLATERAL", publicKey ? balance + " USDT" : "—"],
            ["OPEN POSITIONS", publicKey ? String(count) : "—"],
            ["HEALTH", s?.health ?? "—"],
          ].map(([a, b]) => (
            <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5" key={a}>
              <div className="mono text-[10px] text-zinc-600">{a}</div>
              <div className="mt-7 text-xl">{b}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="mono text-[10px] text-zinc-600">POSITIONS</div>
              <Link href="/positions" className="text-xs text-zinc-500">Open positions →</Link>
            </div>
            {!publicKey ? <p className="mt-8 text-sm text-zinc-500">Connect a wallet to read your Velocity account.</p>
              : !s?.exists ? <p className="mt-8 text-sm text-zinc-500">Velocity subaccount 0 has not been initialized.</p>
              : count === 0 ? <p className="mt-8 text-sm text-zinc-600">No open positions.</p>
              : <div className="mt-5 space-y-2">{s?.positions?.map(p => <div className="rounded-xl border border-white/10 p-4" key={p.marketIndex}>SOL-PERP<span className="float-right mono text-xs">{p.baseAssetAmount}</span></div>)}</div>}
          </section>

          <section className="rounded-2xl border border-white/10 p-6">
            <div className="mono text-[10px] text-zinc-600">AUTOMATION</div>
            <div className="mt-8 text-sm">Hunter / Rider</div>
            <p className="mt-2 text-xs leading-5 text-zinc-600">Strategies are evaluated by the backend keeper. Actual order placement remains behind the production trading gate.</p>
            <Link href="/autopilot/setup?tier=leverage" className="mt-5 inline-block text-xs underline">Configure strategy →</Link>
            {s?.error && <p className="mt-4 text-xs text-zinc-500">{s.error}</p>}
          </section>
        </div>
      </div>
    </TerminalShell>
  );
}
