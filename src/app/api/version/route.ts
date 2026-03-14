import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Hidden version endpoint — used by autopilot to verify deployments
export async function GET() {
  let buildId = "unknown";
  let gitHash = "unknown";
  let deployTime = "unknown";

  try {
    // Next.js build ID
    const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
    buildId = readFileSync(buildIdPath, "utf8").trim();
  } catch {}

  // Read from env (set during build)
  gitHash = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || process.env.GIT_HASH || "unknown";
  deployTime = process.env.VERCEL_GIT_COMMIT_DATE || process.env.BUILD_TIME || new Date().toISOString();

  // Read autopilot cycle marker if exists
  let autopilotCycle = "none";
  try {
    const markerPath = join(process.cwd(), "DEPLOY_MARKER.json");
    const marker = JSON.parse(readFileSync(markerPath, "utf8"));
    autopilotCycle = marker.cycle || "none";
  } catch {}

  return NextResponse.json({
    status: "live",
    version: {
      buildId,
      gitHash,
      deployTime,
      autopilotCycle,
    },
    timestamp: new Date().toISOString(),
  });
}
