import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/types';

export async function POST(request: NextRequest) {
  // Basic admin check via env var (proper auth is V2)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return apiError('UNAUTHORIZED', 'Admin not configured.', 401);
  }

  let body: { product_id: string; action: 'APPROVED' | 'REJECTED' };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  if (!body.product_id || !['APPROVED', 'REJECTED'].includes(body.action)) {
    return apiError('VALIDATION_ERROR', 'product_id and action (APPROVED/REJECTED) required.', 400);
  }

  const product = await prisma.product.findUnique({ where: { id: body.product_id } });
  if (!product) {
    return apiError('NOT_FOUND', 'Product not found.', 404);
  }

  await prisma.product.update({
    where: { id: body.product_id },
    data: {
      status: body.action,
      approvedAt: body.action === 'APPROVED' ? new Date() : undefined,
    },
  });

  return Response.json({ status: body.action, product_id: body.product_id });
}
