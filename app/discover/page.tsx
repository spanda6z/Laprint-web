"use client";

import Link from "next/link";
import TerminalShell from "@/components/TerminalShell";
import { useEffect, useMemo, useState } from "react";

type Token = {
  address: string;
  name: string;
  symbol: string;
  image: string | null;
  priceUsd: string | null;
  dex: string | null;
  pairUrl: string | null;
  liquidityUsd: number;
  marketCap: number | null;
  volume1h: number;
  volume24h: number;
  change1h: number;
  change24h: number;
  buys5m: number;
  sells5m: number;
  buys1h: number;
  sells1h: number;
  boosts: number;
  promoted: boolean;
};

type ResponseState = {
  ok: boolean;
  updatedAt?: string;
  tokens?: Token[];
  error?: string;
};

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return "$" + (value / 1_000).toFixed(1) + "K";
  return "$" + value.toFixed(0);
}

function price(value: string | null) {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  if (n >= 1) return "$" + n.toFixed(2);
  if (n >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toPrecision(4);
}

export default function Discover() {
  const [state, setState] = useState<ResponseState | null>(null);
  const [filter, setFilter] = useState<"flow" | "volume" | "gainers">("flow");

  async function load() {
    try {
      const response = await fetch("/api/discovery", { cache: "no-store" });
      setState(await response.json());
    } catch (error: any) {
      setState({ ok: false, error: error?.message ?? "Discovery unavailable" });
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  const tokens = useMemo(() => {
    const items = [...(state?.tokens ?? [])];
    if (filter === "volume") return items.sort((a, b) => b.volume24h - a.volume24h);
    if (filter === "gainers") return items.sort((a, b) => b.change1h - a.change1h);
    return items.sort((a, b) => {
      const aFlow = (a.buys5m - a.sells5m) + (a.buys1h - a.sells1h);
      const bFlow = (b.buys5m - b.sells5m) + (b.buys1h - b.sells1h);
      return bFlow - aFlow;
    });
  }, [state?.tokens, filter]);

  return (
    <TerminalShell>
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mono text-[10px] text-zinc-600">SOLANA / DISCOVERY</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">Find the move.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Live market discovery from indexed Solana DEX pairs. Prices, liquidity, volume and transaction flow are provider data — not simulated signals.
            </p>
          </div>
          <div className="mono text-[10px] text-zinc-600">
            {state?.updatedAt ? "UPDATED " + new Date(state.updatedAt).toLocaleTimeString() : "LOADING"}
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto">
          {([
            ["flow", "Flow"],
            ["volume", "Volume"],
            ["gainers", "1H Gainers"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={"rounded-full border px-4 py-2 text-xs " + (filter === value ? "border-white bg-white text-black" : "border-white/10 text-zinc-500")}
            >
              {label}
            </button>
          ))}
        </div>

        {state?.error && (
          <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-zinc-500">{state.error}</div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] border-b border-white/10 px-5 py-3 mono text-[9px] text-zinc-600 md:grid">
            <span>TOKEN</span><span>PRICE</span><span>1H</span><span>24H VOL</span><span>LIQUIDITY</span><span>FLOW</span>
          </div>

          {tokens.length === 0 && !state?.error ? (
            <div className="p-12 text-center text-sm text-zinc-600">No indexed Solana pairs returned.</div>
          ) : (
            tokens.map((token) => {
              const flow = token.buys5m - token.sells5m;
              const total5m = token.buys5m + token.sells5m;
              const buyRatio = total5m ? Math.round((token.buys5m / total5m) * 100) : 0;

              return (
                <div key={token.address} className="border-b border-white/5 p-4 last:border-0 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] md:items-center md:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {token.image ? <img src={token.image} alt="" className="h-9 w-9 rounded-full bg-white/5 object-cover" /> : <div className="h-9 w-9 rounded-full border border-white/10" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{token.symbol}</span>
                        {token.promoted && <span className="mono text-[8px] text-zinc-600">PROMOTED</span>}
                      </div>
                      <div className="truncate text-[10px] text-zinc-600">{token.name}</div>
                    </div>
                  </div>

                  <div className="mt-3 md:mt-0 mono text-xs">{price(token.priceUsd)}</div>
                  <div className={"mt-2 md:mt-0 mono text-xs " + (token.change1h >= 0 ? "text-zinc-200" : "text-zinc-500")}>{token.change1h >= 0 ? "+" : ""}{token.change1h.toFixed(1)}%</div>
                  <div className="mt-2 md:mt-0 mono text-xs text-zinc-400">{money(token.volume24h)}</div>
                  <div className="mt-2 md:mt-0 mono text-xs text-zinc-400">{money(token.liquidityUsd)}</div>
                  <div className="mt-3 flex items-center justify-between gap-3 md:mt-0">
                    <div>
                      <div className="mono text-xs">{flow >= 0 ? "+" : ""}{flow} net</div>
                      <div className="mt-1 text-[9px] text-zinc-600">{buyRatio}% buys / 5m</div>
                    </div>
                    <Link
                      href={"/trade?token=" + encodeURIComponent(token.address) + "&symbol=" + encodeURIComponent(token.symbol)}
                      className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-400 hover:bg-white/5"
                    >
                      Use signal
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 text-[10px] leading-5 text-zinc-700">
          Discovery is informational. A token appearing here does not mean it is safe or profitable, and “Use signal” does not place an order. Automated execution remains governed by the configured Velocity strategy and risk controls.
        </div>
      </div>
    </TerminalShell>
  );
}
