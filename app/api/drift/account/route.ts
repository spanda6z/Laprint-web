import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { DriftClient, Wallet, initialize, getMarketsAndOraclesForSubscription, BN } from "@drift-labs/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const UNSUPPORTED = new Set(["switchboard","switchboardOnDemand","deprecatedSwitchboard","deprecatedSwitchboardOnDemand"]);

function driftClientFor(owner: PublicKey) {
  const connection = new Connection(RPC, "confirmed");
  const env = "mainnet-beta";
  const cfg = initialize({ env });
  const { perpMarketIndexes, spotMarketIndexes, oracleInfos } = getMarketsAndOraclesForSubscription(env);
  const oracleList = oracleInfos.filter((info: any) => {
    const source = info?.oracleSource as Record<string, unknown> | undefined;
    const name = source ? Object.keys(source)[0] : undefined;
    return !UNSUPPORTED.has(name || "");
  });
  // Instruction generation only. The ephemeral key is never used to sign or receive user funds.
  const payer = Keypair.generate();
  const wallet = new Wallet(payer);
  (wallet as any).publicKey = owner;
  return new DriftClient({
    connection,
    wallet: wallet as any,
    programID: new PublicKey(cfg.DRIFT_PROGRAM_ID),
    env,
    perpMarketIndexes,
    spotMarketIndexes,
    oracleInfos: oracleList,
  });
}

export async function GET(req: Request) {
  try {
    const owner = new PublicKey(new URL(req.url).searchParams.get("owner") || "");
    const client = driftClientFor(owner);
    const userAccount = await client.getUserAccountPublicKey(0, owner);
    const info = await client.connection.getAccountInfo(userAccount, "confirmed");
    return NextResponse.json({
      ok: true,
      owner: owner.toBase58(),
      subAccountId: 0,
      userAccount: userAccount.toBase58(),
      exists: Boolean(info),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Invalid wallet." }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const owner = new PublicKey(body.owner || "");
    const amountSol = Number(body.amountSol);
    if (!Number.isFinite(amountSol) || amountSol < 0.001 || amountSol > 1000) {
      return NextResponse.json({ ok: false, error: "Deposit must be between 0.001 and 1000 SOL." }, { status: 400 });
    }

    const client = driftClientFor(owner);
    const lamports = Math.floor(amountSol * 1e9);
    const amount = new BN(lamports);
    // Drift's SOL spot market is index 0. The SDK wraps SOL and closes the temporary
    // WSOL account as part of the generated instruction set.
    const [tx, userAccountPublicKey] = await client.createInitializeUserAccountAndDepositCollateral(
      amount,
      owner,
      0,
      0
    );

    const raw = "serialize" in tx ? tx.serialize({ requireAllSignatures: false, verifySignatures: false }) : tx.serialize();
    return NextResponse.json({
      ok: true,
      userAccount: userAccountPublicKey.toBase58(),
      transaction: Buffer.from(raw).toString("base64"),
      amountSol,
      marketIndex: 0,
      message: "Unsigned Drift deposit transaction. Your wallet must sign it.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Unable to build Drift deposit transaction." }, { status: 500 });
  }
}
