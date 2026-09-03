export type PropertyTypeSlug = 'apartment' | 'studio' | 'villa';
export type RentalTerm = 'short_term' | 'long_term' | 'both';
export type ServiceType = 'VACATION_RENTAL';
export type UserRole = 'CLIENT' | 'ADMIN';

export type Listing = {
  listingId?: number;
  providerId?: number;
  title: string;
  description?: string;
  basePrice?: number;
  pricingUnit?: string;
  serviceType?: ServiceType | string;
  guestCapacity?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  propertyType?: { propertyTypeId: number; name: string; slug: string };
  coverImageUrl?: string | null;
  images?: { url: string }[];
  amenities?: Array<{ featureId: number; name: string }>;
  location?: { name: string; lat?: number; lng?: number };
  locationText?: string | null;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: { average: number | null; count: number };
  createdAt?: string;
  status?: string;
  isActive?: boolean;
  archivedAt?: string | null;
  categorySlug?: string;
  category?: { slug?: string; name?: string };
};
export type SearchFilters = {
  city_id?: string;
  check_in?: string;
  check_out?: string;
  guests?: string;
  rental_term?: RentalTerm | '';
};
export type Announcement = {
  service_type: ServiceType;
  title: string;
  description: string;
  address: string;
  contact_phone: string;
};
export type PricingUnit = 'night' | 'month';
export type ListingSubmission = {
  propertyTypeSlug: PropertyTypeSlug;
  rentalTerm: RentalTerm;
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
  BookingContact & {
    bookingId: number;
    userId: number;
    total: number;
    status?:
      'pending' | 'processing' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'refunded';
  };
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
