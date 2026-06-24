import { AppError } from '../../../shared/errors/app-error.js';
import type { AllowedMimeType } from './ticket-attachment.js';
import { ALLOWED_MIME_TYPES } from './ticket-attachment.js';

const MIME_SIGNATURE_CHECKS: Record<
  AllowedMimeType,
  (buffer: Buffer) => boolean
> = {
  'application/pdf': (buffer) =>
    buffer.subarray(0, 4).toString('ascii') === '%PDF',
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47,
  'image/jpeg': (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
};

export function assertAllowedFileContent(
  buffer: Buffer,
  mimeType: string,
): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new AppError('File type not allowed', 400);
  }

  const isValid = MIME_SIGNATURE_CHECKS[mimeType as AllowedMimeType](buffer);

  if (!isValid) {
    throw new AppError('File content does not match declared type', 400);
  }
}
