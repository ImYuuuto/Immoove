import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/errorHandler';

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_PIXELS = 20_000_000;
const AVATAR_SIZE = 256;
const directory = path.resolve(process.cwd(), 'upload', 'avatars');
fs.mkdirSync(directory, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: MAX_AVATAR_BYTES, fields: 0 },
  fileFilter: (_req, file, done) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype))
      return done(new AppError(415, 'Profile photo must be JPEG, PNG, WebP, or AVIF'));
    done(null, true);
  },
}).single('avatar');

export const avatarUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE')
      return next(new AppError(413, 'Profile photo must not exceed 2 MB'));
    next(error);
  });
};

export async function storeAvatar(userId: number, file: Express.Multer.File) {
  let output: Buffer;
  try {
    output = await sharp(file.buffer, { limitInputPixels: MAX_AVATAR_PIXELS })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'attention' })
      .webp({ quality: 78, effort: 5 })
      .toBuffer();
  } catch {
    throw new AppError(415, 'Invalid or unsupported profile photo');
  }
  try {
    const filename = `${userId}.webp`;
    const target = path.join(directory, filename);
    const temporary = path.join(directory, `${userId}.tmp-${process.pid}-${Date.now()}`);
    await fs.promises.writeFile(temporary, output, { flag: 'wx' });
    await fs.promises.rm(target, { force: true });
    await fs.promises.rename(temporary, target).catch(async (error) => {
      await fs.promises.rm(temporary, { force: true });
      throw error;
    });
    return `/uploads/avatars/${filename}?v=${Date.now()}`;
  } catch (error) {
    throw error;
  }
}
