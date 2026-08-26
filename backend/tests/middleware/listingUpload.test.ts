import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { deleteUploadUrls, processListingUploads } from '../../src/middleware/listingUpload';

describe('listing image processing', () => {
  it('creates responsive AVIF and WebP variants and removes the full set', async () => {
    const buffer = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#d7b487' } }).jpeg().toBuffer();
    const file = {
      fieldname: 'images', originalname: 'listing.jpg', encoding: '7bit', mimetype: 'image/jpeg',
      size: buffer.length, buffer, stream: undefined as never, destination: '', filename: '', path: '',
    } as Express.Multer.File;

    const urls = await processListingUploads([file]);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/^\/uploads\/listings\/requests\/[0-9a-f-]+-800\.webp$/);

    const directory = path.resolve(process.cwd(), 'upload', 'listings', 'requests');
    const id = path.basename(urls[0]).split('-800.webp')[0];
    await expect(fs.promises.access(path.join(directory, `${id}-320.avif`))).resolves.toBeUndefined();
    await expect(fs.promises.access(path.join(directory, `${id}-800.webp`))).resolves.toBeUndefined();

    await deleteUploadUrls(urls);
    await expect(fs.promises.access(path.join(directory, `${id}-320.avif`))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(fs.promises.access(path.join(directory, `${id}-800.webp`))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
