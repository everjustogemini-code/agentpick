export default function HeroCodeBlock() {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg bg-bg-code p-5 font-mono text-[13px] leading-relaxed md:p-6">
      {/* Line 1 */}
      <div>
        <span className="text-blue-400">from</span>{' '}
        <span className="text-white">agentpick</span>{' '}
        <span className="text-blue-400">import</span>{' '}
        <span className="text-white">AgentPick</span>
      </div>

      {/* Line 2 — blank */}
      <div className="h-5" />

      {/* Line 3 */}
      <div>
        <span className="text-white">ap</span>{' '}
        <span className="text-gray-400">=</span>{' '}
        <span className="text-white">AgentPick</span>
        <span className="text-gray-400">(</span>
        <span className="text-orange-300">api_key</span>
        <span className="text-gray-400">=</span>
        <span className="text-green-400">&quot;YOUR_KEY&quot;</span>
        <span className="text-gray-400">,</span>{' '}
        <span className="text-orange-300">strategy</span>
        <span className="text-gray-400">=</span>
        <span className="text-green-400">&quot;auto&quot;</span>
        <span className="text-gray-400">)</span>
      </div>

      {/* Line 4 — blank */}
      <div className="h-5" />

      {/* Line 5 — comment */}
      <div className="text-gray-500"># AI picks the best tool for each query</div>

      {/* Line 6 */}
      <div>
        <span className="text-white">result</span>{' '}
        <span className="text-gray-400">=</span>{' '}
        <span className="text-white">ap</span>
        <span className="text-gray-400">.</span>
        <span className="text-blue-300">search</span>
        <span className="text-gray-400">(</span>
        <span className="text-green-400">&quot;NVIDIA Q4 earnings analysis&quot;</span>
        <span className="text-gray-400">)</span>
      </div>

      {/* Line 7 — comment */}
      <div className="text-gray-500">
        {'# '}&#8594; routed to Exa (deep research, 4.6/5 relevance)
      </div>

      {/* Line 8 — blank */}
      <div className="h-5" />

      {/* Line 9 */}
      <div>
        <span className="text-white">result</span>{' '}
        <span className="text-gray-400">=</span>{' '}
        <span className="text-white">ap</span>
        <span className="text-gray-400">.</span>
        <span className="text-blue-300">search</span>
        <span className="text-gray-400">(</span>
        <span className="text-green-400">&quot;AAPL stock price now&quot;</span>
        <span className="text-gray-400">)</span>
      </div>

      {/* Line 10 — comment */}
      <div className="text-gray-500">
        {'# '}&#8594; routed to Serper (realtime, 89ms)
      </div>

      {/* Line 11 — blank */}
      <div className="h-5" />

      {/* Line 12 — comment */}
      <div className="text-gray-500">
        # Exa goes down? Auto-fallback to Tavily. Zero code change.
      </div>
    </div>
  );
}
