import path from 'node:path';

import type { Request } from 'express';
import multer from 'multer';

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../../../modules/tickets/domain/ticket-attachment.js';
import { AppError } from '../../errors/app-error.js';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedExt = ALLOWED_EXTENSIONS.includes(
    ext as (typeof ALLOWED_EXTENSIONS)[number],
  );
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(
    file.mimetype as (typeof ALLOWED_MIME_TYPES)[number],
  );

  if (!isAllowedExt || !isAllowedMime) {
    return cb(
      new AppError(
        `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        400,
      ),
    );
  }

  const dangerousPatterns = /\.(exe|bat|cmd|sh|ps1|vbs|scr|com|pif|jar|app)$/i;
  if (dangerousPatterns.test(file.originalname)) {
    return cb(new AppError('Executable files are not allowed', 400));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

export const handleMulterError = (error: unknown) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new AppError(
        `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
        400,
      );
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      throw new AppError('Too many files. Maximum: 1 file per upload', 400);
    }

    throw new AppError(`Upload error: ${error.message}`, 400);
  }

  throw error;
};
