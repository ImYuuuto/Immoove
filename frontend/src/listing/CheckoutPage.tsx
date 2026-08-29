import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';
import type { BookingContact, BookingRecord } from '../types';
import { formatTranslation, useLanguage } from '../i18n/language';
import { ApiError, request } from '../utils/request';
import BookingSelector, { type BookingSelection } from './BookingSelector';
import { bookingMode, pricingUnitLabel } from './availability';
import { useListingCopy } from './listingI18n';
import type { CheckoutProfile, ListingDetail } from './types';
import './listing.css';
import ResponsiveImage from '../components/ResponsiveImage';

const emptyContact: BookingContact = { firstName: '', lastName: '', email: '', phone: '' };

export default function CheckoutPage({ listingId }: { listingId: number }) {
  const copy = useListingCopy();
  const { language } = useLanguage();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [contact, setContact] = useState<BookingContact>(emptyContact);
  const [selection, setSelection] = useState<BookingSelection>({
    startDate: '',
    endDate: '',
    valid: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';

  useEffect(() => {
    Promise.all([
      request<{ item: ListingDetail }>(`/listings/${listingId}`),
      request<{ user: CheckoutProfile }>('/profile'),
    ])
      .then(([listingResult, profileResult]) => {
        setListing(listingResult.item);
        setContact({
          firstName: profileResult.user.firstName || '',
          lastName: profileResult.user.lastName || '',
          email: profileResult.user.email || '',
          phone: profileResult.user.phone || '',
        });
      })
      .catch((cause) => {
        if (cause instanceof ApiError && cause.status === 401) {
          window.location.assign(`/?login=1&next=${encodeURIComponent(`/checkout/${listingId}`)}`);
          return;
        }
        setError(cause instanceof Error ? cause.message : copy.profileFailed);
      })
      .finally(() => setLoading(false));
  }, [copy.profileFailed, listingId]);

  const receiveSelection = useCallback((next: BookingSelection) => setSelection(next), []);
  const updateContact = (key: keyof BookingContact, value: string) =>
    setContact((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!Object.values(contact).every((value) => value.trim()) || !selection.valid) {
      setError(copy.required);
      return;
    }
    setSubmitting(true);
    try {
      const result = await request<{ item: BookingRecord }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          listingId,
          startDate: selection.startDate,
          endDate: selection.endDate,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        }),
      });
      setBooking(result.item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.bookingFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="listing-state">{copy.checkoutLoading}</div>;
  if (!listing)
    return (
      <div className="listing-state">
        <h1>{copy.unavailable}</h1>
        <p>{error || copy.profileFailed}</p>
        <a href={`/listings/${listingId}`}>{copy.back}</a>
      </div>
    );
  if (booking)
    return (
      <main className="checkout-page">
        <section className="booking-success">
          <CheckCircle2 size={52} />
          <small>#{booking.bookingId}</small>
          <h1>{copy.confirmed}</h1>
          <strong>
            {formatTranslation(copy.authoritativeTotal, {
              total: Number(booking.total).toLocaleString(locale),
            })}
          </strong>
          <p>
            {new Date(booking.startDate).toLocaleString(locale)} →{' '}
            {new Date(booking.endDate).toLocaleString(locale)}
          </p>
          <a href="/">{copy.returnHome}</a>
        </section>
      </main>
    );

  const mode = bookingMode(listing);
  const unit = pricingUnitLabel(listing.pricingUnit, copy, listing.serviceType);
  return (
    <main className="checkout-page">
      <header className="listing-topbar">
        <a className="brand" href="/">
          <b>B</b>bouzid<span>.</span>
        </a>
        <a href={`/listings/${listingId}`}>
          <ArrowLeft size={17} />
          {copy.back}
        </a>
      </header>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-title">
            <small>BOUZID ESCAPES</small>
            <h1>{copy.checkout}</h1>
          </div>
          <section className="checkout-section">
            <h2>{copy.contact}</h2>
            <div className="checkout-fields two">
              <label>
                {copy.firstName}
                <input
                  required
                  autoComplete="given-name"
                  value={contact.firstName}
                  onChange={(event) => updateContact('firstName', event.target.value)}
                />
              </label>
              <label>
                {copy.lastName}
                <input
                  required
                  autoComplete="family-name"
                  value={contact.lastName}
                  onChange={(event) => updateContact('lastName', event.target.value)}
                />
              </label>
              <label>
                {copy.email}
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={contact.email}
                  onChange={(event) => updateContact('email', event.target.value)}
                />
              </label>
              <label>
                {copy.phone}
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={contact.phone}
                  onChange={(event) => updateContact('phone', event.target.value)}
                />
              </label>
            </div>
          </section>
          <BookingSelector listing={listing} mode={mode} onChange={receiveSelection} />
          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}
          <button className="checkout-submit" disabled={submitting || !selection.valid}>
            <CreditCard size={18} />
            {submitting ? copy.confirming : copy.confirm}
          </button>
        </form>
        <aside className="checkout-summary">
          {listing.coverImageUrl && (
            <ResponsiveImage
              src={listing.coverImageUrl}
              alt={listing.title}
              width={800}
              height={600}
              sizes="350px"
              priority
            />
          )}
          <h2>{listing.title}</h2>
          <p>{listing.location?.name}</p>
          <strong>
            {Number(listing.basePrice || 0).toLocaleString(locale)} MAD <small>/ {unit}</small>
          </strong>
          <span>
            {formatTranslation(copy.estimate, {
              price: Number(listing.basePrice || 0).toLocaleString(locale),
              unit,
            })}
          </span>
          <p>{copy.totalNotice}</p>
        </aside>
      </div>
    </main>
  );
}
