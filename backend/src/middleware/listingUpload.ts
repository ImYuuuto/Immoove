import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import sharp from 'sharp';
import { AppError } from '../utils/errorHandler';

//Max number of images that can be uploaded for a single listing.
export const MAX_LISTING_IMAGES = 15;

//Max size allowed for each Image.
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

//Max number of pixels Sharp is allowed to process.
const MAX_IMAGE_PIXELS = 40_000_000;

//Generated width for responsive design
const uploadWidths = [320, 640, 960, 1440];

//Directory Where th uploaded request are temporarily stored.
const directory = path.resolve(process.cwd(), 'upload', 'listings', 'requests');
fs.mkdirSync(directory, { recursive: true });

/**
 * Multer middleware responsible for receiving listing images.
 *
 * Images are temporarily kept in memory because Sharp will process
 * the buffers before they are written to disk.
 */
export const listingImagesUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_LISTING_IMAGES,
    fileSize: MAX_LISTING_IMAGE_BYTES,
    fields: 20,
    fieldSize: 64 * 1024,
  },
  //The allowed image types
  fileFilter: (_req, file, done) => {
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(
        file.mimetype,
      )
    ) {
      return done(new AppError(415, 'Images must be JPEG, PNG, WebP, or AVIF'));
    }
    done(null, true);
  },
}).array('images', MAX_LISTING_IMAGES);

/**
 * Process uploaded listing images and generate responsive variants.
 *
 * For each uploaded image, AVIF and WebP versions are generated
 * at several widths.
 *
 * Returns the URL of the largest WebP variant for each image.
 */
export async function processListingUploads(files: Express.Multer.File[]) {
  // Keep track of files successfully created during processing.
  //
  // If image fails,files can be deleted so that
  // partially processed uploads do not remain on the server.
  const created: string[] = [];

  try {
    const urls: string[] = [];

    //process each img one by one
    for (const file of files) {
      const image = sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
      }).rotate();

      const metadata = await image.metadata();
      // An image without valid dimensions cannot be processed safely.
      if (!metadata.width || !metadata.height) {
        throw new AppError(415, 'Invalid image file');
      }
      //generate a random ID
      const id = crypto.randomUUID();

      //to determine which responsive width should be generated
      const targets = [
        ...new Set([
          ...uploadWidths.filter((width) => width < metadata.width!),
          Math.min(metadata.width, uploadWidths.at(-1)!),
        ]),
      ];
      
      //Generate avif and WebP.
      await Promise.all(
        targets.flatMap((width) => {
          const variants = [
            {
              extension: 'avif',
              encoder: sharp(file.buffer, {
                limitInputPixels: MAX_IMAGE_PIXELS,
              })
                .rotate()
                .resize({ width, withoutEnlargement: true })
                .avif({ quality: 52, effort: 5 }),
            },
            {
              extension: 'webp',
              encoder: sharp(file.buffer, {
                limitInputPixels: MAX_IMAGE_PIXELS,
              })
                .rotate()
                .resize({ width, withoutEnlargement: true })
                .webp({ quality: 76, effort: 5 }),
            },
          ];
          return variants.map(({ extension, encoder }) => {
            //Using the generated UUID instead of the origin filename
            const name = `${id}-${width}.${extension}`;
            //remember the file for future failure.
            created.push(name);

            return encoder.toFile(path.join(directory, name));
          });
        }),
      );
      //Returning the largest WebP image as the default URL
      urls.push(`/uploads/listings/requests/${id}-${targets.at(-1)}.webp`);
    }

    return urls;
  } catch (error) {
    // If anything fails, remove every file created during this
    await Promise.all(
      created.map((name) =>
        fs.promises.unlink(path.join(directory, name)).catch(() => undefined),
      ),
    );

    throw error;
  }
}

//Delete all generated image variants associated with the supplied URLs.
export async function deleteUploadUrls(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {

      //only processing the URLs of the listing upload directory.
      if (!url.startsWith('/uploads/listings/requests/')) return;

      const filename = path.basename(url);
      const id = filename.match(/^([0-9a-f-]+)-\d+\.(?:avif|webp)$/i)?.[1];
      if (!id) return;

      // Get all files currently stored in the upload directory.
      const names = await fs.promises.readdir(directory);

      //Find every variant of the image ID and delete it 
      await Promise.all(
        names
          .filter((name) => name.startsWith(`${id}-`))
          .map((name) =>
            fs.promises
              .unlink(path.join(directory, name))
              .catch((error: NodeJS.ErrnoException) => {
                // ENOENT means the file was already deleted.
                if (error.code !== 'ENOENT') throw error;
              }),
          ),
      );
    }),
  );
}
