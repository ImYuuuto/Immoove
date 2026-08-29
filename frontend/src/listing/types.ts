import type { BookingContact, Listing } from '../types';

export type AvailabilityInterval = { startDate: string; endDate: string };
export type ListingOwner = { userId: number; firstName?: string; lastName?: string };
export type ListingReview = {
  reviewId: number;
  rating: number;
  comment?: string;
  createdAt: string;
  user: ListingOwner | null;
};

export type ListingDetail = Listing & {
  listingId: number;
  pricingUnit?: string;
  category?: { categoryId: number; name: string; slug: string };
  owner?: ListingOwner;
  amenities: Array<{ featureId: number; name: string }>;
  availability: AvailabilityInterval[];
  reviews: ListingReview[];
  rating: { average: number | null; count: number };
};

export type CheckoutProfile = BookingContact & { userId: number };
export type BookingMode = 'range' | 'hourly' | 'fixed';
