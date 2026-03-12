import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { ensureOpsSettings, updateOpsSettings } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const settings = await ensureOpsSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json();
  const settings = await updateOpsSettings(body);
  return NextResponse.json({ settings });
}
