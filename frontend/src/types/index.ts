export type ServiceType = 'VACATION_RENTAL' | 'CAR_RENTAL' | 'RESTAURANT_CAFE' | 'ACTIVITY';

export type Listing = { listingId?: number; title: string; description?: string; basePrice?: number; pricingUnit?: string; serviceType?: ServiceType | string; guestCapacity?: number; coverImageUrl?: string; images?: { url: string }[]; location?: { name: string } };
export type Post = { post_id?: number; title: string; excerpt?: string; category?: string; cover_image_url?: string };
export type SearchFilters = { check_in?: string; check_out?: string; guests?: string; service_type?: ServiceType | '' };
export type Announcement = { service_type: ServiceType; title: string; description: string; address: string; contact_phone: string };
export type ListingSubmission = { categoryId: number; locationId?: number; title: string; description?: string; basePrice: number; pricingUnit?: string; contactName?: string; contactPhone?: string; contactEmail?: string; coverImageUrl?: string; serviceType?: ServiceType; guestCapacity?: number };
export type BookingDraft = { listingId: number; startDate: string; endDate: string };
export type BookingContact = { firstName: string; lastName: string; email: string; phone: string };
export type BookingRecord = BookingDraft & BookingContact & { bookingId: number; userId: number; total: number };
export type AuthUser = { userId: number; role: string; email?: string; phone?: string | null; firstName?: string; lastName?: string; avatarUrl?: string | null };
export type Language = 'fr' | 'ar' | 'en';
