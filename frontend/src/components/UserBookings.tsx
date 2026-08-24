import { useEffect, useState } from 'react';
import type { BookingDraft } from '../types';
import { request } from '../utils/request';

type Booking = BookingDraft & { bookingId: number; userId: number };

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);

  useEffect(() => {
    request<{ items: Booking[] }>('/bookings').then((data) => setBookings(data.items)).catch(() => setBookings([]));
  }, []);

  const showDetails = async (id: number) => {
    const result = await request<{ item: Booking }>(`/bookings/${id}`).catch(() => null);
    if (result) setSelected(result.item);
  };

  if (!bookings.length) return null;

  return <section className="section user-bookings"><Heading /><div className="user-booking-grid">{bookings.map((booking) => <article key={booking.bookingId}><small>RÉSERVATION #{booking.bookingId}</small><h3>Annonce #{booking.listingId}</h3><p>{new Date(booking.startDate).toLocaleDateString('fr-FR')} → {new Date(booking.endDate).toLocaleDateString('fr-FR')}</p><b>{Number(booking.total).toLocaleString('fr-FR')} MAD</b><button onClick={() => void showDetails(booking.bookingId)}>Voir le détail</button>{selected?.bookingId === booking.bookingId && <div className="booking-detail">Voyageur #{selected.userId}</div>}</article>)}</div></section>;
}

function Heading() { return <div className="section-heading"><div><small className="eyebrow">MON ESPACE</small><h2>Mes réservations<span>.</span></h2></div></div>; }
