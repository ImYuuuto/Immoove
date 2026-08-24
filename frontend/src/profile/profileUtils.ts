import type { ProfileListing } from './types';

export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}****@${domain}`;
}

export function normalizeListing(value: Record<string, unknown>): ProfileListing {
  return {
    listingId: Number(value.listingId ?? value.listing_id),
    providerId: Number(value.providerId ?? value.provider_id) || undefined,
    title: String(value.title ?? ''),
    description: value.description ? String(value.description) : undefined,
    basePrice: Number(value.basePrice ?? value.base_price) || 0,
    guestCapacity: Number(value.guestCapacity ?? value.guest_capacity) || undefined,
    coverImageUrl: value.coverImageUrl ? String(value.coverImageUrl) : value.cover_image_url ? String(value.cover_image_url) : undefined,
    status: value.status as ProfileListing['status'],
    serviceType: (value.serviceType ?? value.service_type) as ProfileListing['serviceType'],
    createdAt: value.createdAt ? String(value.createdAt) : value.created_at ? String(value.created_at) : undefined,
  };
}
