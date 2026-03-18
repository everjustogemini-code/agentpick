import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { search } = new URL(request.url);
  return NextResponse.redirect(
    new URL('/api/v1/router/usage' + search, request.url),
    { status: 301 }
  );
}
