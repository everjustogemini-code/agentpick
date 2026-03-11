import { prisma } from '@/lib/prisma';
import { getTemplate } from '@/lib/outreach-templates';
import { NextResponse } from 'next/server';

export async function POST() {
  // Get top unclaimed products without outreach contacts
  const products = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      isClaimed: false,
      outreachContacts: { none: {} },
    },
    orderBy: { weightedScore: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      slug: true,
      websiteUrl: true,
      category: true,
      totalVotes: true,
      weightedScore: true,
    },
  });

  if (products.length === 0) {
    return NextResponse.redirect(new URL('/admin/outreach', 'http://localhost:3000'));
  }

  const template = getTemplate('initial-outreach');
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 500 });
  }

  // Get ranks
  const allApproved = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    orderBy: { weightedScore: 'desc' },
    select: { id: true, category: true },
  });

  const categoryRanks = new Map<string, number>();
  const catCounters = new Map<string, number>();
  for (const p of allApproved) {
    const counter = (catCounters.get(p.category) ?? 0) + 1;
    catCounters.set(p.category, counter);
    categoryRanks.set(p.id, counter);
  }

  // Create draft contacts
  const created: string[] = [];
  for (const p of products) {
    const domain = new URL(p.websiteUrl).hostname.replace('www.', '');
    const vars = {
      contactName: 'Team',
      productName: p.name,
      productSlug: p.slug,
      rank: categoryRanks.get(p.id),
      totalVotes: p.totalVotes,
      category: p.category.replace(/_/g, ' '),
    };

    await prisma.outreachContact.create({
      data: {
        productId: p.id,
        name: 'Team',
        email: `hello@${domain}`,
        company: domain,
        templateUsed: template.id,
        emailSubject: template.subject(vars),
        emailBody: template.body(vars),
        status: 'DRAFT',
      },
    });
    created.push(p.name);
  }

  return NextResponse.redirect(new URL('/admin/outreach', 'http://localhost:3000'));
}
