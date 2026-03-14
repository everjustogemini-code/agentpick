import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const VALID_SKILLS = ['orchestrator', 'qa', 'pm', 'growth', 'finance'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Strip .md extension if present
  const name = slug.replace(/\.md$/, '');

  if (!VALID_SKILLS.includes(name)) {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: `Unknown skill "${name}". Available: ${VALID_SKILLS.join(', ')}` } },
      { status: 404 },
    );
  }

  try {
    const filePath = join(process.cwd(), 'public', 'skills', `${name}.md`);
    const content = await readFile(filePath, 'utf-8');

    return new Response(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: `Skill "${name}" not found.` } },
      { status: 404 },
    );
  }
}
