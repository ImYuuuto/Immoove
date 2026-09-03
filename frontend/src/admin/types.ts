import type { UserRole } from '../types';

export type View =
  | 'overview'
  | 'analytics'
  | 'listings'
  | 'bookings'
  | 'users'
  | 'owners'
  | 'audit';
export type User = {
  userId: number;
  role: UserRole;
  accountStatus?: 'active' | 'suspended';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  createdAt?: string;
};
export type UserBookingDetail = {
  bookingId: number;
  listingId: number;
  listingTitle: string;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  isPrevious: boolean;
  review: { reviewId: number; rating: number; comment?: string | null; createdAt: string } | null;
};
export type UserDetail = User & {
  bookings: UserBookingDetail[];
  reviewCount: number;
  averageRating: number | null;
};
export type Owner = { ownerId: number; firstName: string; lastName: string; nationalIdCode: string; phone: string; email?: string | null; photoUrl?: string | null; createdAt: string; propertyCount: number };
export type OwnerDetail = Owner & { properties: Array<{ listingId: number; title: string; basePrice: number; contractNumber: string; contractDocumentUrl?: string | null; locationText?: string | null; mapUrl?: string | null; latitude?: number | null; longitude?: number | null; status: string; isActive: boolean; coverImageUrl?: string | null; propertyType?: string | null; createdAt: string }> };
export type Listing = {
  listingId: number;
  title: string;
  status: string;
  isActive: boolean;
  serviceType?: string;
  basePrice: number;
  createdAt: string;
};
export type Announcement = {
  request_id: number;
  title: string;
  service_type: string;
  address: string;
  status: string;
  created_at: string;
  description?: string;
};
export type Booking = {
  bookingId: number;
  listingId: number;
  userId: number;
  startDate?: string;
  endDate?: string;
  total?: number;
  status?: 'pending' | 'processing' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'refunded';
  paymentStatus?: string;
  currency?: string;
};
export type ApiList<T> = { items: T[] };
export type Pagination = { total: number; page: number; limit: number; totalPages: number };
export type AdminOverview = {
  period: { days: number };
  kpis: {
    totalUsers: number;
    newUsers: number;
    activeListings: number;
    pendingListings: number;
    pendingRequests: number;
    bookings: number;
    pendingBookings: number;
    grossBookingValue: number;
    cancellationRate: number;
  };
  trend: Array<{ date: string; bookings: number; grossBookingValue: number }>;
  categories: Array<{
    slug: string;
    name: string;
    listings: number;
    bookings: number;
    grossBookingValue: number;
  }>;
  moderation: { open: number; overdue: number; oldestHours: number };
};
export type AuditEntry = {
  id: number;
  actorId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  reason?: string;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; email?: string } | null;
};
export type ApprovalCase = {
  caseId: number;
  entityType: 'listing' | 'announcement' | 'booking';
  entityId: number;
  title: string;
  description?: string | null;
  entityStatus: string;
  coverImageUrl?: string | null;
  priority: string;
  status: 'open' | 'claimed' | 'escalated';
  dueAt?: string;
  createdAt: string;
};
