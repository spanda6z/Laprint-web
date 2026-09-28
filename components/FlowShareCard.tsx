"use client";
import { useState } from "react";
import { flowScore, type FlowToken } from "@/lib/flow";
export default function FlowShareCard({ token }: { token: FlowToken & { address?: string } }) {
  const [copied,setCopied]=useState(false); const result=flowScore(token);
  const price=token.priceUsd ? "$"+Number(token.priceUsd).toPrecision(5) : "—";
  const change=(token.change1h>=0?"+":"")+token.change1h.toFixed(1)+"%";
  const causes=[token.volume1h>0?"Volume is active in the latest hour":"Volume data is unavailable",result.buyPressure!=null?Math.round(result.buyPressure)+"% buy pressure in the latest 5M":"Buy/sell flow is unavailable",token.liquidityUsd>0?"Liquidity is currently reported at $"+Math.round(token.liquidityUsd).toLocaleString():"Liquidity data is unavailable"];
  async function copy(){const url=typeof window!=="undefined"?window.location.href:"https://flow.app";const text="Why is $"+token.symbol+" moving? "+change+" · Flow "+result.score+" · "+result.band+" · "+url;try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1400)}catch{}}
  const shareText=encodeURIComponent("Why is $"+token.symbol+" moving? "+change+" · Flow "+result.score+" · "+result.band);
  const shareUrl=typeof window!=="undefined"?encodeURIComponent(window.location.href):encodeURIComponent("https://flow.app");
  return <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg)] p-6 shadow-xl"><div className="mono text-[8px] tracking-[.18em] text-[var(--muted)]">FLOW / SHARE CARD</div>
    <div className="mt-6 flex items-start justify-between gap-5"><div><div className="text-xs text-[var(--muted)]">WHY IS</div><div className="mt-1 text-3xl font-semibold tracking-[-.05em]">{token.symbol}</div><div className="mt-2 text-sm text-[var(--muted)]">{change} · {price} · Last 1 hour</div></div><div className="text-right"><div className="text-3xl font-semibold">{result.score}</div><div className="text-xs">{result.band}</div><div className="mt-1 text-[9px] text-[var(--muted)]">{result.confidence} confidence</div></div></div>
    <div className="mt-6 space-y-3">{causes.map((cause,i)=><div key={cause} className="flex gap-3 rounded-xl border border-[var(--line)] p-3"><span className="mono text-[8px] text-[var(--muted)]">0{i+1}</span><span className="text-[10px] leading-5">{cause}</span></div>)}</div>
    <div className="mt-5 border-t border-[var(--line)] pt-4 text-[9px] leading-5 text-[var(--muted)]">High score is not a buy signal. Missing data lowers confidence, and we show it.</div>
    <div className="mt-4 flex flex-wrap gap-2"><a href={"https://x.com/intent/post?text="+shareText+"&url="+shareUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--fg)] px-4 py-2 text-[10px] font-bold text-[var(--bg)]">Share to X</a><a href={"https://t.me/share/url?url="+shareUrl+"&text="+shareText} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px] font-semibold">Telegram</a><button onClick={copy} className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-[10px]">{copied?"Copied":"Copy"}</button></div>
  </div>;
}
