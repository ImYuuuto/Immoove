import { useEffect } from 'react';
import {
  Bath,
  Bed,
  Car,
  CheckCircle2,
  CookingPot,
  Film,
  Heart,
  Images,
  MapPin,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Trees,
  Tv,
  Users,
  Waves,
  Wifi,
  X,
} from 'lucide-react';
import type { Listing } from '../types';
import { decodeText } from '../utils/decodeText';
import { useLanguage } from '../i18n/language';
import { fallbackListings } from '../data/content';
import ResponsiveImage from './ResponsiveImage';

function ModalAmenityIcon({ name }: { name: string }) {
  const value = name.toLowerCase();
  if (value.includes('wi-fi') || value.includes('wifi')) return <Wifi size={15} />;
  if (value.includes('parking') || value.includes('garage')) return <Car size={15} />;
  if (value.includes('pool') || value.includes('piscine')) return <Waves size={15} />;
  if (value.includes('sea') || value.includes('ocean') || value.includes('plage')) return <Waves size={15} />;
  if (value.includes('kitchen') || value.includes('cuisine')) return <CookingPot size={15} />;
  if (value.includes('air condition') || value.includes('climatisation')) return <Snowflake size={15} />;
  if (value.includes('tv') || value.includes('television')) return <Tv size={15} />;
  if (value.includes('security') || value.includes('sécurité')) return <ShieldCheck size={15} />;
  if (value.includes('garden') || value.includes('terrace') || value.includes('jardin')) return <Trees size={15} />;
  if (value.includes('clean')) return <Sparkles size={15} />;
  return <CheckCircle2 size={15} />;
}

export default function PropertyDetailsModal({
  listing,
  onClose,
  onViewPhotos,
  onViewVideo,
  onBook,
  onFavorite,
  saved = false,
  saving = false,
}: {
  listing: Listing;
  onClose: () => void;
  onViewPhotos: () => void;
  onViewVideo: () => void;
  onBook: (listing: Listing) => void;
  onFavorite?: (id?: number) => void;
  saved?: boolean;
  saving?: boolean;
}) {
  const { language, text } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const hasVideo = Boolean(listing.video && listing.video.trim() !== '');
  const locationName = listing.locationText || listing.location?.name;
  const propertyTypeName = listing.propertyType?.name;

  return (
    <div
      className="modal-backdrop property-details-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-details-title"
      onMouseDown={onClose}
    >
      <div
        className="modal property-details-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close property-modal-close"
          onClick={onClose}
          aria-label={text.close}
        >
          <X size={20} />
        </button>

        <div className="property-modal-media">
          <ResponsiveImage
            src={image}
            alt={decodeText(listing.title)}
            width={1000}
            height={600}
            sizes="(max-width: 600px) 100vw, 600px"
            priority
          />
          {propertyTypeName ? (
            <span className="property-modal-badge">{propertyTypeName}</span>
          ) : (
            <span className="property-modal-badge">{text.selection}</span>
          )}

          {onFavorite && (
            <button
              type="button"
              className={`property-modal-fav ${saved ? 'is-active' : ''}`}
              disabled={saving}
              onClick={() => onFavorite(listing.listingId)}
              aria-label={text.addFavorite}
            >
              <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div className="property-modal-body">
          <div className="property-modal-header">
            <div className="property-modal-tags">
              {locationName && (
                <span className="property-modal-location">
                  <MapPin size={13} />
                  {locationName}
                </span>
              )}
              <div className="property-modal-rating">
                <Star size={13} fill="currentColor" />
                <span>
                  {listing.rating?.count && listing.rating.average !== null
                    ? `${listing.rating.average.toFixed(1)} (${listing.rating.count})`
                    : '—'}
                </span>
              </div>
            </div>

            <h2 id="property-details-title" className="property-modal-title">
              {decodeText(listing.title)}
            </h2>
          </div>

          <div className="property-modal-specs">
            {listing.guestCapacity ? (
              <span className="spec-item">
                <Users size={14} />
                <b>{listing.guestCapacity}</b> {text.guestsPlural}
              </span>
            ) : null}
            {listing.bedrooms ? (
              <span className="spec-item">
                <Bed size={14} />
                <b>{listing.bedrooms}</b> {text.bedrooms}
              </span>
            ) : null}
            {listing.bathrooms ? (
              <span className="spec-item">
                <Bath size={14} />
                <b>{listing.bathrooms}</b> {text.bathrooms}
              </span>
            ) : null}
          </div>

          {listing.description && (
            <div className="property-modal-desc">
              <p>{decodeText(listing.description)}</p>
            </div>
          )}

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="property-modal-amenities">
              <h4>{text.amenities || 'Équipements'}</h4>
              <div className="amenity-chips">
                {listing.amenities.slice(0, 8).map((amenity) => (
                  <span key={amenity.featureId} className="amenity-chip">
                    <ModalAmenityIcon name={amenity.name} />
                    {decodeText(amenity.name)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="property-modal-footer">
            <div className="property-modal-price">
              <small>{text.from}</small>
              <div className="price-tag">
                <strong>
                  {Number(listing.basePrice || 0).toLocaleString(
                    language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR',
                  )}
                </strong>
                <span>MAD</span>
                <i> / {unit}</i>
              </div>
            </div>

            <div className="property-modal-actions">
              <button
                type="button"
                className="action-btn action-photos"
                onClick={onViewPhotos}
              >
                <Images size={16} />
                {text.viewPhotos}
              </button>

              {hasVideo && (
                <button
                  type="button"
                  className="action-btn action-video"
                  onClick={onViewVideo}
                >
                  <Film size={16} />
                  {text.viewVideo}
                </button>
              )}

              <button
                type="button"
                className="action-btn action-book"
                disabled={!listing.listingId}
                onClick={() => onBook(listing)}
              >
                {text.book}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

