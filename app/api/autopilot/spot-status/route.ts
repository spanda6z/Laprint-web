import { NextResponse } from "next/server";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function GET(req:Request){
 const backend=process.env.LAPRINT_BACKEND_URL;
 if(!backend)return NextResponse.json({ok:false,error:"LAPRINT_BACKEND_URL is not configured"},{status:500});
 const wallet=new URL(req.url).searchParams.get("wallet");
 if(!wallet)return NextResponse.json({ok:false,error:"wallet is required"},{status:400});
 try{
  const response=await fetch(new URL("/api/spot-status?wallet="+encodeURIComponent(wallet),backend),{cache:"no-store"});
  const data=await response.json().catch(()=>({ok:false,error:"Invalid backend response"}));
  return NextResponse.json(data,{status:response.status});
 }catch(error:any){return NextResponse.json({ok:false,error:error?.message||"Spot status unavailable"},{status:502});}
}