import { NextRequest } from 'next/server';

function jsonNotFound(request: NextRequest) {
  const { pathname } = new URL(request.url);
  return Response.json(
    { error: { code: 'NOT_FOUND', message: `No API endpoint at ${pathname}` } },
    { status: 404 },
  );
}

export async function GET(request: NextRequest) {
  return jsonNotFound(request);
}

export async function POST(request: NextRequest) {
  return jsonNotFound(request);
}

export async function PUT(request: NextRequest) {
  return jsonNotFound(request);
}

export async function DELETE(request: NextRequest) {
  return jsonNotFound(request);
}

export async function PATCH(request: NextRequest) {
  return jsonNotFound(request);
}
