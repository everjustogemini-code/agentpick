import type { Metadata } from 'next'
import PlaygroundShell from '@/components/PlaygroundShell'

export const metadata: Metadata = {
  title: 'API Playground — AgentPick',
  description: 'Try the AgentPick router live in your browser. No signup required.',
}

export default function PlaygroundPage() {
  return (
    <main className="bg-gray-950 min-h-screen pt-6 pb-20">
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <p className="uppercase tracking-widest text-xs text-cyan-400 mb-2">Interactive Demo</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">API Playground</h1>
        <p className="mt-2 text-gray-400 text-sm max-w-lg">
          Run live routing queries against the AgentPick API. No signup needed — demo key included.
        </p>
      </div>
      <PlaygroundShell />
    </main>
  )
}
