import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/errorHandler';

export const MAX_LISTING_IMAGES = 15;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const uploadWidths = [320, 640, 960, 1440];
const directory = path.resolve(process.cwd(), 'upload', 'listings', 'requests');
fs.mkdirSync(directory, { recursive: true });

export const listingImagesUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: MAX_LISTING_IMAGES, fileSize: MAX_LISTING_IMAGE_BYTES, fields: 20, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype))
      return done(new AppError(415, 'Images must be JPEG, PNG, WebP, or AVIF'));
    done(null, true);
  },
}).array('images', MAX_LISTING_IMAGES);

export async function processListingUploads(files: Express.Multer.File[]) {
  const created: string[] = [];
  try {
    const urls: string[] = [];
    for (const file of files) {
      const image = sharp(file.buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate();
      const metadata = await image.metadata();
      if (!metadata.width || !metadata.height) throw new AppError(415, 'Invalid image file');
      const id = crypto.randomUUID();
      const targets = [...new Set([...uploadWidths.filter((width) => width < metadata.width!), Math.min(metadata.width, uploadWidths.at(-1)!)])];
      await Promise.all(targets.flatMap((width) => {
        const variants = [
          { extension: 'avif', encoder: sharp(file.buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().resize({ width, withoutEnlargement: true }).avif({ quality: 52, effort: 5 }) },
          { extension: 'webp', encoder: sharp(file.buffer, { limitInputPixels: MAX_IMAGE_PIXELS }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 76, effort: 5 }) },
        ];
        return variants.map(({ extension, encoder }) => {
          const name = `${id}-${width}.${extension}`;
          created.push(name);
          return encoder.toFile(path.join(directory, name));
        });
      }));
      urls.push(`/uploads/listings/requests/${id}-${targets.at(-1)}.webp`);
    }
    return urls;
  } catch (error) {
    await Promise.all(created.map((name) => fs.promises.unlink(path.join(directory, name)).catch(() => undefined)));
    throw error;
  }
}

export async function deleteUploadUrls(urls: string[]) {
  await Promise.all(urls.map(async (url) => {
    if (!url.startsWith('/uploads/listings/requests/')) return;
    const filename = path.basename(url);
    const id = filename.match(/^([0-9a-f-]+)-\d+\.(?:avif|webp)$/i)?.[1];
    if (!id) return;
    const names = await fs.promises.readdir(directory);
    await Promise.all(names.filter((name) => name.startsWith(`${id}-`)).map((name) =>
      fs.promises.unlink(path.join(directory, name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      }),
    ));
  }));
}
