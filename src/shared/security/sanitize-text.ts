const HTML_TAG_PATTERN = /<[^>]*>/g;
const DANGEROUS_URI_PATTERN = /javascript:/gi;
const INLINE_EVENT_HANDLER_PATTERN = /\bon\w+\s*=/gi;

export function sanitizeText(value: string): string {
  return value
    .replace(HTML_TAG_PATTERN, '')
    .replace(DANGEROUS_URI_PATTERN, '')
    .replace(INLINE_EVENT_HANDLER_PATTERN, '')
    .split('\u0000')
    .join('')
    .trim();
}
