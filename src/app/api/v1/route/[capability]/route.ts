import { NextRequest } from 'next/server';
import { handleRouteRequest } from '@/lib/router/handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleRouteRequest(request, capability);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleRouteRequest(request, capability);
}
