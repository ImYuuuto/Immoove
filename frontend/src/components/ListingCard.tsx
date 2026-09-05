import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Car, CheckCircle2, CookingPot, Heart, Images, ShieldCheck, Snowflake, Sparkles, Star, Trees, Tv, Waves, Wifi } from 'lucide-react';
import { fallbackListings } from '../data/content';
import type { Listing } from '../types';
import { decodeText } from '../utils/decodeText';
import { useLanguage } from '../i18n/language';
import { formatPublicationDate, isRecentListing, newBadgeLabel } from '../utils/dateFormatter';
import ResponsiveImage from './ResponsiveImage';

function AmenityIcon({ name }: { name: string }) {
  const value = name.toLowerCase();
  if (value.includes('wi-fi') || value.includes('wifi')) return <Wifi />;
  if (value.includes('parking') || value.includes('garage')) return <Car />;
  if (value.includes('pool') || value.includes('piscine')) return <Waves />;
  if (value.includes('sea') || value.includes('ocean') || value.includes('plage')) return <Waves />;
  if (value.includes('kitchen') || value.includes('cuisine')) return <CookingPot />;
  if (value.includes('air condition') || value.includes('climatisation')) return <Snowflake />;
  if (value.includes('tv') || value.includes('television')) return <Tv />;
  if (value.includes('security') || value.includes('sécurité')) return <ShieldCheck />;
  if (value.includes('garden') || value.includes('terrace') || value.includes('jardin')) return <Trees />;
  if (value.includes('clean')) return <Sparkles />;
  return <CheckCircle2 />;
}

export default function ListingCard({
  listing,
  onFavorite,
  onBook,
  onSelect,
  onViewPhotos,
  premiumInteractions = false,
  compact = false,
  imagePriority = false,
  saved = false,
  saving = false,
}: {
  listing: Listing;
  onFavorite: (id?: number) => void;
  onBook: (listing: Listing) => void;
  onSelect?: (listing: Listing) => void;
  onViewPhotos?: (listing: Listing) => void;
  premiumInteractions?: boolean;
  compact?: boolean;
  categorySlug?: string;
  imagePriority?: boolean;
  saved?: boolean;
  saving?: boolean;
}) {
  const { language, text } = useLanguage();
  const detailUrl = listing.listingId ? `/listings/${listing.listingId}` : '';
  const pricingUnits: Record<string, Record<string, string>> = {
    fr: {
      night: 'nuit',
      day: 'jour',
      hour: 'heure',
      service: 'service',
      session: 'séance',
      fixed: 'service',
    },
    en: {
      night: 'night',
      day: 'day',
      hour: 'hour',
      service: 'service',
      session: 'session',
      fixed: 'service',
    },
    ar: {
      night: 'ليلة',
      day: 'يوم',
      hour: 'ساعة',
      service: 'خدمة',
      session: 'جلسة',
      fixed: 'خدمة',
    },
  };
  const unit =
    pricingUnits[language][listing.pricingUnit?.toLowerCase() || 'night'] ||
    listing.pricingUnit ||
    text.night;
  const image =
    listing.coverImageUrl || listing.images?.[0]?.url || fallbackListings[0].coverImageUrl || '';
  const previewImages = useMemo(
    () => [
      ...(listing.coverImageUrl ? [listing.coverImageUrl] : []),
      ...(listing.images || []).map((item) => item.url),
    ].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index),
    [listing.coverImageUrl, listing.images],
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewTimer = useRef<number | null>(null);
  const publicationDate = formatPublicationDate(listing.publishedAt || listing.createdAt, language);
  const isNew = isRecentListing(listing.publishedAt || listing.createdAt);

  useEffect(() => () => {
    if (previewTimer.current) window.clearInterval(previewTimer.current);
  }, []);

  const startPreview = () => {
    if (!premiumInteractions || previewImages.length < 2 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    previewTimer.current = window.setInterval(
      () => setPreviewIndex((current) => (current + 1) % previewImages.length),
      1900,
    );
  };
  const stopPreview = () => {
    if (previewTimer.current) window.clearInterval(previewTimer.current);
    previewTimer.current = null;
    setPreviewIndex(0);
  };
  const moveImage = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!premiumInteractions || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--image-x', `${((event.clientX - rect.left) / rect.width - .5) * 10}px`);
    event.currentTarget.style.setProperty('--image-y', `${((event.clientY - rect.top) / rect.height - .5) * 10}px`);
    event.currentTarget.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
  };

  return (
    <article
      className={`listing-card ${compact ? 'is-compact' : ''} ${onSelect || detailUrl ? 'is-clickable' : ''}`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button, .favorite-active, .booking-button')) return;
        if (onSelect) {
          event.preventDefault();
          onSelect(listing);
        } else if (detailUrl && !(event.target as HTMLElement).closest('a')) {
          window.location.assign(detailUrl);
        }
      }}
    >
      <div className="listing-image" onPointerMove={moveImage} onPointerEnter={startPreview} onPointerLeave={stopPreview}>
        <ResponsiveImage
          key={previewImages[previewIndex] || image}
          src={previewImages[previewIndex] || image}
          alt={decodeText(listing.title)}
          width={1200}
          height={900}
          sizes="(max-width: 720px) calc(100vw - 44px), (max-width: 1100px) 45vw, 360px"
          priority={imagePriority}
        />
        <span>{premiumInteractions && isNew ? newBadgeLabel(language) : text.selection}</span>

        {premiumInteractions && <button
          type="button"
          className="listing-view-photos"
          onClick={(event) => {
            event.stopPropagation();
            (onViewPhotos || onSelect)?.(listing);
          }}
        >
          <Images size={15} />
          {text.viewPhotos}
        </button>}
        {premiumInteractions && <span className="listing-image-cursor" aria-hidden="true">{text.viewPhotos}</span>}

        <button
          className={saved ? 'favorite-active' : ''}
          disabled={saving}
          aria-pressed={saved}
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(listing.listingId);
          }}
          aria-label={text.addFavorite}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="listing-info">
        <div className="rating">
          <span>
            <Star size={13} fill="currentColor" />
            {listing.rating?.count && listing.rating.average !== null
              ? `${listing.rating.average.toFixed(1)} · ${listing.rating.count}`
              : `— · 0`}
          </span>

          {listing.guestCapacity ? (
            <span>
              {listing.guestCapacity} {text.guestsPlural}
            </span>
          ) : null}
        </div>

        <h3>
          {onSelect ? (
            <button
              type="button"
              className="listing-title-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(listing);
              }}
            >
              {decodeText(listing.title)}
            </button>
          ) : listing.listingId ? (
            <a href={detailUrl}>{decodeText(listing.title)}</a>
          ) : (
            decodeText(listing.title)
          )}
        </h3>

        {listing.amenities?.length ? (
          <div className="listing-amenities" aria-label="Amenities">
            {listing.amenities.slice(0, 6).map((amenity) => (
              <span key={amenity.featureId}>
                <AmenityIcon name={amenity.name} />
                {decodeText(amenity.name)}
              </span>
            ))}
          </div>
        ) : null}

        <b>
          {text.from}{' '}
          {Number(listing.basePrice || 0).toLocaleString(
            language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR',
          )}{' '}
          MAD
          <i> / {unit}</i>
        </b>

        {premiumInteractions && publicationDate && <time className="listing-publication" dateTime={listing.publishedAt || listing.createdAt}>{publicationDate}</time>}

        <button
          className="booking-button"
          type="button"
          disabled={!listing.listingId}
          onClick={() => onBook(listing)}
        >
          {text.book}
        </button>
      </div>
    </article>
  );
}

