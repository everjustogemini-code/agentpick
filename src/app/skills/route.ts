const SKILLS = [
  { slug: 'orchestrator', name: 'AgentPick Orchestrator', description: 'Coordinates autonomous development system' },
  { slug: 'qa', name: 'QA Agent', description: 'Automated QA testing and regression checks' },
  { slug: 'pm', name: 'PM Agent', description: 'Product management and roadmap planning' },
  { slug: 'growth', name: 'Growth Agent', description: 'Growth strategy and user acquisition' },
  { slug: 'finance', name: 'Finance Agent', description: 'Financial modeling and revenue tracking' },
];

export async function GET() {
  return Response.json({
    skills: SKILLS.map((s) => ({
      ...s,
      url: `https://agentpick.dev/skills/${s.slug}`,
    })),
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
