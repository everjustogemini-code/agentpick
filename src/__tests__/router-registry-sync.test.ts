import { describe, it, expect } from 'vitest';
import { CAPABILITY_TOOLS } from '@/lib/router/index';

/**
 * Single source of truth for the embed tool allowlist.
 * Must match agentpick-router-qa.py TestEmbedRouter.valid_embed_tools.
 * When adding a new embed adapter, update BOTH this constant AND the QA script.
 */
export const QA_EMBED_ALLOWLIST = ['voyage-embed', 'cohere-embed'] as const;

describe('router-registry ↔ QA allowlist sync', () => {
  it('CAPABILITY_TOOLS.embed[0] must be voyage-embed', () => {
    expect(CAPABILITY_TOOLS.embed[0]).toBe('voyage-embed');
  });

  it('every embed tool slug in registry must appear in QA_EMBED_ALLOWLIST', () => {
    for (const slug of CAPABILITY_TOOLS.embed) {
      expect(QA_EMBED_ALLOWLIST as readonly string[]).toContain(slug);
    }
  });

  it('retired embed slugs must NOT be in QA_EMBED_ALLOWLIST', () => {
    const retired = ['voyage-ai', 'jina-embeddings'];
    for (const slug of retired) {
      expect(QA_EMBED_ALLOWLIST as readonly string[]).not.toContain(slug);
    }
  });
});
