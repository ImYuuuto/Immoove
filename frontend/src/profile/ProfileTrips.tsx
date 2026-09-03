import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, UsersRound, X } from 'lucide-react';
import ResponsiveImage from '../components/ResponsiveImage';
import type { Language } from '../types';
import { request } from '../utils/request';
import type { PropertyDiscoveryOptions } from '../properties/types';
import type { ProfileBooking, TripState } from './types';
import { profileCopy } from './profileI18n';

type Props = { language: Language; notify: (message: string) => void };

export default function ProfileTrips({ language, notify }: Props) {
  const copy = profileCopy(language);
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-MA';
  const [state, setState] = useState<TripState>('all');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<PropertyDiscoveryOptions['cities']>([]);
  const [items, setItems] = useState<ProfileBooking[]>([]);
  const [selected, setSelected] = useState<ProfileBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    request<PropertyDiscoveryOptions>('/property-discovery/options')
      .then((data) => setCities(data.cities))
      .catch(() => setCities([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ state, page: String(page), pageSize: String(pageSize) });
    if (cityId) params.set('cityId', cityId);
    request<{ items: ProfileBooking[]; total: number }>(`/bookings?${params}`)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((error) => notify(error instanceof Error ? error.message : 'Unable to load bookings'))
      .finally(() => setLoading(false));
  }, [state, cityId, page]);

  const selectState = (value: TripState) => {
    setState(value);
    setPage(1);
  };

  const cancelBooking = async (booking: ProfileBooking) => {
    if (!window.confirm(copy.cancellationPrompt)) return;
    try {
      const result = await request<{ item: ProfileBooking }>(`/bookings/${booking.bookingId}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }),
      });
      setItems((current) => current.map((item) => item.bookingId === booking.bookingId ? { ...item, ...result.item } : item));
      setSelected((current) => current?.bookingId === booking.bookingId ? { ...current, ...result.item } : current);
      notify(copy.tripCancelled);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Unable to cancel booking');
    }
  };

  const tabs: Array<[TripState, string]> = [
    ['all', copy.all], ['upcoming', copy.upcoming], ['current', copy.current],
    ['past', copy.past], ['cancelled', copy.cancelled],
  ];
  const canCancel = (booking: ProfileBooking) =>
    !['cancelled', 'completed', 'rejected', 'refunded'].includes(booking.status);

  return (
    <section className="profile-workspace" aria-labelledby="trips-title">
      <div className="profile-section-title">
        <div><small>IMMOOVE</small><h2 id="trips-title">{copy.trips}</h2></div>
        <select value={cityId} onChange={(event) => { setCityId(event.target.value); setPage(1); }} aria-label={copy.allCities}>
          <option value="">{copy.allCities}</option>
          {cities.map((city) => <option key={city.cityId} value={city.cityId}>{city.name}</option>)}
        </select>
      </div>
      <div className="trip-tabs" role="tablist">
        {tabs.map(([value, label]) => (
          <button key={value} className={state === value ? 'active' : ''} onClick={() => selectState(value)}>{label}</button>
        ))}
      </div>
      {loading ? <div className="profile-empty">{copy.loadingTrips}</div> : items.length ? (
        <div className="trip-grid">
          {items.map((booking) => (
            <article className="trip-card" key={booking.bookingId}>
              <a className="trip-image" href={`/listings/${booking.listingId}`}>
                {booking.listing?.coverImageUrl ? (
                  <ResponsiveImage src={booking.listing.coverImageUrl} alt={booking.listing.title} width={540} height={300} sizes="(max-width: 700px) 100vw, 380px" />
                ) : <span>Immoove</span>}
                <b className={`trip-status status-${booking.status}`}>{booking.status}</b>
              </a>
              <div className="trip-copy">
                <small>{copy.booking} #{booking.bookingId}</small>
                <h3>{booking.listing?.title || `${copy.booking} #${booking.bookingId}`}</h3>
                {['pending', 'processing'].includes(booking.status) && <div className="trip-pending-message"><CalendarDays size={16} />{copy.pendingConfirmation}</div>}
                <p><MapPin size={15} /> {[booking.listing?.area?.name, booking.listing?.city?.name].filter(Boolean).join(', ')}</p>
                <p><CalendarDays size={15} /> {new Date(booking.startDate).toLocaleDateString(locale)} – {new Date(booking.endDate).toLocaleDateString(locale)}</p>
                {booking.listing?.guestCapacity && <p><UsersRound size={15} /> {booking.listing.guestCapacity} {copy.guests}</p>}
                <div className="trip-total"><span>{copy.total}</span><b>{booking.total.toLocaleString(locale)} {booking.currency}</b></div>
                <div className="trip-actions">
                  <button onClick={() => setSelected(booking)}>{copy.details}</button>
                  <a href={`/listings/${booking.listingId}`}>{copy.viewProperty}</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="profile-empty">{copy.noTrips}</div>}
      {total > pageSize && (
        <div className="trip-pagination">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} />{copy.previous}</button>
          <span>{copy.page} {page} / {Math.ceil(total / pageSize)}</span>
          <button disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>{copy.next}<ChevronRight size={16} /></button>
        </div>
      )}
      {selected && (
        <div className="profile-drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside className="profile-drawer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
            <button className="drawer-close" onClick={() => setSelected(null)} aria-label={copy.close}><X /></button>
            <small>{copy.booking} #{selected.bookingId}</small>
            <h2>{selected.listing?.title}</h2>
            <dl>
              <div><dt>{copy.current}</dt><dd>{selected.status}</dd></div>
              <div><dt>{copy.payment}</dt><dd>{selected.paymentStatus || 'unpaid'}</dd></div>
              <div><dt>{copy.total}</dt><dd>{selected.total.toLocaleString(locale)} {selected.currency}</dd></div>
              <div><dt>{copy.email}</dt><dd>{selected.email}</dd></div>
              <div><dt>{copy.phone}</dt><dd>{selected.phone}</dd></div>
            </dl>
            <a className="drawer-primary" href={`/listings/${selected.listingId}`}>{copy.viewProperty}</a>
            {selected.canReview && <a className="drawer-secondary" href={`/listings/${selected.listingId}#reviews`}>{copy.reviewStay}</a>}
            {canCancel(selected) && <button className="drawer-danger" onClick={() => void cancelBooking(selected)}>{copy.cancelBooking}</button>}
          </aside>
        </div>
      )}
    </section>
  );
}
