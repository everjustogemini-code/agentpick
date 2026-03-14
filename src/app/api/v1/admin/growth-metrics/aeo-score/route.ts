import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type AeoScore = {
  query: string;
  score: number | null;
  notes: string;
  checkedAt: string;
};

function getDataPath(): string {
  return path.join(process.cwd(), "data/aeo-scores.json");
}

function readScores(): AeoScore[] {
  try {
    const p = getDataPath();
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8")) as AeoScore[];
  } catch {
    return [];
  }
}

function writeScores(scores: AeoScore[]): void {
  const p = getDataPath();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(scores, null, 2), "utf-8");
}

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

    const scores = readScores();
    const idx = scores.findIndex((s) => s.query === query);
    const entry: AeoScore = {
      query,
      score: score ?? null,
      notes: notes ?? "",
      checkedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      scores[idx] = entry;
    } else {
      scores.push(entry);
    }

    writeScores(scores);
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const scores = readScores();
  return NextResponse.json(scores);
}
