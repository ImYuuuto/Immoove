import type { Listing, ServiceType, UserRole } from '../types';

export type ProfileUser = {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
};

export type ProfileSummary = {
  bookingCount: number;
  favoriteCount: number;
  listingCount: number;
  activeTripCount: number;
  nextBookingId: number | null;
};

export type TripState = 'all' | 'upcoming' | 'current' | 'past' | 'cancelled';

export type ProfileBooking = {
  bookingId: number;
  listingId: number;
  userId: number;
  startDate: string;
  endDate: string;
  total: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'pending' | 'processing' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'refunded';
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'refunded';
  currency: string;
  hasReview: boolean;
  canReview: boolean;
  listing: {
    title: string;
    coverImageUrl?: string | null;
    guestCapacity?: number | null;
    propertyType?: { name: string; slug: string } | null;
    area?: { areaId: number; name: string } | null;
    city?: { cityId: number; name: string } | null;
  } | null;
};

export type ProfileListing = Listing & {
  providerId?: number;
  status?: 'approved' | 'pending' | 'rejected';
  serviceType?: ServiceType;
  createdAt?: string;
};

export type ListingEdit = {
  title: string;
  description: string;
  basePrice: number;
  guestCapacity?: number;
};
