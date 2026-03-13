import { NextRequest } from 'next/server';
import { handleSdkRouteRequest } from '@/lib/router/sdk-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleSdkRouteRequest(request, capability);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ capability: string }> },
) {
  const { capability } = await params;
  return handleSdkRouteRequest(request, capability);
}
