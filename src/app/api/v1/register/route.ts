import { NextRequest } from 'next/server'

function redirect308(req: NextRequest) {
  return Response.redirect(new URL('/api/v1/router/register', req.url), 308)
}

export const GET    = redirect308
export const POST   = redirect308
export const PUT    = redirect308
export const PATCH  = redirect308
export const DELETE = redirect308
