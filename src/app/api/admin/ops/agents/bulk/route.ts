import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === "activate_all") {
      const result = await (prisma as any).benchmarkAgentConfig.updateMany({
        where: { isActive: false },
        data: { isActive: true },
      });
      return NextResponse.json({ ok: true, action, updated: result.count });
    }

    if (action === "pause_all") {
      const result = await (prisma as any).benchmarkAgentConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      return NextResponse.json({ ok: true, action, updated: result.count });
    }

    if (action === "run_all") {
      // Trigger the benchmark cron endpoint
      const cronSecret = process.env.CRON_SECRET;
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/cron/benchmark-run`, {
        headers: cronSecret ? { authorization: `Bearer ${cronSecret}` } : {},
      });
      const data = await res.json();
      return NextResponse.json({ ok: true, action, cron: data });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk operation failed." },
      { status: 500 },
    );
  }
}
