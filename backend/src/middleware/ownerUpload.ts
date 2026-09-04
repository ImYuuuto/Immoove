import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/errorHandler';

const PHOTO_LIMIT = 2 * 1024 * 1024;
const CONTRACT_LIMIT = 5 * 1024 * 1024;
const directory = path.resolve(process.cwd(), 'upload', 'owners');
fs.mkdirSync(directory, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 17, fileSize: CONTRACT_LIMIT, fields: 30, fieldSize: 64 * 1024 },
  fileFilter: (_req, file, done) => {
    const isPhoto = file.fieldname === 'ownerPhoto' || file.fieldname === 'listingPhotos';
    const allowed = isPhoto ? ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] : ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) return done(new AppError(415, isPhoto ? 'Photos must be JPEG, PNG, WebP, or AVIF' : 'Contract must be a PDF, JPEG, PNG, or WebP'));
    done(null, true);
  },
}).fields([{ name: 'ownerPhoto', maxCount: 1 }, { name: 'contractDocument', maxCount: 1 }, { name: 'listingPhotos', maxCount: 15 }]);

export const ownerDocumentsUpload: RequestHandler = (req, res, next) => upload(req, res, (error) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return next(new AppError(413, 'Uploaded files must not exceed 5 MB'));
  next(error);
});

export async function storeOwnerFiles(files: { ownerPhoto?: Express.Multer.File; contractDocument?: Express.Multer.File }) {
  const id = crypto.randomUUID();
  let photoUrl: string | null = null;
  let contractUrl: string | null = null;
  if (files.ownerPhoto) {
    if (files.ownerPhoto.size > PHOTO_LIMIT) throw new AppError(413, 'Owner photo must not exceed 2 MB');
    try {
      await sharp(files.ownerPhoto.buffer, { limitInputPixels: 20_000_000 }).rotate().resize(512, 512, { fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(directory, `${id}-owner.webp`));
      photoUrl = `/uploads/owners/${id}-owner.webp`;
    } catch { throw new AppError(415, 'Invalid owner photo'); }
  }
  if (files.contractDocument) {
    const file = files.contractDocument;
    const isPdf = file.mimetype === 'application/pdf';
    if (isPdf && file.buffer.subarray(0, 5).toString() !== '%PDF-') throw new AppError(415, 'Invalid contract PDF');
    const extension = isPdf ? 'pdf' : file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    await fs.promises.writeFile(path.join(directory, `${id}-contract.${extension}`), file.buffer, { flag: 'wx' });
    contractUrl = `/uploads/owners/${id}-contract.${extension}`;
  }
  return { photoUrl, contractUrl };
}
