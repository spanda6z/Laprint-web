import { NextRequest, NextResponse } from "next/server";
import { flowScore, type FlowToken } from "@/lib/flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEX = "https://api.dexscreener.com";
const HELIUS_KEY = process.env.HELIUS_KEY || "";

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  if (!r.ok) throw new Error(`${r.status} upstream response`);
  return r.json() as Promise<T>;
}

async function rpc(method: string, params: unknown[]) {
  if (!HELIUS_KEY) return null;
  const r = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const body = await r.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}

function bestPair(pairs: any[]) {
  return (pairs || [])
    .filter((p) => p.chainId === "solana")
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0] || null;
}

export async function GET(req: NextRequest) {
  const mint = new URL(req.url).searchParams.get("mint")?.trim();
  if (!mint || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    return NextResponse.json({ ok: false, error: "Invalid Solana mint" }, { status: 400 });
  }

  try {
    const pairs = await getJson<any[]>(`${DEX}/tokens/v1/solana/${mint}`);
    const pair = bestPair(pairs);
    if (!pair) return NextResponse.json({ ok: false, error: "Token not found" }, { status: 404 });

    let security: any = {
      available: false,
      mintAuthorityActive: null,
      freezeAuthorityActive: null,
      top10Pct: null,
      top10PctIncludesLp: false,
      flags: [],
    };

    if (HELIUS_KEY) {
      try {
        const account = await rpc("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
        const info = account?.value?.data?.parsed?.info;
        if (info) {
          const largest = await rpc("getTokenLargestAccounts", [mint]);
          const supply = Number(info.supply);
          const top10 = (largest?.value || []).slice(0, 10);
          const amount = top10.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
          security = {
            available: true,
            mintAuthorityActive: info.mintAuthority !== null,
            freezeAuthorityActive: info.freezeAuthority !== null,
            top10Pct: supply > 0 ? Math.round((amount / supply) * 1000) / 10 : null,
            top10PctIncludesLp: true,
            flags: [
              ...(info.mintAuthority !== null ? ["Mint authority active"] : []),
              ...(info.freezeAuthority !== null ? ["Freeze authority active"] : []),
            ],
          };
        }
      } catch {
        // Security is optional. Missing provider data remains visible in the response.
      }
    }

    const token: FlowToken = {
      symbol: pair.baseToken?.symbol || "UNKNOWN",
      name: pair.baseToken?.name || "Unknown token",
      priceUsd: pair.priceUsd || null,
      change1h: Number(pair.priceChange?.h1 || 0),
      change24h: Number(pair.priceChange?.h24 || 0),
      liquidityUsd: Number(pair.liquidity?.usd || 0),
      volume1h: Number(pair.volume?.h1 || 0),
      volume24h: Number(pair.volume?.h24 || 0),
      buys5m: Number(pair.txns?.m5?.buys || 0),
      sells5m: Number(pair.txns?.m5?.sells || 0),
      buys1h: Number(pair.txns?.h1?.buys || 0),
      sells1h: Number(pair.txns?.h1?.sells || 0),
      buys24h: Number(pair.txns?.h24?.buys || 0),
      sells24h: Number(pair.txns?.h24?.sells || 0),
      top10Pct: security.top10Pct,
      mintAuthority: security.mintAuthorityActive == null ? null : String(security.mintAuthorityActive),
      freezeAuthority: security.freezeAuthorityActive == null ? null : String(security.freezeAuthorityActive),
    };

    const flow = flowScore(token);

    return NextResponse.json({
      ok: true,
      formulaVersion: "flow-v1",
      token: {
        mint,
        symbol: token.symbol,
        name: token.name,
        priceUsd: token.priceUsd,
        change: pair.priceChange || {},
        volume: pair.volume || {},
        txns: pair.txns || {},
        liquidityUsd: token.liquidityUsd,
        marketCap: pair.marketCap ?? pair.fdv ?? null,
        pairAddress: pair.pairAddress || null,
        dex: pair.dexId || null,
        createdAt: pair.pairCreatedAt || null,
        url: pair.url || null,
      },
      security,
      flow,
      limitations: {
        holderConcentration: security.top10PctIncludesLp
          ? "Top-10 concentration may include liquidity-pool accounts and is not a clean holder-concentration measure."
          : null,
        social: "Social activity is not included in this score.",
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "FLOW intelligence unavailable" },
      { status: 502 },
    );
  }
}
