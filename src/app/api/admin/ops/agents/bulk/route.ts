import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import { runDueBenchmarkAgents } from "@/lib/ops/runner";

export const maxDuration = 300;

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
      // Run due ops benchmark agents directly (not the old cron)
      const agents = await runDueBenchmarkAgents(5);
      return NextResponse.json({
        ok: true,
        action,
        triggered: agents.length,
        agents: agents.map((a: any) => ({
          id: a?.id,
          displayName: a?.displayName,
          lastRunAt: a?.lastRunAt,
          lastRunSuccess: a?.lastRunSuccess,
        })),
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk operation failed." },
      { status: 500 },
    );
  }
}
