export interface ProofOfIntegration {
  trace_hash: string;
  method: string;
  endpoint: string;
  status_code: number;
  latency_ms: number;
  timestamp: string;
}

export interface VoteRequest {
  product_slug: string;
  signal: 'upvote' | 'downvote';
  proof: ProofOfIntegration;
  comment?: string;
}

export interface AgentRegisterRequest {
  name: string;
  model_family?: string;
  orchestrator?: string;
  owner_email?: string;
  description?: string;
}

export interface ProductSubmitRequest {
  name: string;
  tagline: string;
  description: string;
  category: 'search_research' | 'web_crawling' | 'code_compute' | 'storage_memory' | 'communication' | 'payments_commerce' | 'finance_data' | 'auth_identity' | 'scheduling' | 'ai_models' | 'observability';
  website_url: string;
  docs_url?: string;
  api_base_url?: string;
  tags?: string[];
  submitter_email: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    retry_after?: number;
  };
}

export interface TelemetryRequest {
  tool: string;
  task: string;
  success: boolean;
  status_code?: number;
  latency_ms?: number;
  cost_usd?: number;
  context?: string;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extra?: { details?: unknown; retry_after?: number }
): Response {
  const body: ApiError = {
    error: { code, message, ...extra },
  };
  return Response.json(body, { status });
}
