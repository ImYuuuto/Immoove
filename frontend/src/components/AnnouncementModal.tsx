import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { ListingSubmission, ServiceType } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';

const initialData: ListingSubmission = { categoryId: 1, title: '', description: '', basePrice: 0, pricingUnit: 'night', serviceType: 'VACATION_RENTAL', guestCapacity: 1 };

export default function AnnouncementModal({ onClose, onMessage }: { onClose: () => void; onMessage: (message: string) => void }) {
  const { text } = useLanguage();
  const [data, setData] = useState(initialData);
  const update = <K extends keyof ListingSubmission>(key: K, value: ListingSubmission[K]) => setData((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await request('/listings', { method: 'POST', body: JSON.stringify(data) }); onMessage(text.announcementSent); onClose(); } catch (error) { onMessage(error instanceof Error ? error.message : text.announcementFailed); } };

  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <button type="button" className="modal-close" onClick={onClose} aria-label={text.close}><X /></button><small className="eyebrow">{text.joinBouzid}</small><h2>{text.publish}</h2><p>{text.publishText}</p>
    <select value={data.serviceType} onChange={(event) => update('serviceType', event.target.value as ServiceType)}><option value="VACATION_RENTAL">{text.stay}</option><option value="RESTAURANT_CAFE">{text.dining}</option><option value="ACTIVITY">{text.activities}</option><option value="CAR_RENTAL">{text.carRental}</option></select>
    <div className="auth-names"><input required type="number" min="1" placeholder={text.categoryId} value={data.categoryId} onChange={(event) => update('categoryId', Number(event.target.value))} /><input type="number" min="1" placeholder={text.locationId} value={data.locationId || ''} onChange={(event) => update('locationId', event.target.value ? Number(event.target.value) : undefined)} /></div>
    <input required placeholder={text.addressName} value={data.title} onChange={(event) => update('title', event.target.value)} />
    <div className="auth-names"><input required type="number" min="0" step="0.01" placeholder={text.price} value={data.basePrice || ''} onChange={(event) => update('basePrice', Number(event.target.value))} /><input type="number" min="1" placeholder={text.capacity} value={data.guestCapacity || ''} onChange={(event) => update('guestCapacity', Number(event.target.value))} /></div>
    <input placeholder={text.phone} value={data.contactPhone || ''} onChange={(event) => update('contactPhone', event.target.value)} /><input type="email" placeholder={text.contactEmail} value={data.contactEmail || ''} onChange={(event) => update('contactEmail', event.target.value)} /><input type="url" placeholder={text.imageUrl} value={data.coverImageUrl || ''} onChange={(event) => update('coverImageUrl', event.target.value)} /><textarea placeholder={text.describeActivity} value={data.description || ''} onChange={(event) => update('description', event.target.value)} />
    <button className="light-button" type="submit">{text.sendRequest} <ArrowUpRight size={17} /></button>
  </form></div>;
}
