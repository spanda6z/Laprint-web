import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type XPost={id:string;text:string;created_at?:string;author_id?:string;public_metrics?:{like_count?:number;reply_count?:number;retweet_count?:number;impression_count?:number}};
type XUser={id:string;name?:string;username?:string;profile_image_url?:string};
function escapeTerm(value:string){return value.replace(/["\\\\]/g,"\\\\$&").slice(0,120)}
function buildQuery(symbol:string,address:string){const terms=[symbol?"$"+escapeTerm(symbol.replace(/[^a-zA-Z0-9_]/g,"")):"",address?"\""+escapeTerm(address)+"\"":""].filter(Boolean);return terms.length?"("+terms.join(" OR ")+") -is:retweet":""}
export async function GET(req:NextRequest){
 const token=process.env.X_API_BEARER_TOKEN; const sp=new URL(req.url).searchParams; const symbol=(sp.get("symbol")||"").trim(); const address=(sp.get("address")||"").trim();
 if(!token)return NextResponse.json({ok:true,source:"x",configured:false,signals:[],message:"X API provider is not configured."});
 const query=buildQuery(symbol,address); if(!query)return NextResponse.json({ok:true,source:"x",configured:true,signals:[]});
 const url=new URL("https://api.x.com/2/tweets/search/recent"); url.searchParams.set("query",query); url.searchParams.set("max_results","20"); url.searchParams.set("tweet.fields","created_at,public_metrics,author_id"); url.searchParams.set("user.fields","name,username,profile_image_url"); url.searchParams.set("expansions","author_id");
 try{
  const response=await fetch(url,{headers:{Authorization:"Bearer "+token},cache:"no-store"}); const body=await response.json();
  if(!response.ok)return NextResponse.json({ok:false,source:"x",configured:true,signals:[],error:body?.detail||body?.title||("X API returned "+response.status)},{status:502});
  const users=new Map<string,XUser>((body.includes?.users||[]).map((u:XUser)=>[u.id,u]));
  const now=Date.now(); const signals=(body.data||[] as XPost[]).map((post:XPost)=>{const author=post.author_id?users.get(post.author_id):undefined; const m=post.public_metrics||{}; const ageMinutes=post.created_at?Math.max(0,(now-Date.parse(post.created_at))/60000):null; return {type:"mention",postId:post.id,text:post.text,createdAt:post.created_at||null,ageMinutes,temporalWindow:ageMinutes!=null&&ageMinutes<=60,author:author?{id:author.id,name:author.name||author.username||"Unknown",username:author.username||"",image:author.profile_image_url||null}:null,url:author?.username?"https://x.com/"+author.username+"/status/"+post.id:null,engagement:(m.like_count||0)+(m.reply_count||0)+(m.retweet_count||0),metrics:m}});
  return NextResponse.json({ok:true,source:"x",configured:true,query,signals,updatedAt:new Date().toISOString()});
 }catch(error:any){return NextResponse.json({ok:false,source:"x",configured:true,signals:[],error:error?.message||"X signal service unavailable"},{status:502});}
}