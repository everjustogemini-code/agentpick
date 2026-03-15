'use client';

import { useState } from 'react';

export default function CopyButton({ text, dark }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-1 rounded px-1.5 py-0.5 text-[11px] transition-colors ${
        dark
          ? 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
          : 'text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary'
      }`}
      title={`Copy: ${text}`}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}
