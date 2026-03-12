import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { runBenchmarkAgentNow } from "@/lib/ops/runner";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const { id } = await props.params;
    const agent = await runBenchmarkAgentNow(id);
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to trigger run." }, { status: 400 });
  }
}
