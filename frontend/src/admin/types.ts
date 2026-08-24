export type View = 'overview' | 'listings' | 'announcements' | 'bookings';
export type User = { userId: number; role: string };
export type Listing = { listingId: number; title: string; status: string; isActive: boolean; serviceType?: string; basePrice: number; createdAt: string };
export type Announcement = { request_id: number; title: string; service_type: string; address: string; status: string; created_at: string; description?: string };
export type Booking = { bookingId: number; listingId: number; userId: number; startDate?: string; endDate?: string; total?: number };
export type ApiList<T> = { items: T[] };
