export type View = 'overview' | 'analytics' | 'listings' | 'announcements' | 'bookings' | 'users' | 'audit';
export type User = { userId: number; role: string; accountStatus?: 'active' | 'suspended'; firstName?: string; lastName?: string; email?: string; phone?: string; createdAt?: string };
export type Listing = { listingId: number; title: string; status: string; isActive: boolean; serviceType?: string; basePrice: number; createdAt: string };
export type Announcement = { request_id: number; title: string; service_type: string; address: string; status: string; created_at: string; description?: string };
export type Booking = { bookingId: number; listingId: number; userId: number; startDate?: string; endDate?: string; total?: number; status?: 'confirmed' | 'cancelled' | 'completed' | 'refunded'; paymentStatus?: string; currency?: string };
export type ApiList<T> = { items: T[] };
export type Pagination = { total: number; page: number; limit: number; totalPages: number };
export type AdminOverview = {
  period: { days: number };
  kpis: { totalUsers: number; newUsers: number; activeListings: number; pendingListings: number; pendingRequests: number; bookings: number; grossBookingValue: number; cancellationRate: number };
  trend: Array<{ date: string; bookings: number; grossBookingValue: number }>;
  categories: Array<{ slug: string; name: string; listings: number; bookings: number; grossBookingValue: number }>;
  moderation: { open: number; overdue: number; oldestHours: number };
};
export type AuditEntry = { id: number; actorId?: number; action: string; entityType: string; entityId?: number; reason?: string; createdAt: string; actor?: { firstName?: string; lastName?: string; email?: string } | null };
