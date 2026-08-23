export type ListingStatus = 'approved' | 'pending' | 'rejected';
export interface User {
  userId: number;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt: string;
}
export interface Category {
  categoryId: number;
  name: string;
  slug: string;
}
export interface Location {
  locationId: number;
  name: string;
  lat: number;
  lng: number;
}
export interface Listing {
  listingId: number;
  providerId: number;
  categoryId: number;
  locationId?: number;
  title: string;
  description?: string;
  basePrice: number;
  pricingUnit?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: ListingStatus;
  isActive: boolean;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  serviceType?: string;
  guestCapacity?: number;
  isFeatured?: boolean;
}
export interface AnnouncementRequest {
  requestId: number;
  requesterId?: number;
  serviceType: string;
  title: string;
  description?: string;
  address: string;
  contactPhone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}
export interface BlogPost {
  postId: number;
  slug: string;
  category: 'IDEAS_INSPIRATION' | 'WELLBEING_BALANCE';
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  publishedAt?: string;
}
export interface Favorite {
  userId: number;
  listingId: number;
  createdAt: string;
}
export interface ListingImage {
  id: number;
  listingId: number;
  url: string;
  sortOrder: number;
}
export interface BookingWithReview {
  bookingId: number;
  userId: number;
  startDate?: string;
  endDate?: string;
  total?: number;
  review?: { rating: number; comment?: string; createdAt: string } | null;
}
export interface Feature {
  featureId: number;
  name: string;
}
export interface ListingWithRelations extends Listing {
  images: ListingImage[];
  category?: Category;
  location?: Location;
  features: Feature[];
  bookings: BookingWithReview[];
  provider?: Pick<
    User,
    'userId' | 'firstName' | 'lastName' | 'email' | 'phone'
  >;
}
