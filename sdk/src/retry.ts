export class AgentPickError extends Error {
  status?: number;
  fallback_reported = false;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AgentPickError';
    this.status = status;
  }
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [200, 400, 800];
  let lastError: AgentPickError | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const apiErr = err instanceof AgentPickError ? err : new AgentPickError(String(err));
      lastError = apiErr;
      if (apiErr.status && apiErr.status < 500) throw apiErr; // don't retry 4xx
      if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  lastError!.fallback_reported = true;
  throw lastError;
}
