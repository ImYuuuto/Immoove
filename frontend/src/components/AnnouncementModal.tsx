import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { ListingSubmission, ServiceType } from '../types';
import { request } from '../utils/request';

const initialData: ListingSubmission = { categoryId: 1, title: '', description: '', basePrice: 0, pricingUnit: 'night', serviceType: 'VACATION_RENTAL', guestCapacity: 1 };

export default function AnnouncementModal({ onClose, onMessage }: { onClose: () => void; onMessage: (message: string) => void }) {
  const [data, setData] = useState(initialData);
  const update = <K extends keyof ListingSubmission>(key: K, value: ListingSubmission[K]) => setData((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await request('/listings', { method: 'POST', body: JSON.stringify(data) }); onMessage('Votre annonce a été envoyée pour validation.'); onClose(); } catch (error) { onMessage(error instanceof Error ? error.message : 'Impossible d’envoyer la demande.'); } };

  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button><small className="eyebrow">REJOINDRE BOUZID</small><h2>Publier une annonce</h2><p>Soumettez votre adresse. Elle sera publiée après validation.</p>
    <select value={data.serviceType} onChange={(event) => update('serviceType', event.target.value as ServiceType)}><option value="VACATION_RENTAL">Location de vacances</option><option value="RESTAURANT_CAFE">Restaurant ou café</option><option value="ACTIVITY">Activité</option><option value="CAR_RENTAL">Location de voiture</option></select>
    <div className="auth-names"><input required type="number" min="1" placeholder="ID catégorie" value={data.categoryId} onChange={(event) => update('categoryId', Number(event.target.value))} /><input type="number" min="1" placeholder="ID localisation" value={data.locationId || ''} onChange={(event) => update('locationId', event.target.value ? Number(event.target.value) : undefined)} /></div>
    <input required placeholder="Nom de votre adresse" value={data.title} onChange={(event) => update('title', event.target.value)} />
    <div className="auth-names"><input required type="number" min="0" step="0.01" placeholder="Prix" value={data.basePrice || ''} onChange={(event) => update('basePrice', Number(event.target.value))} /><input type="number" min="1" placeholder="Capacité" value={data.guestCapacity || ''} onChange={(event) => update('guestCapacity', Number(event.target.value))} /></div>
    <input placeholder="Téléphone" value={data.contactPhone || ''} onChange={(event) => update('contactPhone', event.target.value)} /><input type="email" placeholder="E-mail de contact" value={data.contactEmail || ''} onChange={(event) => update('contactEmail', event.target.value)} /><input type="url" placeholder="URL de l’image principale" value={data.coverImageUrl || ''} onChange={(event) => update('coverImageUrl', event.target.value)} /><textarea placeholder="Décrivez votre activité" value={data.description || ''} onChange={(event) => update('description', event.target.value)} />
    <button className="light-button" type="submit">Envoyer la demande <ArrowUpRight size={17} /></button>
  </form></div>;
}
