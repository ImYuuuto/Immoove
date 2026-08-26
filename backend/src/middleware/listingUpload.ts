import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { AppError } from '../utils/errorHandler';

export const MAX_LISTING_IMAGES = 8;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
const directory = path.resolve(process.cwd(), 'upload', 'listings', 'requests');
fs.mkdirSync(directory, { recursive: true });

export const listingImagesUpload = multer({
  storage: multer.diskStorage({
    destination: directory,
    filename: (_req, file, done) => {
      const extension: Record<string, string> = {
        'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
      };
      done(null, `${crypto.randomUUID()}${extension[file.mimetype] || ''}`);
    },
  }),
  limits: { files: MAX_LISTING_IMAGES, fileSize: MAX_LISTING_IMAGE_BYTES, fields: 20, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
      return done(new AppError(415, 'Images must be JPEG, PNG, or WebP'));
    done(null, true);
  },
}).array('images', MAX_LISTING_IMAGES);

export function uploadUrl(file: Express.Multer.File) {
  return `/uploads/listings/requests/${file.filename}`;
}

export async function deleteUploadUrls(urls: string[]) {
  await Promise.all(urls.map(async (url) => {
    if (!url.startsWith('/uploads/listings/requests/')) return;
    const target = path.resolve(process.cwd(), 'upload', url.slice('/uploads/'.length));
    if (!target.startsWith(directory + path.sep)) return;
    await fs.promises.unlink(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }));
}
