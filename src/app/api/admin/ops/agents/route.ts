import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { createBenchmarkAgent, listBenchmarkAgents } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const agents = await listBenchmarkAgents({
    domain: searchParams.get("domain") ?? undefined,
    provider: searchParams.get("provider") ?? undefined,
    active: searchParams.get("active") ?? undefined,
  });

  return NextResponse.json({ agents });
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const body = await request.json();
    const agent = await createBenchmarkAgent(body);
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create agent." }, { status: 400 });
  }
}
