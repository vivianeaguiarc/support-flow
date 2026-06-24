import { describe, expect, it } from 'vitest';

import { buildUniqueSlug, slugify } from './slugify.js';

describe('slugify', () => {
  it('should normalize title into kebab-case slug', () => {
    expect(slugify('Como Abrir um Chamado')).toBe('como-abrir-um-chamado');
    expect(slugify('  FAQ — Suporte  ')).toBe('faq-suporte');
  });

  it('should build unique slug when base already exists', () => {
    expect(buildUniqueSlug('faq', ['faq'])).toBe('faq-2');
    expect(buildUniqueSlug('faq', ['faq', 'faq-2'])).toBe('faq-3');
  });
});
