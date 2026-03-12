import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { listRuns } from "@/lib/ops/data";
import { buildCronAdapterPayload } from "@/lib/ops/runner";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const runs = await listRuns({
    agentId: searchParams.get("agentId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    hours: searchParams.get("hours") ? Number(searchParams.get("hours")) : undefined,
  });

  return NextResponse.json({ runs });
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json().catch(() => ({}));
  const result = await buildCronAdapterPayload(Number(body.limit ?? 10));
  return NextResponse.json({ result });
}
