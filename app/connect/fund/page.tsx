"use client";

import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import ConnectWallet from "@/components/ConnectWallet";
import { PublicKey } from "@solana/web3.js";
import { initialize, VelocityClient } from "@velocity-exchange/sdk";
import { useEffect, useMemo, useState } from "react";

const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const QUOTE_MARKET_INDEX = 0;
const SUB_ACCOUNT_ID = 0;

function walletAdapter(wallet: ReturnType<typeof useWallet>) {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return null;
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
    signMessage: wallet.signMessage,
  } as any;
}

export default function Fund() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("100");
  const [account, setAccount] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const client = useMemo(() => {
    const walletForSdk = walletAdapter(wallet);
    if (!walletForSdk) return null;
    initialize({ env: "mainnet-beta" });
    return new VelocityClient({
      connection,
      wallet: walletForSdk,
      env: "mainnet-beta",
      activeSubAccountId: SUB_ACCOUNT_ID,
      subAccountIds: [SUB_ACCOUNT_ID],
    });
  }, [connection, publicKey, wallet.signTransaction, wallet.signAllTransactions, wallet.signMessage]);

  const loadAccountState = async () => {
    if (!publicKey) {
      setUsdtBalance(null);
      setSolBalance(null);
      setAccount(null);
      setExists(false);
      return;
    }

    try {
      const [tokenAccounts, solLamports] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDT_MINT }),
        connection.getBalance(publicKey, "confirmed"),
      ]);
      const raw = tokenAccounts.value.reduce(
        (total, item) => total + Number(item.account.data.parsed.info.tokenAmount.uiAmount ?? 0),
        0,
      );
      setUsdtBalance(raw);
      setSolBalance(solLamports / 1_000_000_000);
    } catch {
      setUsdtBalance(null);
      setSolBalance(null);
    }

    try {
      const res = await fetch(
        "/api/velocity/account?owner=" + encodeURIComponent(publicKey.toBase58()),
        { cache: "no-store" },
      );
      const data = await res.json();
      if (data.ok) {
        setAccount(data.userAccount ?? null);
        setExists(Boolean(data.exists));
      } else {
        setAccount(null);
        setExists(false);
      }
    } catch {
      setAccount(null);
      setExists(false);
    }
  };

  useEffect(() => {
    void loadAccountState();
  }, [publicKey, connection]);

  const initializeAndDeposit = async () => {
    if (!client || !publicKey || !connected) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid USDT amount.");
      return;
    }
    if (usdtBalance === null) {
      setError("Unable to verify your USDT balance. Refresh and try again.");
      return;
    }
    if (numericAmount > usdtBalance) {
      setError("Insufficient USDT balance in the connected wallet.");
      return;
    }
    if (solBalance !== null && solBalance < 0.01) {
      setError("Keep some SOL in the wallet for network fees and account initialization.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("Connecting to Velocity…");
    let subscribed = false;

    try {
      await client.subscribe();
      subscribed = true;

      const associatedTokenAccount = await client.getAssociatedTokenAccount(QUOTE_MARKET_INDEX);
      const preciseAmount = client.convertToSpotPrecision(QUOTE_MARKET_INDEX, numericAmount);

      let signature: string;

      if (!exists) {
        setMessage("Preparing account initialization…");
        const [txSignature, userAccountPublicKey] =
          await client.initializeUserAccountAndDepositCollateral(
            preciseAmount,
            associatedTokenAccount,
            QUOTE_MARKET_INDEX,
            SUB_ACCOUNT_ID,
          );
        signature = txSignature;
        setAccount(userAccountPublicKey.toBase58());
        setExists(true);
      } else {
        setMessage("Preparing USDT deposit…");
        signature = await client.deposit(
          preciseAmount,
          QUOTE_MARKET_INDEX,
          associatedTokenAccount,
          SUB_ACCOUNT_ID,
        );
      }

      setMessage("Transaction confirmed. Opening tier selection…");
      console.info("Velocity transaction:", signature);
      window.setTimeout(() => window.location.assign("/tier"), 700);
    } catch (e: any) {
      setError(
        e?.message ||
          "Velocity transaction failed. Your wallet was not changed unless a transaction was signed and submitted.",
      );
      setMessage("");
    } finally {
      if (subscribed) await client.unsubscribe().catch(() => undefined);
      setBusy(false);
    }
  };

  const short = publicKey
    ? publicKey.toBase58().slice(0, 6) + "..." + publicKey.toBase58().slice(-4)
    : "Not connected";

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
        <Link href="/" className="text-sm text-zinc-500">← La😂Print</Link>
        <div className="mt-16">
          <div className="mono text-xs text-zinc-600">01 / ACCOUNT</div>
          <h1 className="mt-4 text-4xl font-semibold md:text-6xl">Fund your trading account.</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-400">
            Create your Velocity subaccount and deposit USDT as collateral. Your wallet signs the transaction directly; La😂Print never receives your private key.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.025] p-6">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Deposit amount</span><span className="mono text-xs">USDT</span>
            </div>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="mt-4 w-full border-b border-white/10 bg-transparent pb-3 text-4xl outline-none"
            />

            <div className="mt-8 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-zinc-500">CONNECTED WALLET</div>
              <div className="mt-1 mono text-sm">{short}</div>
              {usdtBalance !== null && <div className="mt-2 text-xs text-zinc-600">Wallet balance {usdtBalance.toFixed(2)} USDT</div>}
              {solBalance !== null && <div className="mt-1 text-xs text-zinc-600">Network balance {solBalance.toFixed(4)} SOL</div>}
            </div>

            <div className="mt-4 rounded-xl border border-white/10 p-4">
              <div className="text-xs text-zinc-500">VELOCITY SUBACCOUNT · 0</div>
              <div className="mt-1 mono text-sm text-zinc-400">
                {account ? account.slice(0, 6) + "..." + account.slice(-4) : connected ? "Not initialized" : "Connect wallet first"}
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                {exists ? "Account initialized" : "Account will be initialized with this deposit"}
              </div>
            </div>

            {!connected ? (
              <div className="mt-6"><ConnectWallet /></div>
            ) : (
              <button
                onClick={initializeAndDeposit}
                disabled={busy || !client}
                className="mt-6 w-full rounded-xl bg-white px-5 py-4 text-sm font-bold text-black disabled:opacity-40"
              >
                {busy ? "Preparing / signing…" : exists ? "Deposit & continue" : "Initialize & deposit"}
              </button>
            )}

            {message && <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-300">{message}</div>}
            {error && <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-400">{error}</div>}

            {exists && !busy && (
              <Link href="/tier" className="mt-3 block w-full rounded-xl border border-white/10 px-5 py-4 text-center text-sm">
                Continue to tier selection
              </Link>
            )}

            <p className="mt-4 text-xs leading-5 text-zinc-600">
              Mainnet collateral is USDT. The Velocity account is an on-chain account controlled by your wallet authority.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
