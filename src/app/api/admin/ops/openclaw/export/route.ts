import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { buildOpenClawExport } from "@/lib/ops/export";

export async function GET(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  const format = new URL(request.url).searchParams.get("format") ?? "yaml";
  const exported = await buildOpenClawExport();

  if (format === "json") {
    return NextResponse.json(exported.json);
  }

  return new NextResponse(exported.yaml, {
    headers: {
      "content-type": "text/yaml; charset=utf-8",
      "content-disposition": 'attachment; filename="agentpick-openclaw.yaml"',
    },
  });
}
