"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import TerminalShell from "@/components/TerminalShell";
import ConnectWallet from "@/components/ConnectWallet";

function base58(bytes: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }
  let out = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += "1";
  for (let i = digits.length - 1; i >= 0; i--) out += alphabet[digits[i]];
  return out;
}

function SpotSetupContent() {
  const q = useSearchParams();
  const token = q.get("token") || "";
  const symbol = q.get("symbol") || "TOKEN";
  const { publicKey, signMessage } = useWallet();
  const [strategy, setStrategy] = useState<"hunter" | "rider">("hunter");
  const [maxTradeSol, setMaxTradeSol] = useState("0.05");
  const [slippage, setSlippage] = useState("100");
  const [tp, setTp] = useState("40");
  const [sl, setSl] = useState("20");
  const [trailActivation, setTrailActivation] = useState("30");
  const [trailPullback, setTrailPullback] = useState("15");
  const [maxPositions, setMaxPositions] = useState("3");
  const [dailyLoss, setDailyLoss] = useState("0.5");
  const [cooldown, setCooldown] = useState("300");
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("");
    if (!token) return setStatus("No token selected.");
    if (!publicKey || !signMessage) return setStatus("Connect a wallet that supports message signing.");

    try {
      const timestamp = Date.now();
      const message = "LAPRINT_CONFIG_V1|" + timestamp + "|" + publicKey.toBase58();
      const signature = await signMessage(new TextEncoder().encode(message));

      const response = await fetch("/api/autopilot/spot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message,
          signature: base58(signature),
          tokenAddress: token,
          symbol,
          strategy,
          source: "solana-discovery",
          maxTradeSol: Number(maxTradeSol),
          maxSlippageBps: Number(slippage),
          takeProfitPct: Number(tp),
          stopLossPct: Number(sl),
          trailingActivationPct: Number(trailActivation),
          trailingPullbackPct: Number(trailPullback),
          maxOpenPositions: Number(maxPositions),
          dailyLossCapSol: Number(dailyLoss),
          cooldownSeconds: Number(cooldown),
          active: true,
          automationEnabled: false,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not save strategy.");
      setStatus("Strategy saved. Automation is armed in configuration only; execution remains locked until the delegated signer is configured.");
    } catch (e: any) {
      setStatus(e?.message || "Could not save strategy.");
    }
  }

  return <TerminalShell><div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
    <Link href={"/trade?token="+encodeURIComponent(token)+"&symbol="+encodeURIComponent(symbol)} className="text-sm text-[var(--muted)]">← Trade</Link>
    <div className="mt-16 mono text-[10px] text-[var(--muted)]">SOLANA / AUTOPILOT</div>
    <h1 className="mt-4 text-4xl font-semibold">Automate {symbol}.</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Turn a Discovery token into a persistent strategy. The rules are stored and authenticated by your wallet; unattended execution stays locked until a delegated signer is explicitly approved.</p>

    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-[var(--line)] p-6">
        <div className="mono text-[9px] text-[var(--muted)]">STRATEGY</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {([["hunter","Hunter"],["rider","Rider"]] as const).map(([v,l])=><button key={v} onClick={()=>setStrategy(v)} className={"rounded-xl border p-4 text-left "+(strategy===v?"border-white bg-[var(--fg)] text-[var(--bg)]":"border-[var(--line)] text-[var(--muted)]")}><b className="text-sm">{l}</b><div className="mt-1 text-[10px] opacity-60">{v==="hunter"?"New setups / early flow":"Momentum / confirmation"}</div></button>)}
        </div>
        <label className="mt-5 block text-xs text-[var(--muted)]">MAX SOL / TRADE<input value={maxTradeSol} onChange={e=>setMaxTradeSol(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-4" /></label>
        <label className="mt-4 block text-xs text-[var(--muted)]">MAX SLIPPAGE (BPS)<input value={slippage} onChange={e=>setSlippage(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-4" /></label>
        <label className="mt-4 block text-xs text-[var(--muted)]">MAX OPEN POSITIONS<input value={maxPositions} onChange={e=>setMaxPositions(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-4" /></label>
      </section>

      <section className="rounded-2xl border border-[var(--line)] p-6">
        <div className="mono text-[9px] text-[var(--muted)]">EXIT ENGINE</div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <label className="text-xs text-[var(--muted)]">TAKE PROFIT %<input value={tp} onChange={e=>setTp(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
          <label className="text-xs text-[var(--muted)]">STOP LOSS %<input value={sl} onChange={e=>setSl(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
          <label className="text-xs text-[var(--muted)]">TRAIL START %<input value={trailActivation} onChange={e=>setTrailActivation(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
          <label className="text-xs text-[var(--muted)]">PULLBACK %<input value={trailPullback} onChange={e=>setTrailPullback(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
          <label className="text-xs text-[var(--muted)]">DAILY LOSS CAP (SOL)<input value={dailyLoss} onChange={e=>setDailyLoss(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
          <label className="text-xs text-[var(--muted)]">COOLDOWN (SEC)<input value={cooldown} onChange={e=>setCooldown(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-transparent p-3" /></label>
        </div>
      </section>
    </div>

    <div className="mt-5 rounded-2xl border border-[var(--line)] p-6">
      <ConnectWallet />
      <button onClick={save} className="mt-4 w-full rounded-xl bg-[var(--fg)] px-5 py-4 text-sm font-bold text-[var(--bg)]">Save automation strategy</button>
      {status && <div className="mt-4 rounded-xl border border-[var(--line)] p-4 text-sm text-[var(--muted)]">{status}</div>}
    </div>
  </div></TerminalShell>;
}

export default function SpotAutopilot() {
  return <Suspense fallback={<main className="min-h-screen bg-[var(--bg)] p-8 text-[var(--muted)]">Loading…</main>}><SpotSetupContent /></Suspense>;
}
