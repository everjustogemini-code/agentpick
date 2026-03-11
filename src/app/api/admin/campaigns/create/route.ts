import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const batchSize = parseInt(formData.get('batchSize') as string) || 10;

  if (!name || !type) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  await prisma.campaign.create({
    data: {
      name,
      type,
      batchSize,
      config: {} as Prisma.InputJsonValue,
      status: 'draft',
    },
  });

  return NextResponse.redirect(new URL('/admin/campaigns', request.url));
}
