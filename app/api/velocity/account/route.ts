import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { VelocityClient, Wallet, BulkAccountLoader } from "@velocity-exchange/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function makeClient(authority: PublicKey) {
  const connection = new Connection(RPC, "confirmed");
  const payer = Keypair.generate();
  return new VelocityClient({
    connection,
    wallet: new Wallet(payer),
    env: "mainnet-beta",
    authority,
    activeSubAccountId: 0,
    subAccountIds: [0],
    accountSubscription: { type: "polling", accountLoader: new BulkAccountLoader(connection, "confirmed", 1000) }
  });
}

export async function GET(req: Request) {
  try {
    const authority = new PublicKey(new URL(req.url).searchParams.get("owner") || "");
    const vc = makeClient(authority);
    const userPda = await vc.getUserAccountPublicKey(0);
    const info = await vc.connection.getAccountInfo(userPda, "confirmed");
    if (!info) return NextResponse.json({ ok:true, exists:false, authority:authority.toBase58(), subAccountId:0, userAccount:userPda.toBase58() });
    await vc.subscribe();
    const user = vc.getUser(0);
    await user.fetchAccounts();
    const account = user.getUserAccount();
    const quote = user.getTokenAmount(0);
    const health = user.getHealth();
    const positions = account.perpPositions.filter((p:any)=>!p.baseAssetAmount.isZero()).map((p:any)=>({
      marketIndex:p.marketIndex,
      baseAssetAmount:p.baseAssetAmount.toString(),
      quoteEntryAmount:p.quoteEntryAmount.toString(),
      quoteBreakEvenAmount:p.quoteBreakEvenAmount.toString()
    }));
    await vc.unsubscribe();
    return NextResponse.json({ok:true,exists:true,authority:authority.toBase58(),subAccountId:0,userAccount:userPda.toBase58(),quoteBalance:quote.toString(),health:health.toString(),positions});
  } catch(e:any) { return NextResponse.json({ok:false,error:e?.message||"Velocity account read failed"},{status:500}); }
}