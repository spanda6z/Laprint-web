import { NextResponse } from "next/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(req:Request){
 const backend=process.env.LAPRINT_BACKEND_URL;
 if(!backend)return NextResponse.json({ok:false,error:"LAPRINT_BACKEND_URL is not configured"},{status:500});
 const wallet=new URL(req.url).searchParams.get("wallet");
 if(!wallet)return NextResponse.json({ok:false,error:"wallet is required"},{status:400});
 try{const r=await fetch(new URL("/api/spot-execution?wallet="+encodeURIComponent(wallet),backend),{cache:"no-store"});const d=await r.json().catch(()=>({ok:false,error:"Invalid backend response"}));return NextResponse.json(d,{status:r.status});}
 catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Execution status unavailable"},{status:502});}
}
export async function POST(req:Request){
 const backend=process.env.LAPRINT_BACKEND_URL;
 if(!backend)return NextResponse.json({ok:false,error:"LAPRINT_BACKEND_URL is not configured"},{status:500});
 try{
  const input=await req.json();
  const action=String(input?.action||"");
  const target=action==="prepare"?"/api/spot-execution/prepare":action==="submit"?"/api/spot-execution/submit":action==="confirm"?"/api/spot-execution/confirm":action==="exit"?"/api/spot-exit":null;
  if(!target)return NextResponse.json({ok:false,error:"Invalid execution action"},{status:400});
  const r=await fetch(new URL(target,backend),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input),cache:"no-store"});
  const d=await r.json().catch(()=>({ok:false,error:"Invalid backend response"}));
  return NextResponse.json(d,{status:r.status});
 }catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Execution request failed"},{status:502});}
}