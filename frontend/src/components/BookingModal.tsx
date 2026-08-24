import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { BookingDraft, BookingRecord, Listing } from '../types';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';

export default function BookingModal({ listing, onClose, onMessage }: { listing: Listing; onClose: () => void; onMessage: (message: string) => void }) {
  const [data, setData] = useState<BookingDraft>({ listingId: listing.listingId!, startDate: '', endDate: '' });
  const submit = async (event: FormEvent) => { event.preventDefault(); try { const result = await request<{ item: BookingRecord }>('/bookings', { method: 'POST', body: JSON.stringify(data) }); onMessage(`Votre réservation est enregistrée pour ${Number(result.item.total).toLocaleString('fr-FR')} MAD.`); onClose(); } catch (error) { onMessage(error instanceof Error ? error.message : 'Réservation impossible.'); } };
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button><small className="eyebrow">RÉSERVATION</small><h2>{decodeText(listing.title)}</h2><p>Choisissez votre période. Le prix final sera calculé par le serveur.</p><div className="auth-names"><input required type="date" aria-label="Date de début" value={data.startDate} onChange={(event) => setData({ ...data, startDate: event.target.value })} /><input required type="date" aria-label="Date de fin" value={data.endDate} onChange={(event) => setData({ ...data, endDate: event.target.value })} /></div>{listing.basePrice != null && <p>Estimation indicative : {Number(listing.basePrice).toLocaleString('fr-FR')} MAD par nuit.</p>}<button className="light-button" type="submit">Réserver <ArrowUpRight size={17} /></button></form></div>;
}
