import { prisma, withRetry } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { claimId } = await request.json();

  if (!claimId) {
    return NextResponse.json({ error: 'Missing claimId' }, { status: 400 });
  }

  const claim = await withRetry(() => prisma.productClaim.findUnique({
    where: { id: claimId },
    include: { product: { select: { websiteUrl: true, slug: true } } },
  }));

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  }

  if (claim.status === 'verified') {
    return NextResponse.json({ status: 'already_verified' });
  }

  let verified = false;

  if (claim.verifyMethod === 'email') {
    // Email domain was already validated on submission
    const emailDomain = claim.claimerEmail.split('@')[1]?.toLowerCase();
    const productDomain = new URL(claim.product.websiteUrl).hostname.replace('www.', '').toLowerCase();
    verified = emailDomain === productDomain;
  } else if (claim.verifyMethod === 'dns') {
    // Check DNS TXT records
    try {
      const domain = new URL(claim.product.websiteUrl).hostname.replace('www.', '');
      const res = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const data = await res.json();
      const records = data.Answer?.map((a: { data: string }) => a.data?.replace(/"/g, '')) ?? [];
      verified = records.some((r: string) => r === `agentpick-verify=${claim.verifyToken}`);
    } catch {
      verified = false;
    }
  } else if (claim.verifyMethod === 'file') {
    // Check well-known file
    try {
      const url = `${claim.product.websiteUrl.replace(/\/$/, '')}/.well-known/agentpick-verify.txt`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const text = await res.text();
      verified = text.trim() === claim.verifyToken;
    } catch {
      verified = false;
    }
  }

  if (!verified) {
    return NextResponse.json({ error: 'Verification failed. Please check your setup and try again.' }, { status: 400 });
  }

  await withRetry(() => prisma.$transaction([
    prisma.productClaim.update({
      where: { id: claimId },
      data: { status: 'verified', verifiedAt: new Date() },
    }),
    prisma.product.update({
      where: { id: claim.productId },
      data: { isClaimed: true },
    }),
  ]));

  return NextResponse.json({ status: 'verified', slug: claim.product.slug });
}
