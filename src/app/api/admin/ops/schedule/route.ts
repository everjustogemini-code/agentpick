import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { getScheduleSnapshot, updateOpsSettings } from "@/lib/ops/data";
import { prisma } from "@/lib/ops/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const snapshot = await getScheduleSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const body = await request.json();
  const settings = await updateOpsSettings(body);

  if (body.applyToAll) {
    await (prisma as any).benchmarkAgentConfig.updateMany({
      data: { testFrequency: settings.defaultFrequency },
    });
  }

  return NextResponse.json({ settings });
}
