"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

function base58(bytes: Uint8Array): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const byte of bytes) n = (n << 8n) + BigInt(byte);
  let out = "";
  while (n > 0n) {
    const mod = Number(n % 58n);
    out = alphabet[mod] + out;
    n /= 58n;
  }
  for (const byte of bytes) {
    if (byte === 0) out = "1" + out;
    else break;
  }
  return out || "1";
}

function SetupContent() {
  const q = useSearchParams();
  const tier = q.get("tier") === "spot" ? "spot" : "leverage";
  const { publicKey, signMessage } = useWallet();

  const [lev, setLev] = useState(3);
  const [strategy, setStrategy] = useState<"hunter" | "rider">("hunter");
  const [size, setSize] = useState(100);
  const [tp, setTp] = useState(10);
  const [sl, setSl] = useState(5);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");

    if (tier === "spot") {
      setMessage("Spot execution is not enabled. Use the leverage path for the current Velocity perp integration.");
      return;
    }

    if (!publicKey) {
      setMessage("Connect your Solana wallet first.");
      return;
    }

    if (!signMessage) {
      setMessage("This wallet cannot sign authorization messages.");
      return;
    }

    setSaving(true);
    try {
      const authMessage = `LAPRINT_CONFIG_V1|${Date.now()}|${publicKey.toBase58()}`;
      const signature = await signMessage(new TextEncoder().encode(authMessage));

      const response = await fetch("/api/autopilot/config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message: authMessage,
          signature: base58(signature),
          subaccountId: 0,
          market: "SOL-PERP",
          strategy,
          maxLeverage: lev,
          targetProfitPct: tp,
          maxLossPct: sl,
          positionSizeUsd: size,
          active: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not save configuration");

      setMessage("Configuration saved. Keeper is now eligible to evaluate this strategy.");
    } catch (error: any) {
      setMessage(error?.message || "Could not save configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/tier" className="text-sm text-zinc-500">← Tier</Link>
        <div className="mt-20 mono text-xs text-zinc-600">03 / AUTOPILOT</div>
        <h1 className="mt-4 text-5xl font-semibold">Configure leverage.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">
          This configuration is saved to your account and evaluated by the Velocity keeper. Saving does not place an order.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 p-6">
          <label className="text-xs text-zinc-500">MARKET</label>
          <div className="mt-3 rounded-xl border border-white/10 p-4">
            SOL-PERP <span className="float-right text-xs text-zinc-600">VELOCITY</span>
          </div>

          <div className="mt-8">
            <label className="text-xs text-zinc-500">STRATEGY</label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["hunter", "rider"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStrategy(item)}
                  className={`rounded-xl border px-4 py-4 text-left text-sm ${strategy === item ? "border-white bg-white text-black" : "border-white/10 text-zinc-400"}`}
                >
                  <div className="font-semibold capitalize">{item}</div>
                  <div className={`mt-1 text-xs ${strategy === item ? "text-black/60" : "text-zinc-600"}`}>
                    {item === "hunter" ? "Momentum entry" : "Trend continuation"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-between text-sm">
            <span>Leverage</span><span>{lev.toFixed(1)}x</span>
          </div>
          <input className="mt-4 w-full" type="range" min="1" max="10" step=".1" value={lev} onChange={(e) => setLev(+e.target.value)} />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <label className="text-xs text-zinc-500">
              POSITION SIZE (USD)
              <input className="mt-2 w-full rounded-xl border border-white/10 bg-transparent p-3 text-sm text-white outline-none" type="number" min="0" step="10" value={size} onChange={(e) => setSize(+e.target.value)} />
            </label>
            <label className="text-xs text-zinc-500">
              TAKE PROFIT (%)
              <input className="mt-2 w-full rounded-xl border border-white/10 bg-transparent p-3 text-sm text-white outline-none" type="number" min="0.1" step="0.5" value={tp} onChange={(e) => setTp(+e.target.value)} />
            </label>
            <label className="text-xs text-zinc-500">
              MAX LOSS (%)
              <input className="mt-2 w-full rounded-xl border border-white/10 bg-transparent p-3 text-sm text-white outline-none" type="number" min="0.1" step="0.5" value={sl} onChange={(e) => setSl(+e.target.value)} />
            </label>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 p-4">
              <span className="text-xs text-zinc-600">LIQUIDATION</span>
              <div className="mt-2 text-sm text-zinc-400">Calculated from live Velocity account</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <span className="text-xs text-zinc-600">EXECUTION</span>
              <div className="mt-2 text-sm text-zinc-400">Disabled until LIVE_TRADING is explicitly enabled</div>
            </div>
          </div>

          <button onClick={save} disabled={saving} className="mt-8 w-full rounded-xl bg-white px-5 py-4 text-sm font-bold text-black disabled:opacity-50">
            {saving ? "Authorizing…" : "Sign & save configuration"}
          </button>

          {message && <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-400">{message}</div>}
        </div>
      </div>
    </main>
  );
}

export default function Setup() {
  return <Suspense fallback={<main className="min-h-screen bg-[#070707] p-8 text-zinc-500">Loading setup…</main>}><SetupContent /></Suspense>;
}
