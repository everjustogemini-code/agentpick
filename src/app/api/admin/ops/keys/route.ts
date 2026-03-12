import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { listApiKeys, saveApiKey } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const keys = await listApiKeys();
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const body = await request.json();
    const key = await saveApiKey(body);
    return NextResponse.json({ key });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save key." }, { status: 400 });
  }
}
