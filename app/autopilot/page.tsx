"use client";
import TerminalShell from "@/components/TerminalShell";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useEffect,useState } from "react";

type Data={ok:boolean;strategies:any[];positions:any[];events:any[];error?:string};

export default function Autopilot(){
 const {publicKey,signMessage,signTransaction}=useWallet(); const [data,setData]=useState<Data|null>(null); const [stopping,setStopping]=useState(false); const [notice,setNotice]=useState("");
 const base58=(bytes:Uint8Array)=>{const alphabet="123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";let digits=[0];for(const byte of bytes){let carry=byte;for(let i=0;i<digits.length;i++){const v=digits[i]*256+carry;digits[i]=v%58;carry=Math.floor(v/58)}while(carry){digits.push(carry%58);carry=Math.floor(carry/58)}}for(const byte of bytes){if(byte===0)digits.push(0);else break}return digits.reverse().map(x=>alphabet[x]).join("")};
 const emergencyStop=async()=>{if(!publicKey||!signMessage)return;setStopping(true);setNotice("");try{const message="LAPRINT_EMERGENCY_STOP_V1|"+Date.now()+"|"+publicKey.toBase58();const sig=await signMessage(new TextEncoder().encode(message));const r=await fetch("/api/autopilot/emergency-stop",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({walletAddress:publicKey.toBase58(),message,signature:base58(sig)})});const d=await r.json();setNotice(d.message||d.error||"Emergency stop complete");if(d.ok){const rr=await fetch("/api/autopilot/spot-status?wallet="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"});setData(await rr.json())}}catch(e:any){setNotice(e?.message||"Emergency stop failed")}finally{setStopping(false)}};
 useEffect(()=>{if(!publicKey){setData(null);return;}let dead=false;
  const load=async()=>{try{const r=await fetch("/api/autopilot/spot-status?wallet="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"});const d=await r.json();if(!dead)setData(d)}catch(e:any){if(!dead)setData({ok:false,strategies:[],positions:[],events:[],error:e?.message})}};
  load();loadExecutionJobs();const t=setInterval(()=>{load();loadExecutionJobs()},10000);return()=>{dead=true;clearInterval(t)};
 },[publicKey]);
 return <TerminalShell><div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
  <div className="mono text-[10px] text-zinc-600">AUTOPILOT / SPOT</div>
  <div className="mt-4 flex items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold">Autopilot</h1><p className="mt-2 text-sm text-zinc-500">Signal evaluation, risk gates and execution readiness.</p></div><div className="flex gap-4"><button onClick={emergencyStop} disabled={stopping||!signMessage} className="mono text-[10px] text-red-400 underline disabled:opacity-40">{stopping?"STOPPING…":"EMERGENCY STOP"}</button><Link href="/discover" className="mono text-[10px] underline">DISCOVER →</Link></div></div>
  {!publicKey?<div className="mt-8 rounded-2xl border border-white/10 p-12 text-center text-sm text-zinc-500">Connect your wallet to view strategies.</div>:
  <><div className="mt-8 grid gap-4 md:grid-cols-4">
   {[["STRATEGIES",data?.strategies?.length??0],["OPEN POSITIONS",data?.positions?.filter(x=>x.status==="open").length??0],["EVENTS",data?.events?.length??0],["EXECUTION","LOCKED"]].map(([k,v])=><div key={String(k)} className="rounded-2xl border border-white/10 p-5"><div className="mono text-[10px] text-zinc-600">{k}</div><div className="mt-3 text-2xl">{v}</div></div>)}
  </div>
  {notice&&<div className="mt-4 rounded-xl border border-white/10 px-4 py-3 text-xs text-zinc-500">{notice}</div>}
  <section className="mt-8 rounded-2xl border border-white/10 overflow-hidden"><div className="border-b border-white/10 px-5 py-4 mono text-[10px] text-zinc-600">ACTIVE STRATEGIES</div>
   {(data?.strategies??[]).length===0?<div className="p-10 text-sm text-zinc-600">No strategies yet. Open a token from Discover and configure Automate.</div>:
   data!.strategies.map(s=><div key={s.id} className="grid gap-2 border-b border-white/5 px-5 py-5 md:grid-cols-6"><div><div className="font-medium">{s.symbol||s.token_address.slice(0,8)+"…"}</div><div className="mono text-[10px] text-zinc-600">{s.strategy.toUpperCase()}</div></div><div><div className="mono text-[9px] text-zinc-600">MAX</div><div className="mono text-xs">{s.max_trade_sol} SOL</div></div><div><div className="mono text-[9px] text-zinc-600">TP / SL</div><div className="mono text-xs">+{s.take_profit_pct}% / -{s.stop_loss_pct}%</div></div><div><div className="mono text-[9px] text-zinc-600">TRAIL</div><div className="mono text-xs">{s.trailing_activation_pct?("+"+s.trailing_activation_pct+"% / "+s.trailing_pullback_pct+"%"):"OFF"}</div></div><div><div className="mono text-[9px] text-zinc-600">STATUS</div><div className="mono text-xs">{s.active?"ACTIVE":"PAUSED"} · {s.automation_enabled?"ARMED":"LOCKED"}</div></div><div className="text-right"><Link href={"/autopilot/spot?token="+encodeURIComponent(s.token_address)+"&symbol="+encodeURIComponent(s.symbol||"")} className="mono text-[10px] underline">EDIT</Link></div></div>)}
  </section>
  <section className="mt-8 rounded-2xl border border-white/10 overflow-hidden">
   <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
    <span className="mono text-[10px] text-zinc-600">EXECUTION QUEUE</span>
    <span className="mono text-[10px] text-zinc-600">{executionJobs.filter(j=>j.status==="awaiting_signature").length} AWAITING</span>
   </div>
   {executionJobs.length===0?<div className="p-10 text-sm text-zinc-600">No execution intents waiting.</div>:
    executionJobs.slice(0,10).map(j=><div key={j.id} className="grid gap-3 border-b border-white/5 px-5 py-5 md:grid-cols-[1fr_auto_auto] md:items-center">
      <div><div className="font-medium">{j.side.toUpperCase()} {j.token_address.slice(0,8)}…</div><div className="mono mt-1 text-[9px] text-zinc-600">{j.status.toUpperCase()} · {j.amount_sol} SOL</div>{j.failure_reason&&<div className="mt-1 text-[10px] text-red-400">{j.failure_reason}</div>}</div>
      <div className="mono text-[9px] text-zinc-600">{j.max_slippage_bps} BPS</div>
      {j.status==="awaiting_signature"?<button onClick={()=>authorizeExecution(j)} disabled={!signTransaction} className="rounded-lg bg-white px-4 py-2 text-[10px] font-bold text-black disabled:opacity-40">REVIEW & SIGN</button>:<span className="mono text-[9px] text-zinc-600">{j.tx_signature?j.tx_signature.slice(0,10)+"…":"—"}</span>}
    </div>)}
  </section>

  <section className="mt-8 rounded-2xl border border-white/10 overflow-hidden"><div className="border-b border-white/10 px-5 py-4 mono text-[10px] text-zinc-600">AUTOMATION LOG</div>
   {(data?.events??[]).length===0?<div className="p-10 text-sm text-zinc-600">No evaluation events yet.</div>:data!.events.slice(0,30).map(e=><div key={e.id} className="grid gap-2 border-b border-white/5 px-5 py-4 md:grid-cols-4"><span className="mono text-[10px] text-zinc-500">{new Date(e.created_at).toLocaleTimeString()}</span><span className="mono text-[10px]">{e.event_type}</span><span className="mono text-[10px] text-zinc-500">{e.token_address?e.token_address.slice(0,10)+"…":"—"}</span><span className="truncate text-xs text-zinc-500">{typeof e.payload==="string"?e.payload:JSON.stringify(e.payload)}</span></div>)}
  </section></>}
  {data?.error&&<p className="mt-4 text-xs text-zinc-600">{data.error}</p>}
 </div></TerminalShell>
}