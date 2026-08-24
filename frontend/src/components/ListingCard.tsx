import { Heart, Star } from 'lucide-react';
import { fallbackListings } from '../data/content';
import type { Listing } from '../types';

export default function ListingCard({
  listing,
  onFavorite,
}: {
  listing: Listing;
  onFavorite: (id?: number) => void;
}) {
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
          alt={listing.title}
        />

        <span>
          SÉLECTION
        </span>

        <button
          onClick={() =>
            onFavorite(
              listing.listingId,
            )
          }
          aria-label="Ajouter aux favoris"
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
            5.00 · Excellent
          </span>

          <span>
            {listing.guestCapacity ||
              4}{' '}
            voyageurs
          </span>
        </div>

        <h3>
          {listing.title}
        </h3>

        <p>
          {listing.description ||
            'Une adresse choisie pour vos vacances.'}
        </p>

        <b>
          À partir de{' '}
          {Number(
            listing.basePrice || 0,
          ).toLocaleString(
            'fr-FR',
          )}{' '}
          MAD

          <i>
            {' '}
            / nuit
          </i>
        </b>
      </div>
    </article>
  );
}

