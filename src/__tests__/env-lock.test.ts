import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetProviderEnvLocksForTests,
  withSerializedProviderEnv,
} from '@/lib/router/env-lock';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  delete process.env.TEST_PROVIDER_KEY;
  delete process.env.OTHER_PROVIDER_KEY;
  __resetProviderEnvLocksForTests();
});

describe('withSerializedProviderEnv', () => {
  it('serializes overlapping work for the same provider env var', async () => {
    process.env.TEST_PROVIDER_KEY = 'platform-key';

    const order: string[] = [];
    const observedValues: string[] = [];

    const first = withSerializedProviderEnv('TEST_PROVIDER_KEY', async () => {
      const original = process.env.TEST_PROVIDER_KEY;
      process.env.TEST_PROVIDER_KEY = 'byok-key';
      order.push('first-start');
      await sleep(25);
      observedValues.push(process.env.TEST_PROVIDER_KEY ?? '');
      process.env.TEST_PROVIDER_KEY = original;
      order.push('first-end');
    });

    const second = withSerializedProviderEnv('TEST_PROVIDER_KEY', async () => {
      order.push('second-start');
      observedValues.push(process.env.TEST_PROVIDER_KEY ?? '');
      order.push('second-end');
    });

    await Promise.all([first, second]);

    expect(order).toEqual(['first-start', 'first-end', 'second-start', 'second-end']);
    expect(observedValues).toEqual(['byok-key', 'platform-key']);
  });

  it('does not serialize unrelated provider env vars', async () => {
    const order: string[] = [];

    await Promise.all([
      withSerializedProviderEnv('TEST_PROVIDER_KEY', async () => {
        order.push('first-start');
        await sleep(20);
        order.push('first-end');
      }),
      withSerializedProviderEnv('OTHER_PROVIDER_KEY', async () => {
        order.push('second-start');
        await sleep(5);
        order.push('second-end');
      }),
    ]);

    expect(order).toContain('first-start');
    expect(order).toContain('second-start');
    expect(order.indexOf('second-end')).toBeLessThan(order.indexOf('first-end'));
  });
});
