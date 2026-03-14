import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/lib/ops/crypto';
import {
  getByokEnvVarForService,
  listByokKeys,
  normalizeByokService,
  parseByokKeys,
  resolveStoredByokKeyForSlug,
} from '@/lib/router/byok';

describe('BYOK helpers', () => {
  it('normalizes supported services and aliases', () => {
    expect(normalizeByokService('Exa')).toBe('exa');
    expect(normalizeByokService('exa-search')).toBe('exa');
    expect(normalizeByokService('serpapi-google')).toBe('serpapi');
    expect(normalizeByokService('not-real')).toBeNull();
  });

  it('lists saved keys without exposing encrypted values', () => {
    const raw = {
      exa: {
        service: 'exa',
        displayName: 'Exa',
        encryptedKey: encryptSecret('exa-secret-key'),
        keyPreview: 'exa-...-key',
        status: 'active',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        lastUsedAt: null,
      },
    };

    const keys = listByokKeys(raw);

    expect(keys).toEqual([
      {
        service: 'exa',
        displayName: 'Exa',
        keyPreview: 'exa-...-key',
        status: 'active',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        lastUsedAt: null,
      },
    ]);
    expect(parseByokKeys(raw).exa.encryptedKey).not.toBe('exa-secret-key');
    expect(decryptSecret(parseByokKeys(raw).exa.encryptedKey)).toBe('exa-secret-key');
  });

  it('resolves stored keys for router slugs', () => {
    const raw = {
      serper: {
        service: 'serper',
        displayName: 'Serper',
        encryptedKey: encryptSecret('serper-secret-key'),
        keyPreview: 'serp...-key',
        status: 'active',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        lastUsedAt: null,
      },
      tavily: {
        service: 'tavily',
        displayName: 'Tavily',
        encryptedKey: encryptSecret('tavily-secret-key'),
        keyPreview: 'tavi...-key',
        status: 'inactive',
        createdAt: '2026-03-14T00:00:00.000Z',
        updatedAt: '2026-03-14T00:00:00.000Z',
        lastUsedAt: null,
      },
    };

    expect(resolveStoredByokKeyForSlug(raw, 'serper-api')).toEqual({
      service: 'serper',
      apiKey: 'serper-secret-key',
      keyPreview: 'serp...-key',
    });
    expect(resolveStoredByokKeyForSlug(raw, 'tavily')).toBeNull();
    expect(getByokEnvVarForService('serper')).toBe('SERPER_API_KEY');
  });
});
