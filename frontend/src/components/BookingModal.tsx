import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { BookingDraft, Listing } from '../types';
import { request } from '../utils/request';

export default function BookingModal({ listing, onClose, onMessage }: { listing: Listing; onClose: () => void; onMessage: (message: string) => void }) {
  const [data, setData] = useState<BookingDraft>({ listingId: listing.listingId!, startDate: '', endDate: '', total: Number(listing.basePrice || 0) });
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await request('/bookings', { method: 'POST', body: JSON.stringify(data) }); onMessage('Votre réservation est enregistrée.'); onClose(); } catch (error) { onMessage(error instanceof Error ? error.message : 'Réservation impossible.'); } };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button><small className="eyebrow">RÉSERVATION</small><h2>{listing.title}</h2><p>Choisissez votre période et confirmez le total.</p><div className="auth-names"><input required type="date" aria-label="Date de début" value={data.startDate} onChange={(event) => setData({ ...data, startDate: event.target.value })} /><input required type="date" aria-label="Date de fin" value={data.endDate} onChange={(event) => setData({ ...data, endDate: event.target.value })} /></div><input required type="number" min="0.01" step="0.01" placeholder="Total MAD" value={data.total || ''} onChange={(event) => setData({ ...data, total: Number(event.target.value) })} /><button className="light-button" type="submit">Réserver <ArrowUpRight size={17} /></button></form></div>;
}
