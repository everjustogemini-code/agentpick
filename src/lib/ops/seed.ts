import { DEFAULT_QUERYSET_SIZE, DOMAIN_DEFINITIONS } from "./constants";
import { buildSeedBlueprints, createBenchmarkAgent, generateQuerySet, listBenchmarkAgents, listQuerySets, saveQuerySet } from "./data";

export async function ensureDefaultQuerySets() {
  const existing = await listQuerySets();

  for (const domain of DOMAIN_DEFINITIONS) {
    const match = existing.find((querySet: any) => querySet.domain === domain.slug && querySet.isActive);
    if (!match) {
      await saveQuerySet({
        name: `${domain.label} Research v1`,
        domain: domain.slug,
        description: `Starter ${domain.label.toLowerCase()} benchmark queries.`,
        version: 1,
        isActive: true,
        queries: generateQuerySet(domain.slug, DEFAULT_QUERYSET_SIZE),
      });
    }
  }
}

export async function seedDefaultBenchmarkAgents(options?: { dryRun?: boolean }) {
  await ensureDefaultQuerySets();
  const existing = await listBenchmarkAgents();
  const blueprints = await buildSeedBlueprints();

  const querySets = await listQuerySets();
  const created = [];

  for (const blueprint of blueprints) {
    const alreadyExists = existing.find((agent: any) => agent.displayName === blueprint.displayName);
    if (alreadyExists) {
      continue;
    }

    if (options?.dryRun) {
      created.push({ ...blueprint, dryRun: true });
      continue;
    }

    const querySet = querySets.find((item: any) => item.domain === blueprint.domain && item.isActive);
    const agent = await createBenchmarkAgent({
      displayName: blueprint.displayName,
      domain: blueprint.domain,
      subdomain: blueprint.subdomain,
      description: blueprint.description,
      modelProvider: blueprint.modelProvider,
      modelName: blueprint.modelName,
      evaluatorModel: blueprint.evaluatorModel,
      toolSlugs: blueprint.toolSlugs,
      testFrequency: "every_2h",
      queriesPerRun: 3,
      toolsPerQuery: 4,
      isActive: false,
      querySetId: querySet?.id ?? null,
      customQueries: [],
    });

    created.push(agent);
  }

  return { planned: blueprints.length, createdCount: created.length, created };
}
