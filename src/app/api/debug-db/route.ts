import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    directUrlPrefix: process.env.DIRECT_URL?.substring(0, 40),
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 40),
  };

  try {
    const count = await prisma.product.count();
    return NextResponse.json({ ok: true, count, env });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      name: error.constructor?.name,
      env,
    }, { status: 500 });
  }
}
