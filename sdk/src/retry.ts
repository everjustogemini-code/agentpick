export class AgentPickError extends Error {
  statusCode: number;
  /** @deprecated use statusCode */
  get status() { return this.statusCode; }
  fallback_reported = false;
  constructor(message: string, statusCode = 0) {
    super(message);
    this.name = 'AgentPickError';
    this.statusCode = statusCode;
  }
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const delays = [200, 400];
  let lastError: AgentPickError | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const apiErr = err instanceof AgentPickError ? err : new AgentPickError(String(err));
      lastError = apiErr;
      if (apiErr.statusCode >= 400 && apiErr.statusCode < 500) throw apiErr; // don't retry 4xx
      if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, delays[attempt] ?? 400));
    }
  }
  lastError!.fallback_reported = true;
  throw lastError;
}
