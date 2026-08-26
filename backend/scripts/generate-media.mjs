import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(process.cwd(), 'upload', 'site');
const widths = [320, 480, 640, 800, 960, 1200, 1600, 2200];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  }));
  return nested.flat();
}

async function generate(source) {
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Unable to read ${source}`);
  const extension = path.extname(source);
  const base = source.slice(0, -extension.length);
  const targets = [...new Set([...widths.filter((width) => width < metadata.width), metadata.width])];

  await Promise.all(targets.flatMap((width) => {
    const pipeline = () => sharp(source).rotate().resize({ width, withoutEnlargement: true });
    return [
      pipeline().avif({ quality: 52, effort: 5 }).toFile(`${base}-${width}.avif`),
      pipeline().webp({ quality: 76, effort: 5 }).toFile(`${base}-${width}.webp`),
    ];
  }));
  return targets.length * 2;
}

const sources = (await walk(root)).filter((file) => /\.(jpe?g|png)$/i.test(file));
let generated = 0;
for (const source of sources) generated += await generate(source);
console.log(`Generated ${generated} responsive assets from ${sources.length} source images.`);
