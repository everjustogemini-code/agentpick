import Anthropic from '@anthropic-ai/sdk';

export interface EvaluationResult {
  relevance: number;   // 0-5
  freshness: number;   // 0-5
  completeness: number; // 0-5
  reasoning: string;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function evaluateResult(
  query: string,
  intent: string | null,
  resultData: unknown,
  _modelProvider?: string,
): Promise<EvaluationResult> {
  // Truncate result data for evaluation
  const resultStr = JSON.stringify(resultData).slice(0, 3000);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Score this search API result. Respond ONLY with JSON, no other text.

Query: "${query}"
${intent ? `Context: "${intent}"` : ''}

Result (truncated):
${resultStr}

Use this rubric for RELEVANCE (0-5):
5: All results directly relevant, includes primary/authoritative sources
4: Most results relevant with minor gaps or tangential items
3: Mixed — some results relevant, some clearly off-topic
2: Few relevant results, mostly unrelated content
1: Almost entirely irrelevant to the query
0: No results returned or complete failure

Use this rubric for FRESHNESS (0-5):
5: All results are current (within days/weeks for time-sensitive topics)
4: Most results recent, one or two slightly dated
3: Mix of recent and older content
2: Mostly outdated information
1: All results significantly outdated
0: Cannot determine or no dates present

Use this rubric for COMPLETENESS (0-5):
5: Covers all major aspects of the query with depth
4: Good coverage, missing one minor angle
3: Partial coverage — hits the main point but misses related aspects
2: Superficial — only scratches the surface
1: Barely addresses the query
0: No meaningful content returned

Be discriminating — avoid giving all 5s. Most results should score 3-4. Only give 5 for genuinely excellent results.

{"relevance": <number>, "freshness": <number>, "completeness": <number>, "reasoning": "<1 sentence explaining the main strength or weakness>"}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        relevance: Math.min(5, Math.max(0, Number(parsed.relevance) || 0)),
        freshness: Math.min(5, Math.max(0, Number(parsed.freshness) || 0)),
        completeness: Math.min(5, Math.max(0, Number(parsed.completeness) || 0)),
        reasoning: String(parsed.reasoning || '').slice(0, 500),
      };
    }
  } catch (error) {
    console.error('Evaluation failed:', error instanceof Error ? error.message : error);
  }

  // Fallback: heuristic scoring
  return heuristicScore(resultData);
}

function heuristicScore(resultData: unknown): EvaluationResult {
  const str = JSON.stringify(resultData);
  const hasResults = str.length > 200;
  const hasError = str.includes('"error"') || str.includes('"Error"');

  if (hasError || !hasResults) {
    return { relevance: 1, freshness: 1, completeness: 1, reasoning: 'Error or empty response' };
  }

  // Basic scoring based on response size and structure
  const resultCount = (str.match(/"url"/g) || []).length;
  const relevance = Math.min(5, 2 + resultCount * 0.3);
  const freshness = 3; // Can't determine from structure alone
  const completeness = Math.min(5, 1.5 + (str.length / 2000));

  return {
    relevance: Math.round(relevance * 10) / 10,
    freshness,
    completeness: Math.round(completeness * 10) / 10,
    reasoning: 'Heuristic score (LLM evaluation unavailable)',
  };
}
