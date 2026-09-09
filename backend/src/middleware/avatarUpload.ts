import fs from 'node:fs';
import path from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/errorHandler';

//Maximum size accepted
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

//max number of pixwls Sharp is allowed to process
const MAX_AVATAR_PIXELS = 20_000_000;

//Dimension of the avatar after beighn stored
const AVATAR_SIZE = 256;

//Directory for the avatars
const directory = path.resolve(process.cwd(), 'upload', 'avatars');

//Create folder if not exist
fs.mkdirSync(directory, { recursive: true });

/**
 * multer configuration for avatars upload
 */
const upload = multer({
  //keeping file in memory temp before saving it to disk
  storage: multer.memoryStorage(),

  //accepting only avatar with max 2MB
  limits: { files: 1, fileSize: MAX_AVATAR_BYTES, fields: 0 },

  //declaring the supported formats of the avatar
  fileFilter: (_req, file, done) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
        file.mimetype,
      )
    ) {
      return done(
        new AppError(415, 'Profile photo must be JPEG, PNG, WebP, or AVIF'),
      );
    }
    done(null, true);
  },
}).single('avatar');

//Uploading the avatar to its designated folder
export const avatarUpload: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === 'LIMIT_FILE_SIZE'
    ) {
      return next(new AppError(413, 'Profile photo must not exceed 2 MB'));
    }
    next(error);
  });
};

/**
 * Process and store an avatar.
 * 1. Validated by Sharp.
 * 2. Automatically rotated according to its EXIF orientation.
 * 3. Resized/cropped to 256x256.
 * 4. Converted to WebP.
 * 5. Saved using the user's ID as the filename.
 */

export async function storeAvatar(userId: number, file: Express.Multer.File) {
  let output: Buffer;
  try {
    //process the image in memory while limiting the input pixels
    output = await sharp(file.buffer, { limitInputPixels: MAX_AVATAR_PIXELS })
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'attention' })
      .webp({ quality: 78, effort: 5 })
      .toBuffer();
  } catch {
    throw new AppError(415, 'Invalid or unsupported profile photo');
  }
  try {
    // Use the user ID as the filename.
    const filename = `${userId}.webp`;
    const target = path.join(directory, filename);
    const temporary = path.join(
      directory,
      `${userId}.tmp-${process.pid}-${Date.now()}`,
    );
    await fs.promises.writeFile(temporary, output, { flag: 'wx' });

    // Remove the previous avatar before replacing it.
    await fs.promises.rm(target, { force: true });

    //rename the temp file to its final name
    //if it fails, cleanup the temp file
    await fs.promises.rename(temporary, target).catch(async (error) => {
      await fs.promises.rm(temporary, { force: true });
      throw error;
    });

    /**
     * Add a timestamp query parameter so browsers do not keep displaying
     * an older cached version of the avatar after it is replaced.
     */

    return `/uploads/avatars/${filename}?v=${Date.now()}`;
  } catch (error) {
    throw error;
  }
}
