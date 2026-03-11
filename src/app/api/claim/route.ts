import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { slug, email, name, method } = await request.json();

  if (!slug || !email || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, isClaimed: true, websiteUrl: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (product.isClaimed) {
    return NextResponse.json({ error: 'Product already claimed' }, { status: 409 });
  }

  // For email method, validate domain matches
  if (method === 'email') {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const productDomain = new URL(product.websiteUrl).hostname.replace('www.', '').toLowerCase();
    if (emailDomain !== productDomain) {
      return NextResponse.json(
        { error: `Email domain must match product website (${productDomain})` },
        { status: 400 }
      );
    }
  }

  // Check for existing pending claim
  const existing = await prisma.productClaim.findUnique({
    where: { productId: product.id },
  });

  if (existing && existing.status === 'verified') {
    return NextResponse.json({ error: 'Product already claimed' }, { status: 409 });
  }

  const token = randomBytes(32).toString('hex');

  const claim = existing
    ? await prisma.productClaim.update({
        where: { productId: product.id },
        data: { claimerEmail: email, claimerName: name, verifyMethod: method, verifyToken: token, status: 'pending' },
      })
    : await prisma.productClaim.create({
        data: {
          productId: product.id,
          claimerEmail: email,
          claimerName: name,
          verifyMethod: method,
          verifyToken: token,
          status: 'pending',
        },
      });

  return NextResponse.json({ id: claim.id, token, method });
}
