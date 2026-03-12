import { ensureOpsSettings, listBenchmarkAgents } from "./data";

function indent(line: string, depth = 2) {
  return `${" ".repeat(depth)}${line}`;
}

export async function buildOpenClawExport() {
  const [agents, settings] = await Promise.all([listBenchmarkAgents(), ensureOpsSettings()]);

  const json = {
    agents: agents.map((agent: any) => ({
      name: agent.displayName,
      model: agent.modelName,
      provider: agent.modelProvider,
      domain: agent.domain,
      schedule: agent.testFrequency,
      tools: agent.toolSlugs,
      heartbeat: `${settings.exportBaseUrl ?? ""}/api/admin/ops/status`.replace(/\/+/g, "/").replace(":/", "://"),
      openclaw: {
        enabled: agent.openclawEnabled,
        config: agent.openclawConfig ?? {},
      },
    })),
  };

  const lines = [
    "agents:",
    ...json.agents.flatMap((agent: any) => [
      indent(`- name: ${agent.name}`),
      indent(`model: ${agent.model}`),
      indent(`provider: ${agent.provider}`),
      indent(`domain: ${agent.domain}`),
      indent(`schedule: ${agent.schedule}`),
      indent(`tools: [${agent.tools.join(", ")}]`),
      indent(`heartbeat: ${agent.heartbeat || "/api/admin/ops/status"}`),
    ]),
  ];

  return {
    json,
    yaml: lines.join("\n"),
  };
}
