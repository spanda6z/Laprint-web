import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const backend = process.env.LAPRINT_BACKEND_URL;
  if (!backend) return NextResponse.json({ ok: false, error: "LAPRINT_BACKEND_URL is not configured" }, { status: 500 });
  try {
    const payload = await req.json();
    const response = await fetch(new URL("/api/spot-strategy", backend), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({ ok: false, error: "Invalid backend response" }));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Spot strategy service unavailable" }, { status: 502 });
  }
}
