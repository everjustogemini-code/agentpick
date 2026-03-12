import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { testAllApiKeys, testApiKey } from "@/lib/ops/data";

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json().catch(() => ({}));

  if (body.all) {
    const results = await testAllApiKeys();
    return NextResponse.json({ results });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Missing key id." }, { status: 400 });
  }

  const result = await testApiKey(body.id);
  return NextResponse.json({ result });
}
