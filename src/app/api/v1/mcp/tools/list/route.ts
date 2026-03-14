/**
 * GET /api/v1/mcp/tools/list — REST convenience route returning the MCP tools array.
 * Actual MCP server lives at /mcp (JSON-RPC 2.0) and at /api/v1/mcp (re-exported).
 */
import { SERVER_INFO } from '@/app/mcp/route';

export async function GET() {
  return Response.json(
    { tools: SERVER_INFO.tools },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    }
  );
}
