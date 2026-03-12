import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { deleteBenchmarkAgent, getBenchmarkAgentById, updateBenchmarkAgent } from "@/lib/ops/data";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await props.params;
  const agent = await getBenchmarkAgentById(id);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await props.params;

  try {
    const body = await request.json();
    const agent = await updateBenchmarkAgent({ id, ...body });
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update agent." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await props.params;
  await deleteBenchmarkAgent(id);
  return NextResponse.json({ ok: true });
}
