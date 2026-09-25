import { NextResponse } from "next/server";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { BulkAccountLoader, VelocityClient, Wallet, initialize } from "@velocity-exchange/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

function makeClient(authority: PublicKey) {
  const connection = new Connection(RPC, "confirmed");
  const readOnlyWallet = new Wallet(Keypair.generate());

  initialize({ env: "mainnet-beta" });

  return new VelocityClient({
    connection,
    wallet: readOnlyWallet,
    env: "mainnet-beta",
    authority,
    activeSubAccountId: 0,
    subAccountIds: [0],
    skipLoadUsers: true,
    accountSubscription: {
      type: "polling",
      accountLoader: new BulkAccountLoader(connection, "confirmed", 1000),
    },
  });
}

export async function GET(req: Request) {
  let vc: VelocityClient | null = null;
  let subscribed = false;

  try {
    const owner = new URL(req.url).searchParams.get("owner");
    if (!owner) return NextResponse.json({ ok: false, error: "Missing owner" }, { status: 400 });

    let authority: PublicKey;
    try {
      authority = new PublicKey(owner);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid owner public key" }, { status: 400 });
    }

    vc = makeClient(authority);

    const accounts = await vc.getUserAccountsAndAddressesForAuthority(authority);
    const account = accounts.find((item: any) => Number(item.account.subAccountId) === 0);

    if (!account) {
      return NextResponse.json({
        ok: true,
        exists: false,
        authority: authority.toBase58(),
        subAccountId: 0,
        userAccount: null,
      });
    }

    await vc.subscribe();
    subscribed = true;

    const user = vc.getUser(0, authority);
    const userAccount = user.getUserAccount();
    const quote = user.getTokenAmount(0);
    const health = user.getHealth();

    const positions = (userAccount?.perpPositions ?? [])
      .filter((position: any) => !position.baseAssetAmount.isZero())
      .map((position: any) => ({
        marketIndex: position.marketIndex,
        baseAssetAmount: position.baseAssetAmount.toString(),
        quoteEntryAmount: position.quoteEntryAmount.toString(),
        quoteBreakEvenAmount: position.quoteBreakEvenAmount.toString(),
      }));

    return NextResponse.json({
      ok: true,
      exists: true,
      authority: authority.toBase58(),
      subAccountId: 0,
      userAccount: account.publicKey.toBase58(),
      quoteBalance: quote.toString(),
      health: health.toString(),
      positions,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Velocity account read failed" },
      { status: 500 },
    );
  } finally {
    if (vc && subscribed) await vc.unsubscribe().catch(() => undefined);
  }
}
