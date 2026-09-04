import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarX, Check, Film, Heart, MapPin, Share2, Star, UserRound } from 'lucide-react';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import { pricingUnitLabel } from './availability';
import { useListingCopy } from './listingI18n';
import type { ListingDetail } from './types';
import './listing.css';
import ResponsiveImage from '../components/ResponsiveImage';
import VideoModal from '../components/VideoModal';

export default function ListingPage({
  listingId,
  categorySlug,
}: {
  listingId: number;
  categorySlug?: string;
}) {
  const copy = useListingCopy();
  const { language } = useLanguage();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [shareLabel, setShareLabel] = useState('');
  const [videoListing, setVideoListing] = useState<ListingDetail | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await request<{ item: ListingDetail }>(`/listings/${listingId}`);
      setListing(result.item);
      const canonicalPath = `/listings/${listingId}`;
      if (window.location.pathname !== canonicalPath)
        window.history.replaceState(null, '', canonicalPath);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.unavailable);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    request<{ items: Array<{ listingId?: number }> }>('/favorites')
      .then((result) => setFavorite(result.items.some((item) => item.listingId === listingId)))
      .catch(() => setFavorite(false));
  }, [listingId]);

  const images = useMemo(
    () =>
      listing
        ? [
            ...(listing.coverImageUrl ? [{ url: listing.coverImageUrl }] : []),
            ...(listing.images || []),
          ].filter(
            (image, index, all) => all.findIndex((other) => other.url === image.url) === index,
          )
        : [],
    [listing],
  );
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';

  if (loading) return <div className="listing-state">{copy.loading}</div>;
  if (!listing)
    return (
      <div className="listing-state">
        <h1>{copy.unavailable}</h1>
        <p>{error}</p>
        <button onClick={() => void load()}>{copy.retry}</button>
      </div>
    );

  const ownerName =
    [listing.owner?.firstName, listing.owner?.lastName].filter(Boolean).join(' ') ||
    copy.ownerFallback;
  const unit = pricingUnitLabel(listing.pricingUnit, copy, listing.serviceType);
  const latitude = listing.latitude ?? listing.location?.lat;
  const longitude = listing.longitude ?? listing.location?.lng;
  const hasMap = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
  const mapSrc = hasMap ? `https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed` : '';
  const toggleFavorite = async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try {
      const result = await request<{ saved: boolean }>(`/favorites/${listing.listingId}/toggle`, { method: 'POST' });
      setFavorite(result.saved);
    } catch { window.location.assign(`/?login=1&next=${encodeURIComponent(window.location.pathname)}`); }
    finally { setSavingFavorite(false); }
  };
  const share = async () => {
    const details = { title: listing.title, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(details);
      else { await navigator.clipboard.writeText(window.location.href); setShareLabel(copy.shared); setTimeout(() => setShareLabel(''), 1800); }
    } catch { /* The user can dismiss the native share sheet. */ }
  };
  const goToCheckout = async () => {
    try {
      await request('/auth/session');
      window.location.assign(`/checkout/${listing.listingId}`);
    } catch {
      window.location.assign(
        `/?login=1&next=${encodeURIComponent(`/checkout/${listing.listingId}`)}`,
      );
    }
  };

  return (
    <main className="listing-page">
      <header className="listing-topbar">
        <a className="brand" href="/">
          <b>I</b>immoove<span>.</span>
        </a>
        <a href="/properties">
          <ArrowLeft size={17} />
          {copy.back}
        </a>
      </header>
      <section className="listing-titlebar">
        <div><h1>{listing.title}</h1><p><Star fill="currentColor" size={15} /><b>{listing.rating.average?.toFixed(1) || '—'}</b><span>·</span><a href="#reviews">{listing.rating.count} {copy.review}</a><span>·</span><span>{listing.locationText || listing.location?.name}</span></p></div>
        <div className="listing-actions"><button type="button" onClick={() => void share()}><Share2 />{shareLabel || copy.share}</button><button type="button" className={favorite ? 'active' : ''} disabled={savingFavorite} aria-pressed={favorite} onClick={() => void toggleFavorite()}><Heart fill={favorite ? 'currentColor' : 'none'} />{favorite ? copy.favorited : copy.favorite}</button></div>
      </section>
      <section
        className={`listing-gallery gallery-${Math.min(images.length, 5)}`}
        aria-label={copy.gallery}
      >
        {images.length ? (
          images
            .slice(0, 5)
            .map((image, index) => (
              <ResponsiveImage
                key={image.url}
                pictureClassName={index === 0 ? 'gallery-main' : ''}
                src={image.url}
                alt={`${listing.title} ${index + 1}`}
                width={1200}
                height={900}
                sizes={
                  index === 0
                    ? '(max-width: 850px) calc(100vw - 36px), 62vw'
                    : '(max-width: 850px) 50vw, 19vw'
                }
                priority={index === 0}
              />
            ))
        ) : (
          <div className="gallery-empty">{listing.title.slice(0, 1)}</div>
        )}
      </section>
      <section className="listing-detail-grid">
        <div className="listing-detail-main">
          <div className="listing-heading">
            <div>
              {listing.location?.name && (
                <small>
                  <MapPin size={14} />
                  {listing.location.name}
                </small>
              )}
              <h2>{listing.propertyType?.name || listing.title}</h2>
              <p>{[listing.guestCapacity && `${listing.guestCapacity} ${language === 'fr' ? 'voyageurs' : language === 'ar' ? 'ضيوف' : 'guests'}`, listing.bedrooms && `${listing.bedrooms} ${language === 'fr' ? 'chambres' : language === 'ar' ? 'غرف' : 'bedrooms'}`, listing.beds && `${listing.beds} ${language === 'fr' ? 'lits' : language === 'ar' ? 'أسرّة' : 'beds'}`, listing.bathrooms && `${listing.bathrooms} ${language === 'fr' ? 'salles de bain' : language === 'ar' ? 'حمامات' : 'bathrooms'}`].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="detail-rating">
              <Star fill="currentColor" size={18} />
              <b>{listing.rating.average?.toFixed(1) || '—'}</b>
              <span>
                {listing.rating.count} {copy.review}
              </span>
            </div>
          </div>
          <article className="owner-card">
            {listing.owner?.photoUrl
              ? <ResponsiveImage src={listing.owner.photoUrl} alt={ownerName} width={52} height={52} sizes="52px" />
              : <UserRound />}
            <div>
              <small>{copy.owner}</small>
              <b>{ownerName}</b>
            </div>
          </article>
          {listing.description && <section className={`detail-section listing-description ${descriptionOpen ? 'open' : ''}`}><h2>{copy.description}</h2><div><p>{listing.description}</p></div><button type="button" onClick={() => setDescriptionOpen(value => !value)}>{descriptionOpen ? copy.readLess : copy.readMore}</button></section>}
          <section className="detail-section" id="reviews">
            <h2>{copy.amenities}</h2>
            {listing.amenities.length ? (
              <div className="amenity-grid">
                {listing.amenities.map((amenity) => (
                  <span key={amenity.featureId}>
                    <Check size={16} />
                    {amenity.name}
                  </span>
                ))}
              </div>
            ) : (
              <p>{copy.noAmenities}</p>
            )}
          </section>
          {hasMap && <section className="detail-section listing-map"><h2>{copy.location}</h2><p>{listing.locationText || listing.location?.name}</p><div><iframe title={copy.location} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div><small><MapPin size={14} />{copy.mapHint}</small></section>}
          <section className="detail-section">
            <h2>{copy.availability}</h2>
            {listing.availability.length ? (
              <div className="availability-list">
                {listing.availability.map((interval, index) => (
                  <span key={`${interval.startDate}-${index}`}>
                    <CalendarX size={16} />
                    {new Date(interval.startDate).toLocaleString(locale)} →{' '}
                    {new Date(interval.endDate).toLocaleString(locale)}
                  </span>
                ))}
              </div>
            ) : (
              <p>{copy.fullyAvailable}</p>
            )}
          </section>
          <section className="detail-section">
            <h2>{copy.reviews}</h2>
            {listing.reviews.length ? (
              <div className="review-grid">
                {listing.reviews.map((review) => (
                  <article key={review.reviewId}>
                    <div>
                      <b>
                        {[review.user?.firstName, review.user?.lastName]
                          .filter(Boolean)
                          .join(' ') || copy.ownerFallback}
                      </b>
                      <span>
                        <Star fill="currentColor" size={14} />
                        {review.rating}/5
                      </span>
                    </div>
                    <p>{review.comment}</p>
                    <small>{new Date(review.createdAt).toLocaleDateString(locale)}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p>{copy.noReviews}</p>
            )}
          </section>
        </div>
        <aside className="listing-book-card">
          <small>{copy.priceFrom}</small>
          <strong>{Number(listing.basePrice || 0).toLocaleString(locale)} MAD</strong>
          <span>/ {unit}</span>
          <div className="listing-action-buttons">
            {listing.video && listing.video.trim() !== '' && (
              <button className="listing-secondary-action listing-video-action" onClick={() => setVideoListing(listing)}>
                <Film size={16} />
                {copy.viewVideo}
              </button>
            )}
          </div>
          <button onClick={() => void goToCheckout()}>{copy.book}</button>
          <p>{copy.loginToBook}</p>
        </aside>
      </section>
      <footer className="listing-footer"><div><a className="brand" href="/"><b>I</b> immoove<span>.</span></a><p>{copy.footerText}</p></div><nav><small>{copy.exploreFooter}</small><a href="/properties">{copy.stays}</a></nav><div><a href={`/terms?language=${language}`}>{copy.terms}</a><a href={`/privacy?language=${language}`}>{copy.privacy}</a></div><p>© 2026 Immoove · {copy.madeWithCare}</p></footer>

      {/* VIDEO MODAL */}
      {videoListing && (
        <VideoModal
          listing={videoListing}
          onClose={() => setVideoListing(null)}
        />
      )}
    </main>
  );
}

