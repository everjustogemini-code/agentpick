import { randomBytes } from 'crypto';
import { prisma, withRetry } from './prisma';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function uniqueSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  // withRetry: product.findUnique can fail with P1017/fetch-failed on cold starts
  // or after long prior DB operations. Without withRetry the singleton is NOT cleared
  // on failure, leaving it stale for subsequent DB calls in the same request (e.g.
  // product.create in the submit/suggest routes).
  const existing = await withRetry(() => prisma.product.findUnique({ where: { slug: base } }));
  if (!existing) return base;
  return `${base}-${randomBytes(2).toString('hex')}`;
}
