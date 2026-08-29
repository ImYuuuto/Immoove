import type { ImgHTMLAttributes } from 'react';

type Asset = { width: number; height: number; widths: number[] };

const siteAssets: Record<string, Asset> = {
  '/uploads/site/categories/activities.jpg': {
    width: 900,
    height: 600,
    widths: [320, 480, 640, 800, 900],
  },
  '/uploads/site/categories/beach.jpg': {
    width: 900,
    height: 598,
    widths: [320, 480, 640, 800, 900],
  },
  '/uploads/site/categories/restaurants.jpg': {
    width: 900,
    height: 600,
    widths: [320, 480, 640, 800, 900],
  },
  '/uploads/site/categories/stays.jpg': {
    width: 1200,
    height: 675,
    widths: [320, 480, 640, 800, 960, 1200],
  },
  '/uploads/site/dining/chez-laura.jpg': {
    width: 1200,
    height: 900,
    widths: [320, 480, 640, 800, 960, 1200],
  },
  '/uploads/site/dining/la-caleche.jpg': { width: 800, height: 529, widths: [320, 480, 640, 800] },
  '/uploads/site/dining/le-spot.jpg': { width: 800, height: 533, widths: [320, 480, 640, 800] },
  '/uploads/site/hero/coastal-hero.jpg': {
    width: 2200,
    height: 1467,
    widths: [320, 480, 640, 800, 960, 1200, 1600, 2200],
  },
  '/uploads/site/journal/coastal-flavours.jpg': {
    width: 900,
    height: 600,
    widths: [320, 480, 640, 800, 900],
  },
  '/uploads/site/listings/dar-el-bahri.jpg': {
    width: 1000,
    height: 667,
    widths: [320, 480, 640, 800, 960, 1000],
  },
  '/uploads/site/listings/maison-bleue.jpg': {
    width: 1000,
    height: 680,
    widths: [320, 480, 640, 800, 960, 1000],
  },
  '/uploads/site/listings/villa-des-dunes.jpg': {
    width: 1000,
    height: 667,
    widths: [320, 480, 640, 800, 960, 1000],
  },
  '/uploads/site/map/coast-map.jpg': {
    width: 1100,
    height: 729,
    widths: [320, 480, 640, 800, 960, 1100],
  },
};

function localSources(src: string) {
  const asset = siteAssets[src];
  if (asset) {
    const base = src.replace(/\.[^.]+$/, '');
    return {
      asset,
      avif: asset.widths.map((width) => `${base}-${width}.avif ${width}w`).join(', '),
      webp: asset.widths.map((width) => `${base}-${width}.webp ${width}w`).join(', '),
    };
  }

  const upload = src.match(/^(\/uploads\/listings\/requests\/[0-9a-f-]+)-(\d+)\.webp$/i);
  if (!upload) return null;
  const max = Number(upload[2]);
  const widths = [...new Set([320, 640, 960, 1440, max].filter((width) => width <= max))].sort(
    (a, b) => a - b,
  );
  return {
    asset: undefined,
    avif: widths.map((width) => `${upload[1]}-${width}.avif ${width}w`).join(', '),
    webp: widths.map((width) => `${upload[1]}-${width}.webp ${width}w`).join(', '),
  };
}

function unsplashSource(src: string, width: number, height: number) {
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}auto=format&fit=crop&w=${width}&h=${height}&q=76`;
}

type Props = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'loading' | 'width' | 'height'
> & {
  src: string;
  sizes: string;
  width?: number;
  height?: number;
  priority?: boolean;
  pictureClassName?: string;
};

export default function ResponsiveImage({
  src,
  sizes,
  width,
  height,
  priority = false,
  pictureClassName,
  alt,
  ...props
}: Props) {
  const local = localSources(src);
  const dimensions = local?.asset;
  const resolvedWidth = dimensions?.width || width || 1200;
  const resolvedHeight = dimensions?.height || height || 900;
  const shared = {
    ...props,
    alt,
    width: resolvedWidth,
    height: resolvedHeight,
    sizes,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
    fetchPriority: priority ? ('high' as const) : ('auto' as const),
  };

  if (local)
    return (
      <picture className={pictureClassName}>
        <source type="image/avif" srcSet={local.avif} sizes={sizes} />
        <source type="image/webp" srcSet={local.webp} sizes={sizes} />
        <img {...shared} src={src} />
      </picture>
    );

  if (src.startsWith('https://images.unsplash.com/')) {
    const widths = [320, 480, 640, 800, 960, 1200, 1600];
    const heightFor = (candidate: number) =>
      Math.round((candidate * resolvedHeight) / resolvedWidth);
    const fallbackWidth = Math.min(resolvedWidth, 1200);
    return (
      <img
        {...shared}
        className={[shared.className, pictureClassName].filter(Boolean).join(' ') || undefined}
        src={unsplashSource(src, fallbackWidth, heightFor(fallbackWidth))}
        srcSet={widths
          .map(
            (candidate) => `${unsplashSource(src, candidate, heightFor(candidate))} ${candidate}w`,
          )
          .join(', ')}
      />
    );
  }

  return (
    <img
      {...shared}
      className={[shared.className, pictureClassName].filter(Boolean).join(' ') || undefined}
      src={src}
    />
  );
}
