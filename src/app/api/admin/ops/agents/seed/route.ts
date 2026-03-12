import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { seedDefaultBenchmarkAgents } from "@/lib/ops/seed";

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json().catch(() => ({}));
  const result = await seedDefaultBenchmarkAgents({ dryRun: Boolean(body.dryRun) });
  return NextResponse.json({ result });
}
