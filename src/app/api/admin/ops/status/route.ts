import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { getStatusSnapshot } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const status = await getStatusSnapshot();
  return NextResponse.json(status);
}
