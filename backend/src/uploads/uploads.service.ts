import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const FILE_SIGNATURES: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
  'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
};

@Injectable()
export class UploadsService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');
  private readonly avatarsPath = path.join(this.uploadPath, 'avatars');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.uploadPath, { recursive: true });
    await fs.mkdir(this.avatarsPath, { recursive: true });
  }

  private validateFileSignature(file: UploadedFile): void {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`Invalid file extension: ${ext}`);
    }

    const signature = FILE_SIGNATURES[file.mimetype];
    if (signature && file.buffer.length >= signature.length) {
      const fileStart = file.buffer.subarray(0, signature.length);
      if (!fileStart.equals(signature)) {
        throw new BadRequestException('File signature does not match MIME type');
      }
    }
  }

  async processAndSaveAvatar(
    file: UploadedFile,
    userId: string,
  ): Promise<string> {
    this.validateFileSignature(file);

    const filename = `${userId}-${Date.now()}.webp`;
    const filepath = path.join(this.avatarsPath, filename);

    try {
      await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toFile(filepath);
    } catch (error) {
      throw new BadRequestException('Failed to process image. Invalid or corrupted file.');
    }

    return `/uploads/avatars/${filename}`;
  }

  async deleteAvatar(avatarPath: string): Promise<void> {
    if (avatarPath && avatarPath.startsWith('/uploads/avatars/')) {
      const filename = path.basename(avatarPath);
      const filepath = path.join(this.avatarsPath, filename);
      try {
        await fs.unlink(filepath);
      } catch {
        // File may not exist
      }
    }
  }
}