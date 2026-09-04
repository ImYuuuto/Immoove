import { Car, CheckCircle2, CookingPot, Heart, ShieldCheck, Snowflake, Sparkles, Star, Trees, Tv, Waves, Wifi } from 'lucide-react';
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
  imagePriority = false,
  saved = false,
  saving = false,
}: {
  listing: Listing;
  onFavorite: (id?: number) => void;
  onBook: (listing: Listing) => void;
  onSelect?: (listing: Listing) => void;
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

  return (
    <article
      className={`listing-card ${onSelect || detailUrl ? 'is-clickable' : ''}`}
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
      <div className="listing-image">
        <ResponsiveImage
          src={image}
          alt={decodeText(listing.title)}
          width={1200}
          height={900}
          sizes="(max-width: 720px) calc(100vw - 44px), (max-width: 1100px) 45vw, 360px"
          priority={imagePriority}
        />
        <span>{text.selection}</span>

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

