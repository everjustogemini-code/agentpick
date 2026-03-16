import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const upstream = await fetch(
    new URL('/api/v1/router/register', req.nextUrl.origin).toString(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const data = await upstream.json()

  return NextResponse.json(data, {
    status: upstream.status,
    headers: { Deprecation: 'true' },
  })
}
