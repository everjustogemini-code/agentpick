import { NextRequest, NextResponse } from "next/server";
import { requireOpsApiAuth } from "@/lib/ops/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/ops/crypto";

export const maxDuration = 300;

const db = prisma as any;

export async function POST(request: NextRequest) {
  try {
    await requireOpsApiAuth(request);
  } catch (response) {
    return response as NextResponse;
  }

  try {
    const body = await request.json();
    const { action } = body as { action: string };

    // ── diagnose ──────────────────────────────────────────────────────
    if (action === "diagnose") {
      const configs = await db.benchmarkAgentConfig.findMany({
        orderBy: { displayName: "asc" },
      });

      const vaultKeys = await db.apiKeyVault.findMany();
      const vaultMap = Object.fromEntries(
        vaultKeys.map((k: any) => [k.service, k]),
      );

      const agents = configs.map((c: any) => {
        const toolSlugs: string[] = c.toolSlugs ?? [];
        const toolApiKeys: Record<string, string> = c.toolApiKeys ?? {};
        const missingKeys = toolSlugs.filter(
          (s: string) => !toolApiKeys[s] || String(toolApiKeys[s]).length < 5,
        );

        return {
          id: c.id,
          displayName: c.displayName,
          domain: c.domain,
          isActive: c.isActive,
          lastRunAt: c.lastRunAt?.toISOString() ?? null,
          lastRunSuccess: c.lastRunSuccess,
          consecutiveFails: c.consecutiveFails ?? 0,
          totalRuns: c.totalRuns ?? 0,
          totalTests: c.totalTests ?? 0,
          avgSuccessRate: c.avgSuccessRate,
          toolSlugs,
          missingKeys,
          status: !c.isActive
            ? "paused"
            : (c.consecutiveFails ?? 0) > 0
              ? "failing"
              : !c.lastRunAt
                ? "never-run"
                : "healthy",
        };
      });

      const summary = {
        total: agents.length,
        active: agents.filter((a: any) => a.isActive).length,
        paused: agents.filter((a: any) => !a.isActive).length,
        healthy: agents.filter((a: any) => a.status === "healthy").length,
        failing: agents.filter((a: any) => a.status === "failing").length,
        neverRun: agents.filter((a: any) => a.status === "never-run").length,
        withMissingKeys: agents.filter((a: any) => a.missingKeys.length > 0)
          .length,
        vault: Object.fromEntries(
          vaultKeys.map((k: any) => {
            const decrypted = decryptSecret(k.apiKey);
            return [
              k.service,
              {
                hasKey: !!decrypted && decrypted.length > 5,
                keyLength: decrypted?.length ?? 0,
                usedThisMonth: k.usedThisMonth ?? 0,
              },
            ];
          }),
        ),
      };

      return NextResponse.json({ ok: true, action, summary, agents });
    }

    // ── restart-failed ────────────────────────────────────────────────
    if (action === "restart-failed") {
      const result = await db.benchmarkAgentConfig.updateMany({
        where: {
          OR: [{ consecutiveFails: { gt: 0 } }, { isActive: false }],
        },
        data: {
          consecutiveFails: 0,
          isActive: true,
        },
      });
      return NextResponse.json({
        ok: true,
        action,
        updated: result.count,
      });
    }

    // ── activate-all ──────────────────────────────────────────────────
    if (action === "activate-all") {
      const result = await db.benchmarkAgentConfig.updateMany({
        where: { isActive: false },
        data: { isActive: true, consecutiveFails: 0 },
      });
      return NextResponse.json({
        ok: true,
        action,
        updated: result.count,
      });
    }

    // ── fix-tool-keys ─────────────────────────────────────────────────
    if (action === "fix-tool-keys") {
      const configs = await db.benchmarkAgentConfig.findMany();
      const vaultKeys = await db.apiKeyVault.findMany();
      const vaultMap: Record<string, string> = {};
      for (const k of vaultKeys) {
        vaultMap[k.service] = k.apiKey; // already encrypted
      }

      let fixedCount = 0;
      const details: Array<{
        id: string;
        displayName: string;
        fixed: string[];
      }> = [];

      for (const config of configs) {
        const toolSlugs: string[] = config.toolSlugs ?? [];
        const existing: Record<string, string> = config.toolApiKeys ?? {};
        const fixed: string[] = [];
        const updated = { ...existing };

        for (const slug of toolSlugs) {
          const currentKey = existing[slug];
          const isInvalid =
            !currentKey || String(currentKey).length < 5;

          if (isInvalid && vaultMap[slug]) {
            updated[slug] = vaultMap[slug];
            fixed.push(slug);
          }
        }

        if (fixed.length > 0) {
          await db.benchmarkAgentConfig.update({
            where: { id: config.id },
            data: { toolApiKeys: updated },
          });
          fixedCount++;
          details.push({
            id: config.id,
            displayName: config.displayName,
            fixed,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        action,
        agentsFixed: fixedCount,
        details,
      });
    }


    // ── refresh-tool-keys ───────────────────────────────────────────
    if (action === "refresh-tool-keys") {
      const configs = await db.benchmarkAgentConfig.findMany();
      const vaultKeys = await db.apiKeyVault.findMany();
      const vaultMap: Record<string, string> = {};
      for (const k of vaultKeys) { vaultMap[k.service] = k.apiKey; }
      let refreshedCount = 0;
      for (const config of configs) {
        const toolSlugs: string[] = config.toolSlugs ?? [];
        const updated: Record<string, string> = {};
        let changed = false;
        for (const slug of toolSlugs) {
          if (vaultMap[slug]) {
            updated[slug] = vaultMap[slug];
            const old = (config.toolApiKeys as Record<string, string>)?.[slug];
            if (old !== vaultMap[slug]) changed = true;
          }
        }
        if (changed) {
          await db.benchmarkAgentConfig.update({ where: { id: config.id }, data: { toolApiKeys: updated } });
          refreshedCount++;
        }
      }
      return NextResponse.json({ ok: true, action, agentsRefreshed: refreshedCount });
    }

    // ── probe-tool ─────────────────────────────────────────────────
    if (action === "probe-tool") {
      const { tool, query: probeQuery } = body as { tool?: string; query?: string };
      if (!tool) {
        return NextResponse.json({ error: "Missing 'tool' param" }, { status: 400 });
      }
      const vaultRecord = await db.apiKeyVault.findUnique({ where: { service: tool } });
      if (!vaultRecord) {
        return NextResponse.json({ error: `No vault key for ${tool}` }, { status: 404 });
      }
      const apiKey = decryptSecret(vaultRecord.apiKey);
      const q = probeQuery || "latest AI tools for developers 2026";

      // Direct API call to show raw response
      const start = Date.now();
      let rawResponse: unknown;
      let statusCode = 0;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        let res: Response;

        if (tool === "serper") {
          res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": apiKey },
            body: JSON.stringify({ q }),
            signal: controller.signal,
          });
        } else if (tool === "tavily") {
          res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ api_key: apiKey, query: q, max_results: 3 }),
            signal: controller.signal,
          });
        } else if (tool === "exa") {
          res = await fetch("https://api.exa.ai/search", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": apiKey },
            body: JSON.stringify({ query: q, numResults: 3 }),
            signal: controller.signal,
          });
        } else {
          clearTimeout(timeout);
          return NextResponse.json({ error: `probe-tool not implemented for ${tool}` }, { status: 400 });
        }

        clearTimeout(timeout);
        statusCode = res.status;
        rawResponse = await res.json();
      } catch (e) {
        rawResponse = { error: e instanceof Error ? e.message : "Unknown error" };
      }

      const latencyMs = Date.now() - start;
      // Truncate response for readability
      const responseStr = JSON.stringify(rawResponse);
      const truncated = responseStr.length > 3000
        ? { _truncated: true, preview: responseStr.slice(0, 2000) }
        : rawResponse;

      return NextResponse.json({
        ok: true,
        action,
        tool,
        query: q,
        statusCode,
        latencyMs,
        responseKeys: typeof rawResponse === "object" && rawResponse ? Object.keys(rawResponse) : [],
        organicCount: Array.isArray((rawResponse as any)?.organic) ? (rawResponse as any).organic.length : null,
        resultsCount: Array.isArray((rawResponse as any)?.results) ? (rawResponse as any).results.length : null,
        rawResponse: truncated,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Valid: diagnose, restart-failed, activate-all, fix-tool-keys, probe-tool` },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Repair operation failed.",
      },
      { status: 500 },
    );
  }
}
