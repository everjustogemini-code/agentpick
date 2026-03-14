const providerEnvQueues = new Map<string, Promise<void>>();

export async function withSerializedProviderEnv<T>(
  envVar: string | null | undefined,
  task: () => Promise<T>,
): Promise<T> {
  if (!envVar) {
    return task();
  }

  const previous = providerEnvQueues.get(envVar) ?? Promise.resolve();
  let releaseCurrent: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });
  const nextQueue = previous.catch(() => undefined).then(() => current);

  providerEnvQueues.set(envVar, nextQueue);
  await previous.catch(() => undefined);

  try {
    return await task();
  } finally {
    releaseCurrent?.();

    if (providerEnvQueues.get(envVar) === nextQueue) {
      providerEnvQueues.delete(envVar);
    }
  }
}

export function __resetProviderEnvLocksForTests() {
  providerEnvQueues.clear();
}
