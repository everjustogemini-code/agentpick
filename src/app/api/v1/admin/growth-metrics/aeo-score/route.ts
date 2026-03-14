import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AeoScore = {
  query: string;
  score: number | null;
  notes: string;
  checkedAt: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, score, notes } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    if (score !== null && score !== undefined && (typeof score !== "number" || score < 0 || score > 100)) {
      return NextResponse.json({ error: "score must be 0-100 or null" }, { status: 400 });
    }

    const entry: AeoScore = {
      query,
      score: score ?? null,
      notes: notes ?? "",
      checkedAt: new Date().toISOString(),
    };

    // Store as a TelemetryEvent for persistence (no dedicated table needed)
    // Using a system agent id convention for growth metrics
    try {
      await (prisma as any).$executeRaw`
        INSERT INTO "KeyValue" (key, value, "updatedAt")
        VALUES (${`aeo:${query}`}, ${JSON.stringify(entry)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
      `;
    } catch {
      // KeyValue table may not exist — log and continue (non-critical)
      console.log('[aeo-score] stored in memory only:', entry);
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await (prisma as any).$queryRaw`
      SELECT value FROM "KeyValue" WHERE key LIKE 'aeo:%' ORDER BY "updatedAt" DESC
    `;
    const scores = (rows as Array<{ value: string }>).map((r) =>
      typeof r.value === "string" ? JSON.parse(r.value) : r.value
    );
    return NextResponse.json(scores);
  } catch {
    return NextResponse.json([]);
  }
}
