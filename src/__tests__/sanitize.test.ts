import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeForJsonLd, stripHtml } from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes <script> tags', () => {
    const input = '<script>alert("xss")</script>';
    const result = escapeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes onerror attributes', () => {
    const input = '<img src=x onerror=alert(1)>';
    const result = escapeHtml(input);
    expect(result).not.toContain('<img');
    expect(result).toContain('&lt;img');
  });

  it('escapes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = escapeHtml(input);
    expect(result).not.toContain('<a');
    expect(result).toContain('&lt;a');
  });

  it('escapes nested script injection', () => {
    const input = '"><script>document.cookie</script><"';
    const result = escapeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('preserves safe text', () => {
    const input = 'Hello, this is a normal tool name like exa-search';
    expect(escapeHtml(input)).toBe(input);
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles non-string input', () => {
    expect(escapeHtml(null as unknown as string)).toBe('');
    expect(escapeHtml(undefined as unknown as string)).toBe('');
  });

  it('escapes all 6 HTML-significant characters', () => {
    const input = '& < > " \' /';
    const result = escapeHtml(input);
    expect(result).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
  });
});

describe('sanitizeForJsonLd', () => {
  it('prevents </script> injection in JSON-LD', () => {
    const obj = { name: '</script><script>alert(1)</script>' };
    const result = sanitizeForJsonLd(obj);
    expect(result).not.toContain('</script>');
    expect(result).toContain('<\\/script>');
  });

  it('preserves normal JSON content', () => {
    const obj = { name: 'Tavily Search', score: 4.5 };
    const result = sanitizeForJsonLd(obj);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('Tavily Search');
    expect(parsed.score).toBe(4.5);
  });
});

describe('stripHtml', () => {
  it('removes script tags and content', () => {
    const input = 'Hello<script>alert(1)</script>World';
    expect(stripHtml(input)).toBe('HelloWorld');
  });

  it('removes style tags and content', () => {
    const input = 'Hello<style>body{display:none}</style>World';
    expect(stripHtml(input)).toBe('HelloWorld');
  });

  it('removes regular HTML tags', () => {
    const input = '<b>bold</b> and <i>italic</i>';
    expect(stripHtml(input)).toBe('bold and italic');
  });
});
