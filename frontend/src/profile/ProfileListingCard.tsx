import { type FormEvent, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import type { ListingEdit, ProfileListing } from './types';
import { useLanguage } from '../i18n/language';
import { serviceTypeLabel } from '../i18n/labels';

export default function ProfileListingCard({ listing, onUpdate, onDelete, locale }: { listing: ProfileListing; onUpdate: (id: number, data: ListingEdit) => Promise<void>; onDelete: (id: number) => Promise<void>; locale: string }) {
  const { language, text } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ListingEdit>({ title: listing.title, description: listing.description || '', basePrice: Number(listing.basePrice || 0), guestCapacity: listing.guestCapacity });
  const submit = async (event: FormEvent) => { event.preventDefault(); await onUpdate(listing.listingId!, form); setEditing(false); };

  const status = listing.status || 'pending';
  const statusText = status === 'approved' ? text.approved : status === 'rejected' ? text.rejected : text.pending;
  return <article className="profile-listing-card"><div className="profile-listing-image">{listing.coverImageUrl ? <img src={listing.coverImageUrl} alt={listing.title} /> : <span>{listing.title.slice(0, 1)}</span>}<i className={`profile-status status-${status}`}>{statusText}</i></div>{editing ? <form className="profile-listing-form" onSubmit={submit}><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div><input required type="number" min="0" step="0.01" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: Number(event.target.value) })} /><input type="number" min="1" value={form.guestCapacity || ''} onChange={(event) => setForm({ ...form, guestCapacity: event.target.value ? Number(event.target.value) : undefined })} /></div><p>{text.editApprovalNote}</p><div className="profile-card-actions"><button type="submit">{text.sendApproval}</button><button type="button" className="quiet" onClick={() => setEditing(false)}><X size={15} />{text.cancel}</button></div></form> : <div className="profile-listing-copy"><small>{serviceTypeLabel(listing.serviceType, language, text.service)}</small><h3>{listing.title}</h3><p>{listing.description || text.noDescription}</p><b>{Number(listing.basePrice || 0).toLocaleString(locale)} MAD</b><div className="profile-card-actions"><button onClick={() => setEditing(true)}><Pencil size={15} />{text.modify}</button><button className="danger-link" onClick={() => void onDelete(listing.listingId!)}><Trash2 size={15} />{text.delete}</button></div></div>}</article>;
}
