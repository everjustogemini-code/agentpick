import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { generateQuerySet, listQuerySets, saveQuerySet } from "@/lib/ops/data";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const querySets = await listQuerySets();
  return NextResponse.json({ querySets });
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === "generate") {
    return NextResponse.json({ queries: generateQuerySet(String(body.domain ?? "finance")) });
  }

  try {
    const querySet = await saveQuerySet(body);
    return NextResponse.json({ querySet });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save query set." }, { status: 400 });
  }
}
