import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getBlogPostCount(): number {
  try {
    const blogDir = path.join(process.cwd(), "src/app/blog");
    if (!fs.existsSync(blogDir)) return 0;
    const entries = fs.readdirSync(blogDir, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pagePath = path.join(blogDir, entry.name, "page.tsx");
        if (fs.existsSync(pagePath)) count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

function getAeoScores(): AeoScore[] {
  try {
    const dataPath = path.join(process.cwd(), "data/aeo-scores.json");
    if (!fs.existsSync(dataPath)) return [];
    const raw = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(raw) as AeoScore[];
  } catch {
    return [];
  }
}

type AeoScore = {
  query: string;
  score: number | null;
  notes: string;
  checkedAt: string;
};

export async function GET() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Acquisition metrics
  let totalAgents = 0;
  let agentsToday = 0;
  let agentsThisWeek = 0;
  let totalRouterCalls = 0;
  let routerCallsToday = 0;
  let routerCallsThisWeek = 0;
  let uniqueAgentsRouting = 0;

  // Conversion metrics
  let paidAccounts = 0;
  let totalProducts = 0;

  // Funnel metrics
  let agentsMade1Call = 0;
  let agentsMade10Calls = 0;

  // Growth trend (agents per day last 30 days)
  const agentsPerDay: { date: string; count: number }[] = [];

  try {
    totalAgents = await (prisma as any).agent.count();
  } catch {}

  try {
    agentsToday = await (prisma as any).agent.count({
      where: { createdAt: { gte: last24h } },
    });
  } catch {}

  try {
    agentsThisWeek = await (prisma as any).agent.count({
      where: { createdAt: { gte: last7d } },
    });
  } catch {}

  try {
    totalRouterCalls = await (prisma as any).routerCall.count();
  } catch {}

  try {
    routerCallsToday = await (prisma as any).routerCall.count({
      where: { createdAt: { gte: last24h } },
    });
  } catch {}

  try {
    routerCallsThisWeek = await (prisma as any).routerCall.count({
      where: { createdAt: { gte: last7d } },
    });
  } catch {}

  try {
    const distinctResult = await (prisma as any).routerCall.groupBy({
      by: ["developerId"],
      _count: { developerId: true },
    });
    uniqueAgentsRouting = distinctResult.length;
  } catch {}

  try {
    paidAccounts = await (prisma as any).developerAccount.count({
      where: { plan: { not: "FREE" } },
    });
  } catch {}

  try {
    totalProducts = await (prisma as any).product.count();
  } catch {}

  // Funnel: agents who made at least 1 call
  try {
    const atLeast1 = await (prisma as any).routerCall.groupBy({
      by: ["developerId"],
      _count: { developerId: true },
      having: { developerId: { _count: { gte: 1 } } },
    });
    agentsMade1Call = atLeast1.length;
  } catch {}

  // Agents who made at least 10 calls
  try {
    const atLeast10 = await (prisma as any).routerCall.groupBy({
      by: ["developerId"],
      _count: { developerId: true },
      having: { developerId: { _count: { gte: 10 } } },
    });
    agentsMade10Calls = atLeast10.length;
  } catch {}

  // Growth trend: agents per day last 30 days
  try {
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentAgents = await (prisma as any).agent.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dayMap: Record<string, number> = {};
    for (const agent of recentAgents) {
      const day = agent.createdAt.toISOString().slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + 1;
    }

    // Fill all 30 days (even zero days)
    for (let i = 0; i < 30; i++) {
      const d = new Date(last30d.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      agentsPerDay.push({ date: key, count: dayMap[key] || 0 });
    }
  } catch {}

  const conversionRate = totalAgents > 0 ? paidAccounts / totalAgents : 0;
  const blogPostCount = getBlogPostCount();
  const aeoScores = getAeoScores();

  // Ensure default AEO query entries exist
  const defaultQueries = [
    "best search API for AI agents",
    "tool routing for AI agents",
    "AI agent API benchmark",
  ];
  const scoreMap = new Map(aeoScores.map((s) => [s.query, s]));
  const mergedAeoScores = defaultQueries.map((q) =>
    scoreMap.get(q) ?? { query: q, score: null, notes: "", checkedAt: null }
  );

  return NextResponse.json({
    generatedAt: now.toISOString(),
    acquisition: {
      totalAgents,
      agentsToday,
      agentsThisWeek,
      totalRouterCalls,
      routerCallsToday,
      routerCallsThisWeek,
      uniqueAgentsRouting,
    },
    conversion: {
      paidAccounts,
      checkoutSessionsCreated: null, // TODO: pull from Stripe
      conversionRate: Math.round(conversionRate * 10000) / 100, // percentage
    },
    funnel: {
      registered: totalAgents,
      made1Call: agentsMade1Call,
      made10Calls: agentsMade10Calls,
      paid: paidAccounts,
    },
    content: {
      blogPostCount,
      totalProducts,
    },
    aeoScores: mergedAeoScores,
    growthTrend: agentsPerDay,
  });
}
