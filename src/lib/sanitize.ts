/**
 * Shared HTML sanitization utilities.
 * Used across the codebase to prevent XSS from user input,
 * upstream API responses, database content, and vote comments.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_RE = /[&<>"'/]/g;

/**
 * Escape HTML special characters in a string.
 * Safe for embedding in HTML text content, attribute values, and JSON-LD.
 * Does NOT break legitimate text — only escapes the 6 HTML-significant chars.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(HTML_ESCAPE_RE, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Sanitize a string for safe embedding in JSON-LD script blocks.
 * Prevents </script> injection and removes dangerous patterns.
 * JSON.stringify already handles quotes, but we need to catch </script> close tags.
 */
export function sanitizeForJsonLd(obj: unknown): string {
  const json = JSON.stringify(obj);
  // Prevent closing </script> tags from breaking out of the script block
  return json.replace(/<\//g, '<\\/');
}

/**
 * Strip HTML tags from a string, returning only text content.
 * Used when displaying upstream API responses that might contain HTML.
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags and content
    .replace(/<style[\s\S]*?<\/style>/gi, '')   // Remove style tags and content
    .replace(/<[^>]*>/g, '');                    // Remove all remaining HTML tags
}

/**
 * Sanitize user/DB content for safe rendering in dangerouslySetInnerHTML contexts.
 * This escapes all HTML entities, making the content purely textual.
 * For markdown rendering, use the dedicated markdown-to-safe-HTML pipeline instead.
 */
export function sanitizeForHtml(str: string): string {
  return escapeHtml(str);
}
