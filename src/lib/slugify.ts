import { randomBytes } from 'crypto';
import { prisma } from './prisma';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function uniqueSlug(name: string): Promise<string> {
  const base = generateSlug(name);
  const existing = await prisma.product.findUnique({ where: { slug: base } });
  if (!existing) return base;
  return `${base}-${randomBytes(2).toString('hex')}`;
}
