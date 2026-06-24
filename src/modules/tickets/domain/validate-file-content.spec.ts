import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import {
  samplePdfBuffer,
  samplePngBuffer,
} from '../../../test/integration/file-fixtures.js';
import { assertAllowedFileContent } from './validate-file-content.js';

describe('assertAllowedFileContent', () => {
  it('accepts valid PDF content', () => {
    expect(() =>
      assertAllowedFileContent(samplePdfBuffer, 'application/pdf'),
    ).not.toThrow();
  });

  it('accepts valid PNG content', () => {
    expect(() =>
      assertAllowedFileContent(samplePngBuffer, 'image/png'),
    ).not.toThrow();
  });

  it('rejects disallowed mime types', () => {
    expect(() =>
      assertAllowedFileContent(Buffer.from('plain text'), 'text/plain'),
    ).toThrow(new AppError('File type not allowed', 400));
  });

  it('rejects content that does not match declared MIME type', () => {
    expect(() =>
      assertAllowedFileContent(Buffer.from('plain text'), 'application/pdf'),
    ).toThrow(new AppError('File content does not match declared type', 400));
  });
});
