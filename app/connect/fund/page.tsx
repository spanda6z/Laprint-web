"use client";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import ConnectWallet from "@/components/ConnectWallet";
import { useEffect, useState } from "react";
import { Transaction } from "@solana/web3.js";

export default function Fund(){
  const {publicKey,connected,sendTransaction}=useWallet();
  const {connection}=useConnection();
  const [balance,setBalance]=useState<number|null>(null);
  const [amount,setAmount]=useState("1.0");
  const [driftAccount,setDriftAccount]=useState<string|null>(null);
  const [exists,setExists]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{if(!publicKey){setBalance(null);setDriftAccount(null);setExists(false);return}
    connection.getBalance(publicKey).then(v=>setBalance(v/1e9)).catch(()=>setBalance(null));
    fetch("/api/drift/account?owner="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"}).then(r=>r.json()).then(d=>{if(d.ok){setDriftAccount(d.userAccount);setExists(d.exists)}}).catch(()=>{});
  },[publicKey,connection]);

  const deposit=async()=>{
    if(!publicKey||!connected)return;
    setBusy(true);setError("");setMessage("");
    try{
      const res=await fetch("/api/drift/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({owner:publicKey.toBase58(),amountSol:Number(amount)})});
      const data=await res.json();
      if(!res.ok||!data.ok)throw new Error(data.error||"Could not build Drift transaction");
      const tx=Transaction.from(Buffer.from(data.transaction,"base64"));
      const sig=await sendTransaction(tx,connection);
      await connection.confirmTransaction(sig,"confirmed");
      setMessage("Deposit confirmed. Drift account is now funded.");
      setExists(true);
      const refreshed=await connection.getBalance(publicKey);setBalance(refreshed/1e9);
    }catch(e:any){setError(e?.message||"Transaction failed")}
    finally{setBusy(false)}
  };

  const short=publicKey?publicKey.toBase58().slice(0,6)+"..."+publicKey.toBase58().slice(-4):"Not connected";
  return <main className="min-h-screen bg-[#070707]"><div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
    <Link href="/" className="text-sm text-zinc-500">← La😂Print</Link>
    <div className="mt-16"><div className="mono text-xs text-zinc-600">01 / ACCOUNT</div><h1 className="mt-4 text-4xl font-semibold md:text-6xl">Fund your trading account.</h1>
    <p className="mt-5 max-w-xl text-sm leading-6 text-zinc-400">Deposit SOL into your own Drift subaccount. The transaction is built from Drift's on-chain program and must be signed by your wallet.</p>
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.025] p-6">
      <div className="flex justify-between text-sm text-zinc-400"><span>Deposit amount</span><span className="mono text-xs">SOL</span></div>
      <input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" className="mt-4 w-full border-b border-white/10 bg-transparent pb-3 text-4xl outline-none"/>
      <div className="mt-8 rounded-xl border border-white/10 p-4"><div className="text-xs text-zinc-500">CONNECTED WALLET</div><div className="mt-1 mono text-sm">{short}</div>{balance!==null&&<div className="mt-2 text-xs text-zinc-600">Wallet balance {balance.toFixed(4)} SOL</div>}</div>
      <div className="mt-4 rounded-xl border border-white/10 p-4"><div className="text-xs text-zinc-500">DRIFT SUBACCOUNT · 0</div><div className="mt-1 mono text-sm text-zinc-400">{driftAccount?driftAccount.slice(0,6)+"..."+driftAccount.slice(-4):connected?"Resolving…":"Connect wallet first"}</div><div className="mt-2 text-xs text-zinc-600">{exists?"Account initialized":"Account will be initialized with this deposit"}</div></div>
      {!connected?<div className="mt-6"><ConnectWallet/></div>:<button onClick={deposit} disabled={busy} className="mt-6 w-full rounded-xl bg-white px-5 py-4 text-sm font-bold text-black disabled:opacity-40">{busy?"Building / signing…":"Deposit & continue"}</button>}
      {message&&<div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-300">{message}</div>}
      {error&&<div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-zinc-400">{error}</div>}
      <Link href="/tier" className="mt-3 block w-full rounded-xl border border-white/10 px-5 py-4 text-center text-sm">Continue to tier selection</Link>
      <p className="mt-4 text-xs leading-5 text-zinc-600">La😂Print never receives your private key. Your wallet signs the Drift transaction directly.</p>
    </div></div></div></main>
}
