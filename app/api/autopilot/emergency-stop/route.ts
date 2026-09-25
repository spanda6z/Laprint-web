import { NextResponse } from "next/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(req:Request){
 const backend=process.env.LAPRINT_BACKEND_URL;
 if(!backend)return NextResponse.json({ok:false,error:"LAPRINT_BACKEND_URL is not configured"},{status:500});
 try{const payload=await req.json();const r=await fetch(new URL("/api/spot-emergency-stop",backend),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});const d=await r.json().catch(()=>({ok:false,error:"Invalid backend response"}));return NextResponse.json(d,{status:r.status});}
 catch(e:any){return NextResponse.json({ok:false,error:e?.message||"Emergency stop unavailable"},{status:502});}
}