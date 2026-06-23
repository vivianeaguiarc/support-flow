import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileStorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'storage', 'attachments');
  }

  async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async save(
    file: Express.Multer.File,
    tenantId: string,
    ticketId: string,
  ): Promise<{ fileName: string; storagePath: string }> {
    await this.ensureUploadDirExists();

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname);
    const fileName = `${tenantId}_${ticketId}_${timestamp}_${randomStr}${ext}`;
    const storagePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(storagePath, file.buffer);

    return {
      fileName,
      storagePath: path.relative(process.cwd(), storagePath),
    };
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), storagePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error(`Failed to delete file at ${fullPath}:`, error);
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = path.join(process.cwd(), storagePath);

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getFullPath(storagePath: string): string {
    return path.join(process.cwd(), storagePath);
  }
}

export const fileStorageService = new FileStorageService();
