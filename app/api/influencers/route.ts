import { NextResponse } from "next/server";

export async function GET(){
  return NextResponse.json({
    influencers: [],
    source: "not_connected",
    message: "No X data provider is configured. No influencer activity is fabricated."
  });
}
