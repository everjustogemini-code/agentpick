import { prisma } from '@/lib/prisma';
import AdminClient from '@/components/AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [pending, approved, agents] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'PENDING' },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { status: 'APPROVED' },
      orderBy: { weightedScore: 'desc' },
      take: 20,
    }),
    prisma.agent.findMany({
      orderBy: { reputationScore: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border-default bg-bg-primary/80 py-3">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Admin Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <AdminClient pending={pending} approved={approved} agents={agents} />
      </main>
    </div>
  );
}
