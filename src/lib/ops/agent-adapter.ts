import { randomBytes, createHash } from "crypto";
import { prisma } from "./prisma";
import { normalizeDisplayName, slugify } from "./utils";

type AgentDirectoryItem = {
  id: string;
  label: string;
  description?: string | null;
};

export async function listAgentDirectory(): Promise<AgentDirectoryItem[]> {
  const agentDelegate = (prisma as any).agent;
  if (!agentDelegate?.findMany) {
    return [];
  }

  try {
    const agents = await agentDelegate.findMany({
      take: 250,
      orderBy: { createdAt: "desc" },
    });

    return (agents ?? []).map((agent: any) => ({
      id: agent.id,
      label: agent.displayName || agent.name || agent.slug || agent.id,
      description: agent.description ?? null,
    }));
  } catch {
    return [];
  }
}

export async function ensureAgentIdentity(input: {
  displayName: string;
  domain: string;
  description?: string | null;
}): Promise<string> {
  const agentDelegate = (prisma as any).agent;
  if (!agentDelegate?.findFirst || !agentDelegate?.create) {
    throw new Error("The existing Agent model is required to create benchmark configs.");
  }

  const slug = normalizeDisplayName(input.displayName);
  let existing: any = null;
  const lookupCandidates = [{ slug }, { name: input.displayName }, { displayName: input.displayName }];

  for (const where of lookupCandidates) {
    try {
      existing = await agentDelegate.findFirst({ where });
      if (existing?.id) {
        break;
      }
    } catch {
      continue;
    }
  }

  if (existing?.id) {
    return existing.id;
  }

  // Generate a unique apiKeyHash for benchmark agents (required by Agent model)
  const apiKeyHash = createHash("sha256")
    .update(`benchmark-${slug}-${randomBytes(16).toString("hex")}`)
    .digest("hex");

  const createCandidates = [
    {
      name: input.displayName,
      slug,
      displayName: input.displayName,
      description: input.description ?? null,
      domain: input.domain,
      isActive: false,
      apiKeyHash,
    },
    {
      name: input.displayName,
      slug,
      description: input.description ?? null,
      isActive: false,
      apiKeyHash,
    },
    {
      name: input.displayName,
      description: input.description ?? null,
      apiKeyHash,
    },
  ];

  let lastError: unknown;

  for (const candidate of createCandidates) {
    try {
      const created = await agentDelegate.create({ data: candidate });
      if (created?.id) {
        return created.id;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to create Agent row for ${slugify(input.displayName)}.`);
}
