'use client';

import { useState } from 'react';

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy: ${text}`}
      className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-border-hover hover:text-text-primary"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
