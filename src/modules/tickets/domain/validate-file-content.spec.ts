import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import {
  samplePdfBuffer,
  samplePngBuffer,
  sampleTxtBuffer,
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

  it('accepts plain text content', () => {
    expect(() =>
      assertAllowedFileContent(sampleTxtBuffer, 'text/plain'),
    ).not.toThrow();
  });

  it('rejects content that does not match declared MIME type', () => {
    expect(() =>
      assertAllowedFileContent(sampleTxtBuffer, 'application/pdf'),
    ).toThrow(new AppError('File content does not match declared type', 400));
  });
});
