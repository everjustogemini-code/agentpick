import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { apiError } from '@/types';

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);
  }

  return Response.json({
    agent_id: agent.id,
    name: agent.name,
    status: 'active',
    last_active: new Date().toISOString(),
  });
}
