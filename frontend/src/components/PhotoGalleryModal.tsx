import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Listing } from '../types';
import { decodeText } from '../utils/decodeText';
import { useLanguage } from '../i18n/language';
import { fallbackListings } from '../data/content';
import ResponsiveImage from './ResponsiveImage';

export default function PhotoGalleryModal({
  listing,
  initialIndex = 0,
  onClose,
}: {
  listing: Listing;
  initialIndex?: number;
  onClose: () => void;
}) {
  const { text } = useLanguage();
  const rawImages = [
    ...(listing.coverImageUrl ? [{ url: listing.coverImageUrl }] : []),
    ...(listing.images || []),
  ];

  const images = rawImages.length
    ? rawImages.filter((img, idx, arr) => arr.findIndex((o) => o.url === img.url) === idx)
    : [{ url: fallbackListings[0].coverImageUrl || '' }];

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, images.length - 1)),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else if (event.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      className="modal-backdrop gallery-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={text.propertyDetails}
      onMouseDown={onClose}
    >
      <div
        className="gallery-lightbox-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="gallery-lightbox-header">
          <div className="gallery-lightbox-title">
            <h3>{decodeText(listing.title)}</h3>
            <span>
              {currentIndex + 1} / {images.length}
            </span>
          </div>
          <button
            type="button"
            className="modal-close gallery-close-btn"
            onClick={onClose}
            aria-label={text.close}
          >
            <X size={20} />
          </button>
        </div>

        <div className="gallery-lightbox-viewport">
          {images.length > 1 && (
            <button
              type="button"
              className="gallery-nav-btn gallery-nav-prev"
              onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
              aria-label={text.prevImage}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="gallery-main-image-wrap">
            <ResponsiveImage
              key={currentImage.url}
              pictureClassName="gallery-lightbox-picture"
              src={currentImage.url}
              alt={`${decodeText(listing.title)} - ${currentIndex + 1}`}
              width={1600}
              height={1060}
              sizes="(max-width: 900px) 96vw, 85vw"
              priority
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="gallery-nav-btn gallery-nav-next"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
              aria-label={text.nextImage}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="gallery-thumbnails" role="tablist" aria-label={text.propertyDetails}>
            {images.map((image, index) => (
              <button
                key={image.url + index}
                type="button"
                role="tab"
                aria-selected={index === currentIndex}
                className={`gallery-thumb ${index === currentIndex ? 'is-active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <img src={image.url} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

