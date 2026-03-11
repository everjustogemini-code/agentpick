import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const type = formData.get('type') as string;
  const id = formData.get('id') as string;

  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
  }

  if (type === 'weekly') {
    await prisma.weeklyReport.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
    });
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return NextResponse.redirect(new URL('/admin/content', request.url));
}
