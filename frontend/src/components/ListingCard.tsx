import { Heart, Star } from 'lucide-react';
import { fallbackListings } from '../data/content';
import type { Listing } from '../types';
import { decodeText } from '../utils/decodeText';
import { useLanguage } from '../i18n/language';

export default function ListingCard({
  listing,
  onFavorite,
  onBook,
}: {
  listing: Listing;
  onFavorite: (id?: number) => void;
  onBook: (listing: Listing) => void;
}) {
  const { language, text } = useLanguage();
  const detailUrl = listing.listingId ? `/listings/${listing.listingId}` : '';
  const pricingUnits: Record<string, Record<string, string>> = {
    fr: { night: 'nuit', day: 'jour', hour: 'heure', service: 'service', session: 'séance', fixed: 'service' },
    en: { night: 'night', day: 'day', hour: 'hour', service: 'service', session: 'session', fixed: 'service' },
    ar: { night: 'ليلة', day: 'يوم', hour: 'ساعة', service: 'خدمة', session: 'جلسة', fixed: 'خدمة' },
  };
  const unit = pricingUnits[language][listing.pricingUnit?.toLowerCase() || 'night'] || listing.pricingUnit || text.night;
  const image =
    listing.coverImageUrl ||
    listing.images?.[0]?.url ||
    fallbackListings[0]
      .coverImageUrl ||
    '';

  return (
    <article
      className={`listing-card ${detailUrl ? 'is-clickable' : ''}`}
      onClick={(event) => {
        if (detailUrl && !(event.target as HTMLElement).closest('a, button')) window.location.assign(detailUrl);
      }}
    >

      <div className="listing-image">

        <img
          src={image}
          alt={decodeText(listing.title)}
        />
        {listing.listingId ? <a className="listing-view" href={detailUrl}>{text.viewStay}</a> : <span className="listing-view">{text.viewStay}</span>}

        <span>
          {text.selection}
        </span>

        <button
          onClick={() =>
            onFavorite(
              listing.listingId,
            )
          }
          aria-label={text.addFavorite}
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="listing-info">

        <div className="rating">
          <span>
            <Star
              size={13}
              fill="currentColor"
            />
            {listing.rating?.count && listing.rating.average !== null ? `${listing.rating.average.toFixed(1)} · ${listing.rating.count}` : `— · 0`}
          </span>

          {listing.guestCapacity ? <span>{listing.guestCapacity} {text.guestsPlural}</span> : null}
        </div>

        <h3>{listing.listingId ? <a href={detailUrl}>{decodeText(listing.title)}</a> : decodeText(listing.title)}</h3>

        <p>
          {decodeText(listing.description) ||
            text.listingFallback}
        </p>

        <b>
          {text.from}{' '}
          {Number(
            listing.basePrice || 0,
          ).toLocaleString(
            language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR',
          )}{' '}
          MAD

          <i>
            {' '}/ {unit}
          </i>
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
