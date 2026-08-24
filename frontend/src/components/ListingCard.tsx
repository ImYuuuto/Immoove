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
  const image =
    listing.coverImageUrl ||
    listing.images?.[0]?.url ||
    fallbackListings[0]
      .coverImageUrl;

  return (
    <article className="listing-card">

      <div className="listing-image">

        <img
          src={image}
          alt={decodeText(listing.title)}
        />
        {listing.listingId ? <a className="listing-view" href={`/listings/${listing.listingId}`}>{text.viewStay}</a> : <span className="listing-view">{text.viewStay}</span>}

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
            5.00 · {text.excellent}
          </span>

          <span>
            {listing.guestCapacity ||
              4}{' '}
            {text.guestsPlural}
          </span>
        </div>

        <h3>{listing.listingId ? <a href={`/listings/${listing.listingId}`}>{decodeText(listing.title)}</a> : decodeText(listing.title)}</h3>

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
            {' '}/ {text.night}
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
