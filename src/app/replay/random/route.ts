import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Find a random interesting benchmark run
  const count = await prisma.benchmarkRun.count({
    where: { success: true, relevanceScore: { gte: 3.0 } },
  });

  if (count === 0) {
    redirect('/benchmarks');
  }

  const skip = Math.floor(Math.random() * count);
  const run = await prisma.benchmarkRun.findFirst({
    where: { success: true, relevanceScore: { gte: 3.0 } },
    skip,
    select: { id: true },
  });

  if (!run) {
    redirect('/benchmarks');
  }

  redirect(`/replay/${run.id}`);
}
