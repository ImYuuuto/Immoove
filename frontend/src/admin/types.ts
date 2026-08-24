export type View = 'overview' | 'listings' | 'announcements' | 'bookings' | 'users';
export type User = { userId: number; role: string; firstName?: string; lastName?: string; email?: string; phone?: string; createdAt?: string };
export type Listing = { listingId: number; title: string; status: string; isActive: boolean; serviceType?: string; basePrice: number; createdAt: string };
export type Announcement = { request_id: number; title: string; service_type: string; address: string; status: string; created_at: string; description?: string };
export type Booking = { bookingId: number; listingId: number; userId: number; startDate?: string; endDate?: string; total?: number };
export type ApiList<T> = { items: T[] };
export type Pagination = { total: number; page: number; limit: number; totalPages: number };
