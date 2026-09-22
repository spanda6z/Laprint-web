"use client";

import Link from "next/link";
import TerminalShell from "@/components/TerminalShell";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

type Position = {
  marketIndex: number;
  baseAssetAmount: string;
  quoteEntryAmount: string;
  quoteBreakEvenAmount: string;
};

type AccountState = {
  exists: boolean;
  positions?: Position[];
  health?: string;
  error?: string;
};

const MARKET_NAMES: Record<number, string> = {
  0: "SOL-PERP",
};

export default function Positions() {
  const { publicKey } = useWallet();
  const [state, setState] = useState<AccountState | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setState(null);
      return;
    }

    let dead = false;
    const load = async () => {
      try {
        const res = await fetch(
          "/api/velocity/account?owner=" + publicKey.toBase58(),
          { cache: "no-store" }
        );
        const data = await res.json();
        if (!dead) setState(data);
      } catch (error: any) {
        if (!dead) setState({ exists: false, error: error?.message ?? "Account read failed" });
      }
    };

    load();
    const timer = setInterval(load, 5000);
    return () => {
      dead = true;
      clearInterval(timer);
    };
  }, [publicKey]);

  const positions = state?.positions ?? [];

  return (
    <TerminalShell>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mono text-[10px] text-zinc-600">ACCOUNT / POSITIONS</div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">Positions</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Live positions read directly from your Velocity subaccount.
            </p>
          </div>
          <span className="mono text-[10px] text-zinc-600">
            {state?.health ? `HEALTH ${state.health}` : "LIVE ACCOUNT"}
          </span>
        </div>

        {!publicKey ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-12 text-center text-sm text-zinc-500">
            Connect your wallet to read live positions.
          </div>
        ) : !state?.exists ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-sm text-zinc-500">Velocity subaccount 0 is not initialized.</div>
            <Link href="/connect/fund" className="mt-5 inline-block text-xs underline">
              Initialize and fund →
            </Link>
          </div>
        ) : positions.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 p-12 text-center text-sm text-zinc-600">
            No live positions.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <div className="grid min-w-[760px] grid-cols-5 border-b border-white/10 px-5 py-4 mono text-[10px] text-zinc-600">
              <span>MARKET</span>
              <span>SIDE</span>
              <span>SIZE</span>
              <span>ENTRY</span>
              <span>STATUS</span>
            </div>

            {positions.map((position) => {
              const base = Number(position.baseAssetAmount) / 1e9;
              const quote = Number(position.quoteEntryAmount) / 1e6;
              const side = base < 0 ? "SHORT" : "LONG";
              const size = Math.abs(base);
              const entry = size > 0 ? Math.abs(quote / size) : 0;

              return (
                <div
                  key={position.marketIndex}
                  className="grid min-w-[760px] grid-cols-5 items-center border-b border-white/5 px-5 py-5 text-sm last:border-b-0"
                >
                  <span>{MARKET_NAMES[position.marketIndex] ?? `PERP #${position.marketIndex}`}</span>
                  <span className="mono text-xs">{side}</span>
                  <span className="mono text-xs">{size.toFixed(4)}</span>
                  <span className="mono text-xs">{entry > 0 ? `$${entry.toFixed(4)}` : "—"}</span>
                  <span className="mono text-[10px] text-zinc-500">ON-CHAIN</span>
                </div>
              );
            })}
          </div>
        )}

        {state?.error && (
          <p className="mt-4 text-xs text-zinc-600">{state.error}</p>
        )}
      </div>
    </TerminalShell>
  );
}
