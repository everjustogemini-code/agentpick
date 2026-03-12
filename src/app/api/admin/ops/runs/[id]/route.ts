import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { getRun } from "@/lib/ops/data";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await props.params;
  const run = await getRun(id);
  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }
  return NextResponse.json({ run });
}
