"use client";

import Link from "next/link";
import TerminalShell from "@/components/TerminalShell";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const SOL = "So11111111111111111111111111111111111111112";

function TradeContent() {
  const q = useSearchParams();
  const mint = q.get("token") || "";
  const symbol = q.get("symbol") || "TOKEN";
  const [sol, setSol] = useState("0.05");
  const [slippage, setSlippage] = useState("100");
  const [mode, setMode] = useState<"signal" | "manual" | "live">("signal");
  const [status, setStatus] = useState("");

  const lamports = useMemo(() => {
    const n = Number(sol);
    return Number.isFinite(n) && n > 0 ? Math.floor(n * 1_000_000_000) : 0;
  }, [sol]);

  async function quote() {
    setStatus("");
    if (!mint) return setStatus("Select a token from Discovery first.");
    if (!lamports) return setStatus("Enter a valid SOL amount.");

    try {
      const res = await fetch(
        "/api/trade/quote?inputMint=" + encodeURIComponent(SOL) +
        "&outputMint=" + encodeURIComponent(mint) +
        "&amount=" + lamports +
        "&slippageBps=" + encodeURIComponent(slippage),
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Quote unavailable");
      setStatus("Route found. Wallet signing is the next step; no transaction has been sent.");
    } catch (e: any) {
      setStatus(e?.message || "Quote unavailable");
    }
  }

  return (
    <TerminalShell>
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <Link href="/discover" className="text-sm text-zinc-500">← Discovery</Link>
        <div className="mt-16 mono text-[10px] text-zinc-600">SOLANA / TRADE</div>
        <h1 className="mt-4 text-4xl font-semibold">Trade {symbol}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
          This is the spot execution surface. Quotes are live provider data. Nothing is submitted until a wallet signs the transaction.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-white/10 p-6">
            <div className="mono text-[9px] text-zinc-600">TOKEN MINT</div>
            <div className="mt-3 break-all font-mono text-xs text-zinc-400">{mint || "No token selected"}</div>

            <label className="mt-8 block text-xs text-zinc-500">
              BUY WITH SOL
              <input value={sol} onChange={e => setSol(e.target.value)} type="number" min="0.001" step="0.001"
                className="mt-2 w-full rounded-xl border border-white/10 bg-transparent p-4 text-sm outline-none" />
            </label>

            <label className="mt-5 block text-xs text-zinc-500">
              MAX SLIPPAGE (BPS)
              <input value={slippage} onChange={e => setSlippage(e.target.value)} type="number" min="1" max="5000"
                className="mt-2 w-full rounded-xl border border-white/10 bg-transparent p-4 text-sm outline-none" />
            </label>

            <button onClick={quote} className="mt-6 w-full rounded-xl bg-white px-5 py-4 text-sm font-bold text-black">
              Get live route
            </button>

            {status && <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-400">{status}</div>}
          </section>

          <section className="rounded-2xl border border-white/10 p-6">
            <div className="mono text-[9px] text-zinc-600">EXECUTION MODE</div>
            <div className="mt-4 space-y-2">
              {[
                ["signal", "Signal only", "Discovery can trigger strategy evaluation."],
                ["manual", "Manual", "User reviews and signs each swap."],
                ["live", "Live automation", "Requires an approved execution signer."],
              ].map(([value, label, desc]) => (
                <button key={value} onClick={() => setMode(value as any)}
                  className={"w-full rounded-xl border p-4 text-left " + (mode === value ? "border-white bg-white text-black" : "border-white/10 text-zinc-400")}>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className={"mt-1 text-[10px] " + (mode === value ? "text-black/60" : "text-zinc-600")}>{desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-white/5 p-4 text-[10px] leading-5 text-zinc-600">
              Live automation is intentionally gated. A backend process cannot safely sign from a user's normal wallet connection. It requires an explicit delegated signer/custody design.
            </div>
          </section>
        </div>
      </div>
    </TerminalShell>
  );
}

export default function Trade() {
  return <Suspense fallback={<main className="min-h-screen bg-[#070707] p-8 text-zinc-500">Loading trade…</main>}><TradeContent /></Suspense>;
}
