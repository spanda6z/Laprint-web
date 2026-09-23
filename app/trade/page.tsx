"use client";

import Link from "next/link";
import TerminalShell from "@/components/TerminalShell";
import ConnectWallet from "@/components/ConnectWallet";
import ThemeToggle from "@/components/ThemeToggle";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const SOL = "So11111111111111111111111111111111111111112";

function TradeContent() {
  const q = useSearchParams();
  const mint = q.get("token") || "";
  const symbol = q.get("symbol") || "TOKEN";
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [sol, setSol] = useState("0.05");
  const [slippage, setSlippage] = useState("100");
  const [mode, setMode] = useState<"signal" | "manual" | "live">("manual");
  const [quote, setQuote] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [signature, setSignature] = useState("");

  const lamports = useMemo(() => {
    const n = Number(sol);
    return Number.isFinite(n) && n > 0 ? Math.floor(n * 1_000_000_000) : 0;
  }, [sol]);

  const slippageBps = Number(slippage);
  const validSlippage = Number.isInteger(slippageBps) && slippageBps >= 1 && slippageBps <= 5000;

  async function getQuote() {
    setStatus("");
    setSignature("");
    setQuote(null);

    if (!mint) return setStatus("Select a token from Discovery first.");
    if (!lamports) return setStatus("Enter a valid SOL amount.");
    if (!validSlippage) return setStatus("Slippage must be between 1 and 5000 bps.");

    try {
      const res = await fetch(
        "/api/trade/quote?inputMint=" + encodeURIComponent(SOL) +
        "&outputMint=" + encodeURIComponent(mint) +
        "&amount=" + lamports +
        "&slippageBps=" + slippageBps,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Quote unavailable");

      setQuote(data.quote);
      setStatus("Route ready. Review it, then sign the transaction with your connected wallet.");
    } catch (e: any) {
      setStatus(e?.message || "Quote unavailable");
    }
  }

  async function executeManualSwap() {
    setStatus("");
    setSignature("");

    if (!publicKey) return setStatus("Connect your Solana wallet first.");
    if (!quote) return setStatus("Get a live route first.");
    if (!sendTransaction) return setStatus("This wallet does not support transaction signing.");

    setBusy(true);
    try {
      const res = await fetch("/api/trade/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userPublicKey: publicKey.toBase58(),
          quoteResponse: quote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not build swap transaction.");

      const raw = Uint8Array.from(atob(data.swapTransaction), c => c.charCodeAt(0));
      const transaction = VersionedTransaction.deserialize(raw);

      setStatus("Transaction built. Waiting for wallet approval…");
      const txSignature = await sendTransaction(transaction, connection);

      setSignature(txSignature);
      setStatus("Transaction submitted. Waiting for Solana confirmation…");

      await connection.confirmTransaction(
        {
          signature: txSignature,
          blockhash: transaction.message.recentBlockhash,
          lastValidBlockHeight: data.lastValidBlockHeight ?? 0,
        },
        "confirmed"
      );

      setStatus("Swap confirmed on Solana.");
    } catch (e: any) {
      setStatus(e?.message || "Swap failed or was rejected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TerminalShell>
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <div className="flex items-center justify-between"><Link href="/discover" className="text-sm text-[var(--muted)]">← Discovery</Link><ThemeToggle /></div>

        <div className="mt-16 mono text-[10px] text-[var(--muted)]">SOLANA / TRADE</div>
        <h1 className="mt-4 text-4xl font-semibold">Trade {symbol}.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Live Jupiter routing with user-signed execution. La😂Print never receives or stores your wallet private key.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-[var(--line)] p-6">
            <div className="mono text-[9px] text-[var(--muted)]">TOKEN MINT</div>
            <div className="mt-3 break-all font-mono text-xs text-[var(--muted)]">{mint || "No token selected"}</div>

            <label className="mt-8 block text-xs text-[var(--muted)]">
              BUY WITH SOL
              <input value={sol} onChange={e => setSol(e.target.value)} type="number" min="0.001" step="0.001"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-4 text-sm outline-none" />
            </label>

            <label className="mt-5 block text-xs text-[var(--muted)]">
              MAX SLIPPAGE (BPS)
              <input value={slippage} onChange={e => setSlippage(e.target.value)} type="number" min="1" max="5000"
                className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-4 text-sm outline-none" />
            </label>

            <div className="mt-6">
              <ConnectWallet />
            </div>

            <button onClick={getQuote} disabled={busy}
              className="mt-4 w-full rounded-xl bg-[var(--fg)] px-5 py-4 text-sm font-bold text-[var(--bg)] disabled:opacity-50">
              Get live route
            </button>

            {quote && (
              <div className="mt-4 rounded-xl border border-[var(--line)] p-4">
                <div className="mono text-[9px] text-[var(--muted)]">ROUTE READY</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-[var(--muted)]">Input</span><div className="mt-1">{Number(quote.inAmount || 0) / 1e9} SOL</div></div>
                  <div><span className="text-[var(--muted)]">Output</span><div className="mt-1">{quote.outAmount}</div></div>
                  <div><span className="text-[var(--muted)]">Price impact</span><div className="mt-1">{quote.priceImpactPct ?? "n/a"}%</div></div>
                  <div><span className="text-[var(--muted)]">Route</span><div className="mt-1">{quote.routePlan?.length ?? 0} step(s)</div></div>
                </div>
              </div>
            )}

            <button onClick={executeManualSwap}
              disabled={busy || !quote || !publicKey || mode !== "manual"}
              className="mt-4 w-full rounded-xl border border-[var(--line-strong)] px-5 py-4 text-sm font-bold disabled:opacity-40">
              {busy ? "Processing…" : "Sign & swap"}
            </button>

            <Link
              href={"/autopilot/spot?token=" + encodeURIComponent(mint) + "&symbol=" + encodeURIComponent(symbol)}
              className="mt-3 block w-full rounded-xl border border-[var(--line)] px-5 py-4 text-center text-sm font-bold text-[var(--muted)]"
            >
              Automate this token →
            </Link>

            {status && <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm text-[var(--muted)]">{status}</div>}

            {signature && (
              <a
                href={"https://solscan.io/tx/" + signature}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block break-all text-xs text-[var(--muted)] underline"
              >
                View transaction: {signature}
              </a>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--line)] p-6">
            <div className="mono text-[9px] text-[var(--muted)]">EXECUTION MODE</div>
            <div className="mt-4 space-y-2">
              {[
                ["signal", "Signal only", "Discovery can trigger strategy evaluation."],
                ["manual", "Manual", "You review and sign each swap."],
                ["live", "Live automation", "Requires an approved execution signer."],
              ].map(([value, label, desc]) => (
                <button key={value} onClick={() => setMode(value as any)}
                  className={"w-full rounded-xl border p-4 text-left " + (mode === value ? "border-white bg-[var(--fg)] text-[var(--bg)]" : "border-[var(--line)] text-[var(--muted)]")}>
                  <div className="text-sm font-semibold">{label}</div>
                  <div className={"mt-1 text-[10px] " + (mode === value ? "text-[var(--bg)]/60" : "text-[var(--muted)]")}>{desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[var(--line)] p-4 text-[10px] leading-5 text-[var(--muted)]">
              Live automation remains gated. An unattended spot trader needs an explicit delegated signer with spending limits, risk controls, transaction simulation and emergency-stop handling.
            </div>
          </section>
        </div>
      </div>
    </TerminalShell>
  );
}

export default function Trade() {
  return <Suspense fallback={<main className="min-h-screen bg-[var(--bg)] p-8 text-[var(--muted)]">Loading trade…</main>}><TradeContent /></Suspense>;
}
