import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "utm-track",
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
}
