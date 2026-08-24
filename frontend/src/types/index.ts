export type ServiceType = 'VACATION_RENTAL' | 'CAR_RENTAL' | 'RESTAURANT_CAFE' | 'ACTIVITY';

export type Listing = { listingId?: number; title: string; description?: string; basePrice?: number; guestCapacity?: number; coverImageUrl?: string; images?: { url: string }[]; location?: { name: string } };
export type Post = { post_id?: number; title: string; excerpt?: string; category?: string; cover_image_url?: string };
export type SearchFilters = { check_in?: string; check_out?: string; guests?: string; service_type?: ServiceType | '' };
export type Announcement = { service_type: ServiceType; title: string; description: string; address: string; contact_phone: string };
export type AuthUser = { userId: number; role: string; email?: string };
export type Language = 'fr' | 'ar' | 'en';
