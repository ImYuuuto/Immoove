export type ServiceType = 'VACATION_RENTAL' | 'CAR_RENTAL' | 'RESTAURANT_CAFE' | 'ACTIVITY';
export type UserRole = 'CLIENT' | 'OWNER' | 'ADMIN';

export type Listing = {
  listingId?: number;
  providerId?: number;
  title: string;
  description?: string;
  basePrice?: number;
  pricingUnit?: string;
  serviceType?: ServiceType | string;
  guestCapacity?: number;
  coverImageUrl?: string | null;
  images?: { url: string }[];
  location?: { name: string };
  rating?: { average: number | null; count: number };
  createdAt?: string;
  status?: string;
  isActive?: boolean;
  archivedAt?: string | null;
  categorySlug?: string;
  category?: { slug?: string; name?: string };
};
export type Post = {
  post_id?: number;
  title: string;
  excerpt?: string;
  category?: string;
  cover_image_url?: string;
};
export type SearchFilters = {
  check_in?: string;
  check_out?: string;
  guests?: string;
  service_type?: ServiceType | '';
};
export type Announcement = {
  service_type: ServiceType;
  title: string;
  description: string;
  address: string;
  contact_phone: string;
};
export type CategorySlug = 'housing' | 'services' | 'hobbies-and-activities' | 'renting-cars';
export type PricingUnit = 'night' | 'day' | 'hour' | 'service';
export type ListingSubmission = {
  categorySlug: CategorySlug;
  title: string;
  description: string;
  locationName: string;
  mapUrl: string;
  basePrice: number;
  pricingUnit: PricingUnit;
  guestCapacity?: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images: File[];
};
export type BookingDraft = { listingId: number; startDate: string; endDate: string };
export type BookingContact = { firstName: string; lastName: string; email: string; phone: string };
export type BookingRecord = BookingDraft &
  BookingContact & { bookingId: number; userId: number; total: number };
export type AuthUser = {
  userId: number;
  role: UserRole;
  email?: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  requiresTermsAcceptance?: boolean;
};
export type Language = 'fr' | 'ar' | 'en';
