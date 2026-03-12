import { NextRequest } from 'next/server';
import { handleRouteRequest } from '@/lib/router/handler';

export async function POST(request: NextRequest) {
  return handleRouteRequest(request, 'embed');
}

export async function GET(request: NextRequest) {
  return handleRouteRequest(request, 'embed');
}
