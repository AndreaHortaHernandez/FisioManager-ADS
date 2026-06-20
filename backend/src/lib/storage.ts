import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const DRIVER = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (s3) return s3;
  s3 = new S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    },
  });
  return s3;
}

function publicUrl(key: string): string {
  const bucket = process.env.S3_BUCKET ?? '';
  const base = process.env.S3_PUBLIC_URL ?? `${process.env.S3_ENDPOINT ?? ''}/${bucket}`;
  return `${base.replace(/\/$/, '')}/${key}`;
}

export const storage = {
  driver: DRIVER,

  async save(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    if (DRIVER === 's3') {
      await getS3().send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
      }));
      return publicUrl(filename);
    }
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOADS_DIR, filename), buffer);
    return `/uploads/${filename}`;
  },

  async remove(fileUrl: string): Promise<void> {
    try {
      if (DRIVER === 's3') {
        const key = fileUrl.split('/').pop();
        if (key) await getS3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
      } else {
        const name = fileUrl.replace(/^\/uploads\//, '');
        await fs.promises.unlink(path.join(UPLOADS_DIR, name)).catch(() => {});
      }
    } catch (err) {
      logger.warn('storage_remove_failed', { fileUrl, error: (err as Error).message });
    }
  },
};
