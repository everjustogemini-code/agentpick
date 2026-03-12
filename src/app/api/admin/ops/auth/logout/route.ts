import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/ops/auth";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
