import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { deleteQuerySet } from "@/lib/ops/data";

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const { id } = await props.params;
  await deleteQuerySet(id);
  return NextResponse.json({ ok: true });
}
