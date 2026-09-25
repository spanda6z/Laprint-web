import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JUPITER_QUOTE_URL = "https://api.jup.ag/swap/v1/quote";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") ?? "100";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json({ ok: false, error: "inputMint, outputMint and amount are required" }, { status: 400 });
  }

  if (!/^\d+$/.test(amount) || Number(amount) <= 0) {
    return NextResponse.json({ ok: false, error: "amount must be a positive integer in base units" }, { status: 400 });
  }

  const slip = Number(slippageBps);
  if (!Number.isInteger(slip) || slip < 1 || slip > 5000) {
    return NextResponse.json({ ok: false, error: "slippageBps must be between 1 and 5000" }, { status: 400 });
  }

  try {
    const url = new URL(JUPITER_QUOTE_URL);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", String(slip));

    const headers: Record<string, string> = { accept: "application/json" };
    if (process.env.JUPITER_API_KEY) headers["x-api-key"] = process.env.JUPITER_API_KEY;

    const response = await fetch(url, { headers, cache: "no-store" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: data?.error ?? "Jupiter quote unavailable" }, { status: response.status });
    }

    return NextResponse.json({ ok: true, provider: "jupiter", quote: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Quote service unavailable" }, { status: 502 });
  }
}
