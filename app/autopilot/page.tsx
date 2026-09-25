"use client";

import TerminalShell from "@/components/TerminalShell";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useEffect, useState } from "react";

type Data = {
  ok: boolean;
  strategies: any[];
  positions: any[];
  events: any[];
  error?: string;
};

type ExecutionJob = {
  id: string;
  token_address: string;
  side: "buy" | "sell";
  amount_sol: number | string;
  max_slippage_bps: number;
  status: string;
  unsigned_transaction?: string | null;
  tx_signature?: string | null;
  failure_reason?: string | null;
};

function bytesToBase58(bytes: Uint8Array) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  for (const byte of bytes) {
    if (byte === 0) digits.push(0);
    else break;
  }
  return digits.reverse().map((x) => alphabet[x]).join("");
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default function Autopilot() {
  const { publicKey, signMessage, signTransaction } = useWallet();
  const [data, setData] = useState<Data | null>(null);
  const [executionJobs, setExecutionJobs] = useState<ExecutionJob[]>([]);
  const [stopping, setStopping] = useState(false);
  const [busyJob, setBusyJob] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  async function loadExecutionJobs() {
    if (!publicKey) {
      setExecutionJobs([]);
      return;
    }
    try {
      const r = await fetch(
        "/api/autopilot/spot-execution?wallet=" +
          encodeURIComponent(publicKey.toBase58()),
        { cache: "no-store" },
      );
      const d = await r.json();
      if (d.ok) setExecutionJobs(d.jobs ?? []);
    } catch {
      // The main status panel remains usable if queue polling temporarily fails.
    }
  }

  async function loadStatus() {
    if (!publicKey) {
      setData(null);
      return;
    }
    try {
      const r = await fetch(
        "/api/autopilot/spot-status?wallet=" +
          encodeURIComponent(publicKey.toBase58()),
        { cache: "no-store" },
      );
      setData(await r.json());
    } catch (e: any) {
      setData({
        ok: false,
        strategies: [],
        positions: [],
        events: [],
        error: e?.message || "Status unavailable",
      });
    }
  }

  async function emergencyStop() {
    if (!publicKey || !signMessage) return;
    setStopping(true);
    setNotice("");
    try {
      const message =
        "LAPRINT_EMERGENCY_STOP_V1|" +
        Date.now() +
        "|" +
        publicKey.toBase58();
      const sig = await signMessage(new TextEncoder().encode(message));
      const r = await fetch("/api/autopilot/emergency-stop", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          message,
          signature: bytesToBase58(sig),
        }),
      });
      const d = await r.json();
      setNotice(d.message || d.error || "Emergency stop complete");
      await Promise.all([loadStatus(), loadExecutionJobs()]);
    } catch (e: any) {
      setNotice(e?.message || "Emergency stop failed");
    } finally {
      setStopping(false);
    }
  }

  async function authorizeExecution(job: ExecutionJob) {
    if (!publicKey || !signTransaction || !job.unsigned_transaction) return;

    setBusyJob(job.id);
    setNotice("");

    try {
      const tx = VersionedTransaction.deserialize(
        base64ToBytes(job.unsigned_transaction),
      );

      const feePayer = tx.message.staticAccountKeys[0]?.toBase58();
      if (feePayer !== publicKey.toBase58()) {
        throw new Error("Transaction fee payer does not match this wallet.");
      }

      setNotice("Transaction is ready. Waiting for wallet approval…");
      const signed = await signTransaction(tx);

      const submit = await fetch("/api/autopilot/spot-execution", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          walletAddress: publicKey.toBase58(),
          jobId: job.id,
          signedTransaction: bytesToBase64(signed.serialize()),
        }),
      });

      const submitted = await submit.json();
      if (!submit.ok || !submitted.ok) {
        throw new Error(submitted.error || "Transaction submission failed.");
      }

      setNotice("Transaction submitted. Waiting for confirmation…");

      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const confirm = await fetch("/api/autopilot/spot-execution", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "confirm",
            walletAddress: publicKey.toBase58(),
            jobId: job.id,
          }),
        });

        const confirmed = await confirm.json();
        if (!confirm.ok || !confirmed.ok) {
          throw new Error(confirmed.error || "Confirmation check failed.");
        }

        if (confirmed.status === "confirmed") {
          setNotice(
            confirmed.positionId
              ? "Confirmed. Position is now open."
              : "Confirmed on Solana.",
          );
          await Promise.all([loadStatus(), loadExecutionJobs()]);
          return;
        }

        if (confirmed.status === "failed") {
          throw new Error(confirmed.error || "Solana transaction failed.");
        }
      }

      setNotice(
        "Transaction was submitted but confirmation is still pending. The queue will continue showing its status.",
      );
      await loadExecutionJobs();
    } catch (e: any) {
      setNotice(e?.message || "Execution was rejected or failed.");
      await loadExecutionJobs();
    } finally {
      setBusyJob(null);
    }
  }

  async function requestExit(position: any) {
    if (!publicKey || !signMessage) return;
    setBusyJob("exit:" + position.id);
    setNotice("");
    try {
      const message = "LAPRINT_EXIT_POSITION_V1|" + Date.now() + "|" + publicKey.toBase58() + "|" + position.id;
      const sig = await signMessage(new TextEncoder().encode(message));
      const r = await fetch("/api/autopilot/spot-execution", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action:"exit", walletAddress:publicKey.toBase58(), positionId:position.id, message, signature:bytesToBase58(sig), maxSlippageBps:100 }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Exit request failed");
      setNotice("Exit queued. Review and sign the sell transaction below.");
      await Promise.all([loadStatus(), loadExecutionJobs()]);
    } catch (e: any) {
      setNotice(e?.message || "Exit request failed");
    } finally {
      setBusyJob(null);
    }
  }
  useEffect(() => {
    if (!publicKey) {
      setData(null);
      setExecutionJobs([]);
      return;
    }

    let dead = false;

    const load = async () => {
      if (dead) return;
      await Promise.all([loadStatus(), loadExecutionJobs()]);
    };

    load();
    const timer = setInterval(load, 10000);

    return () => {
      dead = true;
      clearInterval(timer);
    };
  }, [publicKey]);

  return (
    <TerminalShell>
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
        <div className="mono text-[10px] text-[var(--muted)]">AUTOPILOT / SPOT</div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">Autopilot</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Signal evaluation, risk gates and execution readiness.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={emergencyStop}
              disabled={stopping || !signMessage}
              className="mono text-[10px] text-red-400 underline disabled:opacity-40"
            >
              {stopping ? "STOPPING…" : "EMERGENCY STOP"}
            </button>
            <Link href="/discover" className="mono text-[10px] underline">
              DISCOVER →
            </Link>
          </div>
        </div>

        {!publicKey ? (
          <div className="mt-8 rounded-2xl border border-[var(--line)] p-12 text-center text-sm text-[var(--muted)]">
            Connect your wallet to view strategies.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ["STRATEGIES", data?.strategies?.length ?? 0],
                [
                  "OPEN POSITIONS",
                  data?.positions?.filter((x) => x.status === "open").length ?? 0,
                ],
                ["EVENTS", data?.events?.length ?? 0],
                [
                  "AWAITING",
                  executionJobs.filter((j) => j.status === "awaiting_signature")
                    .length,
                ],
              ].map(([key, value]) => (
                <div
                  key={String(key)}
                  className="rounded-2xl border border-[var(--line)] p-5"
                >
                  <div className="mono text-[10px] text-[var(--muted)]">{key}</div>
                  <div className="mt-3 text-2xl">{value}</div>
                </div>
              ))}
            </div>

            {notice && (
              <div className="mt-4 rounded-xl border border-[var(--line)] px-4 py-3 text-xs text-[var(--muted)]">
                {notice}
              </div>
            )}

            <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="border-b border-[var(--line)] px-5 py-4 mono text-[10px] text-[var(--muted)]">
                ACTIVE STRATEGIES
              </div>

              {(data?.strategies ?? []).length === 0 ? (
                <div className="p-10 text-sm text-[var(--muted)]">
                  No strategies yet. Open a token from Discover and configure
                  Automate.
                </div>
              ) : (
                data!.strategies.map((s) => (
                  <div
                    key={s.id}
                    className="grid gap-2 border-b border-[var(--line)] px-5 py-5 md:grid-cols-6"
                  >
                    <div>
                      <div className="font-medium">
                        {s.symbol || s.token_address.slice(0, 8) + "…"}
                      </div>
                      <div className="mono text-[10px] text-[var(--muted)]">
                        {s.strategy.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="mono text-[9px] text-[var(--muted)]">MAX</div>
                      <div className="mono text-xs">{s.max_trade_sol} SOL</div>
                    </div>
                    <div>
                      <div className="mono text-[9px] text-[var(--muted)]">TP / SL</div>
                      <div className="mono text-xs">
                        +{s.take_profit_pct}% / -{s.stop_loss_pct}%
                      </div>
                    </div>
                    <div>
                      <div className="mono text-[9px] text-[var(--muted)]">TRAIL</div>
                      <div className="mono text-xs">
                        {s.trailing_activation_pct
                          ? "+" +
                            s.trailing_activation_pct +
                            "% / " +
                            s.trailing_pullback_pct +
                            "%"
                          : "OFF"}
                      </div>
                    </div>
                    <div>
                      <div className="mono text-[9px] text-[var(--muted)]">STATUS</div>
                      <div className="mono text-xs">
                        {s.active ? "ACTIVE" : "PAUSED"} ·{" "}
                        {s.automation_enabled ? "ARMED" : "LOCKED"}
                      </div>
                    </div>
                    <div className="text-right">
                      <Link
                        href={
                          "/autopilot/spot?token=" +
                          encodeURIComponent(s.token_address) +
                          "&symbol=" +
                          encodeURIComponent(s.symbol || "")
                        }
                        className="mono text-[10px] underline"
                      >
                        EDIT
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </section>


            <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="border-b border-[var(--line)] px-5 py-4 mono text-[10px] text-[var(--muted)]">OPEN POSITIONS</div>
              {(data?.positions ?? []).filter((p) => p.status === "open").length === 0 ? (
                <div className="p-10 text-sm text-[var(--muted)]">No open positions.</div>
              ) : (
                (data?.positions ?? []).filter((p) => p.status === "open").map((position) => (
                  <div key={position.id} className="grid gap-3 border-b border-[var(--line)] px-5 py-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <div className="font-medium">{position.symbol || position.token_address.slice(0, 8) + "…"}</div>
                      <div className="mono mt-1 text-[9px] text-[var(--muted)]">{position.input_sol} SOL · entry {position.entry_price_sol}</div>
                    </div>
                    <div className="mono text-xs">{position.realized_pnl_sol == null ? "OPEN" : position.realized_pnl_sol + " SOL"}</div>
                    <button onClick={() => requestExit(position)} disabled={busyJob === "exit:" + position.id || !signMessage} className="rounded-lg border border-red-400/40 px-4 py-2 text-[10px] font-bold text-red-300 disabled:opacity-40">
                      {busyJob === "exit:" + position.id ? "QUEUING…" : "EXIT POSITION"}
                    </button>
                  </div>
                ))
              )}
            </section>
            <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                <span className="mono text-[10px] text-[var(--muted)]">
                  EXECUTION QUEUE
                </span>
                <span className="mono text-[10px] text-[var(--muted)]">
                  {
                    executionJobs.filter(
                      (j) => j.status === "awaiting_signature",
                    ).length
                  }{" "}
                  AWAITING
                </span>
              </div>

              {executionJobs.length === 0 ? (
                <div className="p-10 text-sm text-[var(--muted)]">
                  No execution intents waiting.
                </div>
              ) : (
                executionJobs.slice(0, 10).map((job) => (
                  <div
                    key={job.id}
                    className="grid gap-3 border-b border-[var(--line)] px-5 py-5 md:grid-cols-[1fr_auto_auto] md:items-center"
                  >
                    <div>
                      <div className="font-medium">
                        {job.side.toUpperCase()} {job.token_address.slice(0, 8)}…
                      </div>
                      <div className="mono mt-1 text-[9px] text-[var(--muted)]">
                        {job.status.toUpperCase()} · {job.amount_sol} SOL
                      </div>
                      {job.failure_reason && (
                        <div className="mt-1 text-[10px] text-red-400">
                          {job.failure_reason}
                        </div>
                      )}
                    </div>

                    <div className="mono text-[9px] text-[var(--muted)]">
                      {job.max_slippage_bps} BPS
                    </div>

                    {job.status === "awaiting_signature" ? (
                      <button
                        onClick={() => authorizeExecution(job)}
                        disabled={
                          busyJob === job.id ||
                          !signTransaction ||
                          !job.unsigned_transaction
                        }
                        className="rounded-lg bg-[var(--fg)] px-4 py-2 text-[10px] font-bold text-[var(--bg)] disabled:opacity-40"
                      >
                        {busyJob === job.id ? "PROCESSING…" : "REVIEW & SIGN"}
                      </button>
                    ) : (
                      <span className="mono text-[9px] text-[var(--muted)]">
                        {job.tx_signature
                          ? job.tx_signature.slice(0, 10) + "…"
                          : "—"}
                      </span>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
              <div className="border-b border-[var(--line)] px-5 py-4 mono text-[10px] text-[var(--muted)]">
                AUTOMATION LOG
              </div>

              {(data?.events ?? []).length === 0 ? (
                <div className="p-10 text-sm text-[var(--muted)]">
                  No evaluation events yet.
                </div>
              ) : (
                data!.events.slice(0, 30).map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-2 border-b border-[var(--line)] px-5 py-4 md:grid-cols-4"
                  >
                    <span className="mono text-[10px] text-[var(--muted)]">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </span>
                    <span className="mono text-[10px]">
                      {event.event_type}
                    </span>
                    <span className="mono text-[10px] text-[var(--muted)]">
                      {event.token_address
                        ? event.token_address.slice(0, 10) + "…"
                        : "—"}
                    </span>
                    <span className="truncate text-xs text-[var(--muted)]">
                      {typeof event.payload === "string"
                        ? event.payload
                        : JSON.stringify(event.payload)}
                    </span>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {data?.error && (
          <p className="mt-4 text-xs text-[var(--muted)]">{data.error}</p>
        )}
      </div>
    </TerminalShell>
  );
}
