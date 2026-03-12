import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword, setSessionCookie } from "@/lib/ops/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = String(body.password ?? "");

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  return setSessionCookie(response);
}
