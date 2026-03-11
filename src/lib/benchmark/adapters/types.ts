export interface ToolCallResult {
  statusCode: number;
  latencyMs: number;
  resultCount: number;
  response: unknown;
  costUsd: number;
}

export interface ToolAdapter {
  slug: string;
  call: (query: string, config?: Record<string, unknown>) => Promise<ToolCallResult>;
}
