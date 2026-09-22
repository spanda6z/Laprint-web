import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { DriftClient, Wallet, initialize, getMarketsAndOraclesForSubscription } from "@drift-labs/sdk";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const owner = new PublicKey(body.owner);
    const amountSol = Number(body.amountSol);
    if (!Number.isFinite(amountSol) || amountSol <= 0 || amountSol > 1000) return jsonError("Invalid deposit amount.");

    const connection = new Connection(RPC, "confirmed");
    const env = "mainnet-beta";
    const cfg = initialize({ env });
    const { perpMarketIndexes, spotMarketIndexes, oracleInfos } = getMarketsAndOraclesForSubscription(env);
    const supportedOracleInfos = oracleInfos.filter((info: any) => {
      const source = info?.oracleSource as Record<string, unknown> | undefined;
      const name = source ? Object.keys(source)[0] : undefined;
      return !["switchboard","switchboardOnDemand","deprecatedSwitchboard","deprecatedSwitchboardOnDemand"].includes(name || "");
    });

    const payer = Keypair.generate();
    const client = new DriftClient({
      connection,
      wallet: new Wallet(payer),
      programID: new PublicKey(cfg.DRIFT_PROGRAM_ID),
      env,
      perpMarketIndexes,
      spotMarketIndexes,
      oracleInfos: supportedOracleInfos,
      accountSubscription: { type: "polling", accountLoader: { load: async () => {}, addAccount: async () => {}, removeAccount: async () => {}, getAccountDataAndSlot: async () => undefined } as any }
    });

    const userPk = await client.getUserAccountPublicKey(owner, 0);
    const exists = await connection.getAccountInfo(userPk);

    const instructions: any[] = [];
    if (!exists) {
      const [initIxs] = await client.getInitializeUserAccountIxs(owner, 0);
      instructions.push(...initIxs);
    }

    const spotIndex = 1;
    const spot = client.getSpotMarketAccount(spotIndex);
    if (!spot) return jsonError("Drift USDC spot market unavailable.", 503);

    return NextResponse.json({
      ok: true,
      owner: owner.toBase58(),
      userAccount: userPk.toBase58(),
      initialized: !!exists,
      instructions: instructions.map((ix: any) => ({
        programId: ix.programId.toBase58(),
        keys: ix.keys.map((k: any) => ({ pubkey: k.pubkey.toBase58(), isSigner: k.isSigner, isWritable: k.isWritable })),
        data: Buffer.from(ix.data).toString("base64")
      })),
      note: "SOL is not Drift collateral on the standard USDC spot market. The funding UI must not label a SOL transfer as a Drift collateral deposit."
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unable to build Drift account transaction.", 500);
  }
}