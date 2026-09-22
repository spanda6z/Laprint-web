"use client";
import TerminalShell from "@/components/TerminalShell";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect,useState } from "react";

type Data={ok:boolean;strategies:any[];positions:any[];events:any[];error?:string};

export default function Autopilot(){
 const {publicKey}=useWallet(); const [data,setData]=useState<Data|null>(null);
 useEffect(()=>{if(!publicKey){setData(null);return;}let dead=false;
  const load=async()=>{try{const r=await fetch("/api/autopilot/spot-status?wallet="+encodeURIComponent(publicKey.toBase58()),{cache:"no-store"});const d=await r.json();if(!dead)setData(d)}catch(e:any){if(!dead)setData({ok:false,strategies:[],positions:[],events:[],error:e?.message})}};
  load();const t=setInterval(load,10000);return()=>{dead=true;clearInterval(t)};
 },[publicKey]);
 return <TerminalShell><div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
  <div className="mono text-[10px] text-zinc-600">AUTOPILOT / SPOT</div>
  <div className="mt-4 flex items-end justify-between gap-4"><div><h1 className="text-4xl font-semibold">Autopilot</h1><p className="mt-2 text-sm text-zinc-500">Signal evaluation, risk gates and execution readiness.</p></div><Link href="/discover" className="mono text-[10px] underline">DISCOVER →</Link></div>
  {!publicKey?<div className="mt-8 rounded-2xl border border-white/10 p-12 text-center text-sm text-zinc-500">Connect your wallet to view strategies.</div>:
  <><div className="mt-8 grid gap-4 md:grid-cols-4">
   {[["STRATEGIES",data?.strategies?.length??0],["OPEN POSITIONS",data?.positions?.filter(x=>x.status==="open").length??0],["EVENTS",data?.events?.length??0],["EXECUTION","LOCKED"]].map(([k,v])=><div key={String(k)} className="rounded-2xl border border-white/10 p-5"><div className="mono text-[10px] text-zinc-600">{k}</div><div className="mt-3 text-2xl">{v}</div></div>)}
  </div>
  <section className="mt-8 rounded-2xl border border-white/10 overflow-hidden"><div className="border-b border-white/10 px-5 py-4 mono text-[10px] text-zinc-600">ACTIVE STRATEGIES</div>
   {(data?.strategies??[]).length===0?<div className="p-10 text-sm text-zinc-600">No strategies yet. Open a token from Discover and configure Automate.</div>:
   data!.strategies.map(s=><div key={s.id} className="grid gap-2 border-b border-white/5 px-5 py-5 md:grid-cols-6"><div><div className="font-medium">{s.symbol||s.token_address.slice(0,8)+"…"}</div><div className="mono text-[10px] text-zinc-600">{s.strategy.toUpperCase()}</div></div><div><div className="mono text-[9px] text-zinc-600">MAX</div><div className="mono text-xs">{s.max_trade_sol} SOL</div></div><div><div className="mono text-[9px] text-zinc-600">TP / SL</div><div className="mono text-xs">+{s.take_profit_pct}% / -{s.stop_loss_pct}%</div></div><div><div className="mono text-[9px] text-zinc-600">TRAIL</div><div className="mono text-xs">{s.trailing_activation_pct?("+"+s.trailing_activation_pct+"% / "+s.trailing_pullback_pct+"%"):"OFF"}</div></div><div><div className="mono text-[9px] text-zinc-600">STATUS</div><div className="mono text-xs">{s.active?"ACTIVE":"PAUSED"} · {s.automation_enabled?"ARMED":"LOCKED"}</div></div><div className="text-right"><Link href={"/autopilot/spot?token="+encodeURIComponent(s.token_address)+"&symbol="+encodeURIComponent(s.symbol||"")} className="mono text-[10px] underline">EDIT</Link></div></div>)}
  </section>
  <section className="mt-8 rounded-2xl border border-white/10 overflow-hidden"><div className="border-b border-white/10 px-5 py-4 mono text-[10px] text-zinc-600">AUTOMATION LOG</div>
   {(data?.events??[]).length===0?<div className="p-10 text-sm text-zinc-600">No evaluation events yet.</div>:data!.events.slice(0,30).map(e=><div key={e.id} className="grid gap-2 border-b border-white/5 px-5 py-4 md:grid-cols-4"><span className="mono text-[10px] text-zinc-500">{new Date(e.created_at).toLocaleTimeString()}</span><span className="mono text-[10px]">{e.event_type}</span><span className="mono text-[10px] text-zinc-500">{e.token_address?e.token_address.slice(0,10)+"…":"—"}</span><span className="truncate text-xs text-zinc-500">{typeof e.payload==="string"?e.payload:JSON.stringify(e.payload)}</span></div>)}
  </section></>}
  {data?.error&&<p className="mt-4 text-xs text-zinc-600">{data.error}</p>}
 </div></TerminalShell>
}