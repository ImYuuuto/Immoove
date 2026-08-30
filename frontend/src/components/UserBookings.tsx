import { useEffect, useState } from 'react';
import type { BookingRecord } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';

type Booking = BookingRecord;

export default function UserBookings() {
  const { language, text } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    request<{ items: Booking[] }>('/bookings')
      .then((data) => setBookings(data.items))
      .catch(() => setBookings([]));
  }, []);

  const showDetails = async (id: number) => {
    const result = await request<{ item: Booking }>(`/bookings/${id}`).catch(() => null);
    if (result) setSelected(result.item);
  };

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm(text.cancelBookingConfirm)) return;
    try {
      const result = await request<{ item: Booking }>(`/bookings/${booking.bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      setBookings((items) =>
        items.map((item) =>
          item.bookingId === booking.bookingId
            ? { ...item, ...result.item, status: 'cancelled' }
            : item,
        ),
      );
      setSelected((item) =>
        item?.bookingId === booking.bookingId ? { ...item, status: 'cancelled' } : item,
      );
      setMessage(text.bookingCancelled);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : text.bookingCancelFailed);
    }
  };

  if (!bookings.length) return null;

  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <section className="section user-bookings">
      <div className="section-heading">
        <div>
          <small className="eyebrow">{text.mySpace}</small>
          <h2>
            {text.myBookings}
            <span>.</span>
          </h2>
        </div>
      </div>
      <div className="user-booking-grid">
        {bookings.map((booking) => (
          <article key={booking.bookingId}>
            <small>
              {text.booking} #{booking.bookingId}
            </small>
            <h3>
              {text.listing} #{booking.listingId}
            </h3>
            <p>
              {new Date(booking.startDate).toLocaleDateString(locale)} →{' '}
              {new Date(booking.endDate).toLocaleDateString(locale)}
            </p>
            <b>{Number(booking.total).toLocaleString(locale)} MAD</b>
            <div className="user-booking-actions">
              <button onClick={() => void showDetails(booking.bookingId)}>
                {text.viewDetails}
              </button>
              {!['cancelled', 'completed', 'rejected', 'refunded'].includes(
                booking.status || '',
              ) && (
                <button className="booking-cancel" onClick={() => void cancelBooking(booking)}>
                  {text.cancelBooking}
                </button>
              )}
            </div>
            {selected?.bookingId === booking.bookingId && (
              <div className="booking-detail">
                {text.traveler} #{selected.userId}
                {selected.status && <small>{selected.status}</small>}
              </div>
            )}
          </article>
        ))}
      </div>
      {message && <div className="toast">{message}</div>}
    </section>
  );
}
