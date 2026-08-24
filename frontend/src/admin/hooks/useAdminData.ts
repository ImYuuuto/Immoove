import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { Announcement, ApiList, Booking, Listing, Pagination, User } from '../types';

export function useAdminData() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await api<{ user: User }>('/auth/session');
      if (!['ADMIN', 'admin'].includes(session.user.role)) throw new Error('Accès administrateur requis');
      setUser(session.user);
      const [listingData, announcementData, bookingData, userData] = await Promise.all([
        api<ApiList<Listing>>('/listings?limit=100'),
        api<ApiList<Announcement>>('/announcements'),
        api<ApiList<Booking>>('/bookings'),
        api<ApiList<User> & { pagination: Pagination }>('/users?limit=100'),
      ]);
      setListings(listingData.items);
      setAnnouncements(announcementData.items);
      setBookings(bookingData.items);
      setUsers(userData.items);
      setUserPagination(userData.pagination);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runAction = useCallback(async (action: () => Promise<unknown>) => {
    try { await action(); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible'); }
  }, [load]);

  const searchUsers = useCallback(async (search: string) => {
    try {
      const query = new URLSearchParams({ page: '1', limit: '100' });
      if (search.trim()) query.set('search', search.trim());
      const data = await api<ApiList<User> & { pagination: Pagination }>(`/users?${query}`);
      setUsers(data.items);
      setUserPagination(data.pagination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Recherche impossible');
    }
  }, []);

  return { user, users, userPagination, listings, announcements, bookings, error, loading, load, runAction, searchUsers, clearError: (_value?: string) => setError('') };
}
