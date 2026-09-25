import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JUPITER_SWAP_URL = "https://api.jup.ag/swap/v1/swap";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userPublicKey = typeof body?.userPublicKey === "string" ? body.userPublicKey : "";
    const quoteResponse = body?.quoteResponse;

    if (!userPublicKey || !quoteResponse || typeof quoteResponse !== "object") {
      return NextResponse.json(
        { ok: false, error: "userPublicKey and quoteResponse are required" },
        { status: 400 }
      );
    }

    try {
      new PublicKey(userPublicKey);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid Solana wallet address" }, { status: 400 });
    }

    if (typeof quoteResponse.inputMint !== "string" ||
        typeof quoteResponse.outputMint !== "string" ||
        typeof quoteResponse.inAmount !== "string" ||
        typeof quoteResponse.outAmount !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid Jupiter quote response" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
    };
    if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;

    const response = await fetch(JUPITER_SWAP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: data?.error || data?.message || "Jupiter swap transaction unavailable" },
        { status: response.status }
      );
    }

    if (!data?.swapTransaction) {
      return NextResponse.json({ ok: false, error: "Jupiter returned no swap transaction" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      provider: "jupiter",
      swapTransaction: data.swapTransaction,
      lastValidBlockHeight: data.lastValidBlockHeight ?? null,
      prioritizationFeeLamports: data.prioritizationFeeLamports ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Swap service unavailable" },
      { status: 502 }
    );
  }
}
