import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { getDashboardSnapshot } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const dashboard = await getDashboardSnapshot();
  return NextResponse.json({ dashboard });
}
