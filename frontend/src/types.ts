export type UserRole = "client" | "provider" | "moderator" | "admin";
export type ListingStatus = "pending" | "approved" | "rejected" | "archived";
export type BookingStatus = "pending" | "confirmed" | "declined" | "completed" | "cancelled";
export type PricingUnit = "per_night" | "per_day" | "per_hour" | "per_service";

export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  listingCount?: number;
  bookingCount?: number;
}

export interface Category {
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Location {
  locationId: number;
  cityName: string;
  country: string;
}

export interface ListingImage {
  imageId: number;
  url: string;
  alt?: string | null;
  sortOrder: number;
}

export interface Listing {
  listingId: number;
  providerId: number;
  categoryId: number;
  locationId: number;
  title: string;
  description?: string | null;
  basePrice: string | number;
  pricingUnit: PricingUnit;
  isActive: boolean;
  status: ListingStatus;
  coverImageUrl?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  category?: Category;
  location?: Location;
  images?: ListingImage[];
  features?: { feature: { name: string } }[];
  propertyDetails?: {
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    streetAddress: string;
  } | null;
  vehicleDetails?: {
    make: string;
    model: string;
    year: number;
    seats: number;
  } | null;
  availabilitySlots?: { startTime: string; endTime: string; isBooked: boolean }[];
  rating?: number | null;
  reviewCount?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Booking {
  bookingId: number;
  listingId: number;
  startDatetime: string;
  endDatetime: string;
  totalPrice: string | number;
  status: BookingStatus;
  guestName?: string | null;
  guestPhone?: string | null;
  guestCount?: number;
  message?: string | null;
  createdAt: string;
  listing?: {
    listingId?: number;
    title: string;
    pricingUnit: PricingUnit;
    category?: { name: string };
    location?: { cityName: string };
  };
  client?: Pick<User, "userId" | "firstName" | "lastName" | "email" | "phone">;
}

export interface ContactMessage {
  messageId: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
  listing?: { listingId: number; title: string } | null;
}

export interface AuditLog {
  auditId: number;
  action: string;
  entityType: string;
  entityId: number;
  reason?: string | null;
  createdAt: string;
  actor: Pick<User, "userId" | "firstName" | "lastName" | "email" | "role">;
}

export interface AdminOverview {
  pendingReservations: number;
  pendingListings: number;
  activeListings: number;
  users: number;
  unreadMessages: number;
}
