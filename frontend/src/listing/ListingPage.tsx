import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarX, Check, MapPin, Star, UserRound } from 'lucide-react';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import { pricingUnitLabel } from './availability';
import { useListingCopy } from './listingI18n';
import type { ListingDetail } from './types';
import './listing.css';

export default function ListingPage({ listingId }: { listingId: number }) {
  const copy = useListingCopy();
  const { language } = useLanguage();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { const result = await request<{ item: ListingDetail }>(`/listings/${listingId}`); setListing(result.item); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.unavailable); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [listingId]);

  const images = useMemo(() => listing ? [...(listing.coverImageUrl ? [{ url: listing.coverImageUrl }] : []), ...(listing.images || [])].filter((image, index, all) => all.findIndex((other) => other.url === image.url) === index) : [], [listing]);
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';

  if (loading) return <div className="listing-state">{copy.loading}</div>;
  if (!listing) return <div className="listing-state"><h1>{copy.unavailable}</h1><p>{error}</p><button onClick={() => void load()}>{copy.retry}</button></div>;

  const ownerName = [listing.owner?.firstName, listing.owner?.lastName].filter(Boolean).join(' ') || copy.ownerFallback;
  const unit = pricingUnitLabel(listing.pricingUnit, copy, listing.serviceType);
  const goToCheckout = async () => {
    try { await request('/auth/session'); window.location.assign(`/checkout/${listing.listingId}`); }
    catch { window.location.assign(`/?login=1&next=${encodeURIComponent(`/checkout/${listing.listingId}`)}`); }
  };

  return <main className="listing-page">
    <header className="listing-topbar"><a className="brand" href="/"><b>B</b>bouzid<span>.</span></a><a href={listing.category?.slug ? `/categories/${listing.category.slug}` : '/categories'}><ArrowLeft size={17} />{copy.back}</a></header>
    <section className={`listing-gallery gallery-${Math.min(images.length, 5)}`} aria-label={copy.gallery}>{images.length ? images.slice(0, 5).map((image, index) => <img key={image.url} className={index === 0 ? 'gallery-main' : ''} src={image.url} alt={`${listing.title} ${index + 1}`} />) : <div className="gallery-empty">{listing.title.slice(0, 1)}</div>}</section>
    <section className="listing-detail-grid"><div className="listing-detail-main"><div className="listing-heading"><div>{listing.location?.name && <small><MapPin size={14} />{listing.location.name}</small>}<h1>{listing.title}</h1><p>{listing.description}</p></div><div className="detail-rating"><Star fill="currentColor" size={18} /><b>{listing.rating.average?.toFixed(1) || '—'}</b><span>{listing.rating.count} {copy.review}</span></div></div>
      <article className="owner-card"><UserRound /><div><small>{copy.owner}</small><b>{ownerName}</b></div></article>
      <section className="detail-section"><h2>{copy.amenities}</h2>{listing.amenities.length ? <div className="amenity-grid">{listing.amenities.map((amenity) => <span key={amenity.featureId}><Check size={16} />{amenity.name}</span>)}</div> : <p>{copy.noAmenities}</p>}</section>
      <section className="detail-section"><h2>{copy.availability}</h2>{listing.availability.length ? <div className="availability-list">{listing.availability.map((interval, index) => <span key={`${interval.startDate}-${index}`}><CalendarX size={16} />{new Date(interval.startDate).toLocaleString(locale)} → {new Date(interval.endDate).toLocaleString(locale)}</span>)}</div> : <p>{copy.fullyAvailable}</p>}</section>
      <section className="detail-section"><h2>{copy.reviews}</h2>{listing.reviews.length ? <div className="review-grid">{listing.reviews.map((review) => <article key={review.reviewId}><div><b>{[review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') || copy.ownerFallback}</b><span><Star fill="currentColor" size={14} />{review.rating}/5</span></div><p>{review.comment}</p><small>{new Date(review.createdAt).toLocaleDateString(locale)}</small></article>)}</div> : <p>{copy.noReviews}</p>}</section>
    </div><aside className="listing-book-card"><small>{copy.priceFrom}</small><strong>{Number(listing.basePrice || 0).toLocaleString(locale)} MAD</strong><span>/ {unit}</span><button onClick={() => void goToCheckout()}>{copy.book}</button><p>{copy.loginToBook}</p></aside></section>
  </main>;
}
