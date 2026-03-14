'use client';

import { useState } from 'react';
import PlaygroundRequestBuilder from './PlaygroundRequestBuilder';
import PlaygroundResponsePanel from './PlaygroundResponsePanel';

type Endpoint = 'search' | 'crawl' | 'embed' | 'finance';
type Strategy = 'auto' | 'fastest' | 'cheapest' | 'best_quality';

export default function PlaygroundShell() {
  const [result, setResult] = useState<object | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [toolUsed, setToolUsed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mirror request state so ResponsePanel can build code snippets in real-time
  const [endpoint, setEndpoint] = useState<Endpoint>('search');
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('auto');
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [ownKey, setOwnKey] = useState('');

  function handleResultChange(
    r: object | null,
    l: number | null,
    t: string | null,
    e: string | null,
  ) {
    setResult(r);
    setLatency(l);
    setToolUsed(t);
    setError(e);
  }

  function handleStateChange(state: {
    endpoint: Endpoint;
    query: string;
    strategy: Strategy;
    useOwnKey: boolean;
    ownKey: string;
  }) {
    setEndpoint(state.endpoint);
    setQuery(state.query);
    setStrategy(state.strategy);
    setUseOwnKey(state.useOwnKey);
    setOwnKey(state.ownKey);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
      <PlaygroundRequestBuilder
        onResultChange={handleResultChange}
        onStateChange={handleStateChange}
      />
      <PlaygroundResponsePanel
        result={result}
        latency={latency}
        toolUsed={toolUsed}
        error={error}
        endpoint={endpoint}
        query={query}
        strategy={strategy}
        useOwnKey={useOwnKey}
        ownKey={ownKey}
      />
    </div>
  );
}
