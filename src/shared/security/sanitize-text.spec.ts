import { describe, expect, it } from 'vitest';

import { sanitizeText } from './sanitize-text.js';

describe('sanitizeText', () => {
  it('removes HTML tags', () => {
    expect(sanitizeText('<script>alert(1)</script>hello')).toBe(
      'alert(1)hello',
    );
  });

  it('removes javascript protocol fragments', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes inline event handlers', () => {
    expect(sanitizeText('onclick=evil()')).toBe('evil()');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  safe text  ')).toBe('safe text');
  });
});
