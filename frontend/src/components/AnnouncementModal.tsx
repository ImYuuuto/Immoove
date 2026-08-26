import { type ChangeEvent, type FormEvent, useState } from 'react';
import { ArrowUpRight, ImagePlus, X } from 'lucide-react';
import type { CategorySlug, ListingSubmission, PricingUnit } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import { categoryLabel } from '../categories/categoryLabels';
import { useAnnouncementCopy } from './announcementI18n';

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maximumImageSize = 5 * 1024 * 1024;
const initialData: ListingSubmission = { categorySlug: 'housing', title: '', description: '', locationName: '', mapUrl: '', basePrice: 0, pricingUnit: 'night', guestCapacity: undefined, contactName: '', contactPhone: '', contactEmail: '', images: [] };

export default function AnnouncementModal({ onClose, onMessage }: { onClose: () => void; onMessage: (message: string) => void }) {
  const { text, language } = useLanguage();
  const copy = useAnnouncementCopy();
  const [data, setData] = useState<ListingSubmission>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const update = <K extends keyof ListingSubmission>(key: K, value: ListingSubmission[K]) => setData((current) => ({ ...current, [key]: value }));

  const selectImages = (event: ChangeEvent<HTMLInputElement>) => {
    const images = Array.from(event.target.files || []);
    if (images.length > 8) { update('images', []); onMessage(copy.imageCount); event.target.value = ''; return; }
    if (images.some((image) => !acceptedTypes.has(image.type))) { update('images', []); onMessage(copy.imageType); event.target.value = ''; return; }
    if (images.some((image) => image.size > maximumImageSize)) { update('images', []); onMessage(copy.imageSize); event.target.value = ''; return; }
    update('images', images);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!data.images.length) { onMessage(copy.imageRequired); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('categorySlug', data.categorySlug);
      form.append('title', data.title);
      form.append('description', data.description);
      form.append('locationName', data.locationName);
      form.append('mapUrl', data.mapUrl);
      form.append('basePrice', String(data.basePrice));
      form.append('pricingUnit', data.pricingUnit);
      if (data.guestCapacity != null) form.append('guestCapacity', String(data.guestCapacity));
      form.append('contactName', data.contactName);
      form.append('contactPhone', data.contactPhone);
      form.append('contactEmail', data.contactEmail);
      data.images.forEach((image) => form.append('images', image));
      await request('/announcements/request', { method: 'POST', body: form });
      onMessage(text.announcementSent);
      onClose();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : text.announcementFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal announcement-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
    <button type="button" className="modal-close" onClick={onClose} aria-label={text.close}><X /></button>
    <small className="eyebrow">{text.joinBouzid}</small><h2>{text.publish}</h2><p>{text.publishText}</p>
    <label className="modal-field"><span>{copy.category}</span><select value={data.categorySlug} onChange={(event) => update('categorySlug', event.target.value as CategorySlug)}><option value="housing">{categoryLabel('housing', language, 'Housing')}</option><option value="services">{categoryLabel('services', language, 'Services')}</option><option value="hobbies-and-activities">{categoryLabel('hobbies-and-activities', language, 'Hobbies and activities')}</option><option value="renting-cars">{categoryLabel('renting-cars', language, 'Car rental')}</option></select></label>
    <label className="modal-field"><span>{copy.title}</span><input required minLength={3} maxLength={200} value={data.title} onChange={(event) => update('title', event.target.value)} /></label>
    <label className="modal-field"><span>{copy.description}</span><textarea required minLength={20} maxLength={5000} value={data.description} onChange={(event) => update('description', event.target.value)} /></label>
    <div className="auth-names"><label className="modal-field"><span>{copy.location}</span><input required minLength={2} maxLength={300} value={data.locationName} onChange={(event) => update('locationName', event.target.value)} /></label><label className="modal-field"><span>{copy.mapUrl}</span><input required type="url" pattern="https://.*" maxLength={2000} value={data.mapUrl} onChange={(event) => update('mapUrl', event.target.value)} /></label></div>
    <div className="auth-names"><label className="modal-field"><span>{copy.price}</span><input required type="number" min="0.01" max="10000000" step="0.01" value={data.basePrice || ''} onChange={(event) => update('basePrice', Number(event.target.value))} /></label><label className="modal-field"><span>{copy.pricingUnit}</span><select value={data.pricingUnit} onChange={(event) => update('pricingUnit', event.target.value as PricingUnit)}><option value="night">{copy.night}</option><option value="day">{copy.day}</option><option value="hour">{copy.hour}</option><option value="service">{copy.service}</option></select></label></div>
    <label className="modal-field"><span>{copy.capacity}</span><input type="number" min="1" max="1000" value={data.guestCapacity || ''} onChange={(event) => update('guestCapacity', event.target.value ? Number(event.target.value) : undefined)} /></label>
    <div className="auth-names"><label className="modal-field"><span>{copy.contactName}</span><input required minLength={2} maxLength={150} value={data.contactName} onChange={(event) => update('contactName', event.target.value)} /></label><label className="modal-field"><span>{copy.contactPhone}</span><input required type="tel" minLength={5} maxLength={50} value={data.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} /></label></div>
    <label className="modal-field"><span>{copy.contactEmail}</span><input required type="email" maxLength={320} value={data.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} /></label>
    <label className="image-upload"><ImagePlus size={20} /><span><b>{copy.images}</b><small>{copy.imageHelp}</small></span><input required type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectImages} /></label>
    {!!data.images.length && <small className="selected-images">{copy.selectedImages.replace('{count}', String(data.images.length))}</small>}
    <button className="light-button" type="submit" disabled={submitting}>{submitting ? copy.sending : copy.submit} <ArrowUpRight size={17} /></button>
  </form></div>;
}
