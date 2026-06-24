import { describe, expect, it } from 'vitest';

import { escapeCsvValue, formatCsvRow } from './csv-formatter.js';

describe('csv-formatter', () => {
  it('should escape values with commas and quotes', () => {
    expect(escapeCsvValue('hello, world')).toBe('"hello, world"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
  });

  it('should format csv rows', () => {
    expect(formatCsvRow(['TK-001', 'Title', null, 10])).toBe(
      'TK-001,Title,,10',
    );
  });
});
