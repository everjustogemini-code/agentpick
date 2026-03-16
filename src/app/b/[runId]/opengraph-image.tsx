import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://agentpick.dev'

  let data: {
    query?: string
    domain?: string
    tools?: { name?: string; latencyMs?: number; relevanceScore?: number; success?: boolean }[]
    winningTool?: string
  } = {}

  try {
    const res = await fetch(`${baseUrl}/api/v1/benchmarks/${runId}/public`)
    if (res.ok) {
      data = await res.json()
    }
  } catch {
    // fall through with empty data
  }

  const query = (data.query ?? 'Benchmark Result').slice(0, 120)
  const tools = data.tools ?? []
  const winningTool = data.winningTool ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1117',
          padding: '48px',
          fontFamily: 'sans-serif',
          color: '#e6edf3',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#2ea44f' }}>
            AgentPick
          </span>
          <span style={{ fontSize: '20px', marginLeft: '12px', color: '#8b949e' }}>
            Benchmark Results
          </span>
        </div>

        {/* Query */}
        <div
          style={{
            fontSize: '32px',
            fontWeight: 600,
            lineHeight: 1.4,
            marginBottom: '40px',
            color: '#e6edf3',
            flex: 1,
          }}
        >
          {query}
        </div>

        {/* Tools row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          {tools.map((tool, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: tool.name === winningTool ? '#0d2818' : '#161b22',
                border: `2px solid ${tool.name === winningTool ? '#2ea44f' : '#30363d'}`,
                borderRadius: '8px',
                padding: '16px 24px',
                minWidth: '200px',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: tool.name === winningTool ? '#2ea44f' : '#e6edf3',
                  marginBottom: '8px',
                }}
              >
                {tool.name ?? 'Unknown'}
              </span>
              <span style={{ fontSize: '14px', color: '#8b949e' }}>
                {tool.latencyMs ?? '—'}ms
              </span>
              {tool.relevanceScore != null && (
                <span style={{ fontSize: '14px', color: '#8b949e' }}>
                  relevance: {(tool.relevanceScore * 100).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ fontSize: '16px', color: '#8b949e' }}>
          agentpick.dev/b/{runId}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
