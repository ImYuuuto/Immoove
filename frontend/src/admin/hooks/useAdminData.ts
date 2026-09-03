import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type {
  AdminOverview,
  ApiList,
  AuditEntry,
  Booking,
  Listing,
  Pagination,
  Owner,
  User,
} from '../types';
import { useAdminCopy } from '../adminI18n';

export function useAdminData() {
  const copy = useAdminCopy();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerPagination, setOwnerPagination] = useState<Pagination | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [days, setDays] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await api<{ user: User }>('/auth/session');
      if (session.user.role !== 'ADMIN') throw new Error(copy.adminRequired);
      setUser(session.user);
      const [
        listingData,
        bookingData,
        userData,
        overviewData,
        auditData,
        ownerData,
      ] = await Promise.all([
        api<ApiList<Listing>>('/listings?limit=100'),
        api<ApiList<Booking>>('/bookings'),
        api<ApiList<User> & { pagination: Pagination }>('/users?page=1&limit=20'),
        api<AdminOverview>(`/admin/overview?days=${days}`),
        api<ApiList<AuditEntry>>('/admin/audit?limit=50'),
        api<ApiList<Owner> & { pagination: Pagination }>('/owners?page=1&limit=20'),
      ]);
      setListings(listingData.items);
      setBookings(bookingData.items);
      setUsers(userData.items);
      setUserPagination(userData.pagination);
      setOverview(overviewData);
      setAudit(auditData.items);
      setOwners(ownerData.items);
      setOwnerPagination(ownerData.pagination);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.dashboardFailed);
    } finally {
      setLoading(false);
    }
  }, [copy, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
        await load();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : copy.actionFailed);
      }
    },
    [copy, load],
  );

  const searchUsers = useCallback(
    async (search: string, page = 1) => {
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (search.trim()) query.set('search', search.trim());
        const data = await api<ApiList<User> & { pagination: Pagination }>(`/users?${query}`);
        setUsers(data.items);
        setUserPagination(data.pagination);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : copy.searchFailed);
      }
    },
    [copy],
  );
  const searchOwners = useCallback(async (search: string, page = 1) => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (search.trim()) query.set('search', search.trim());
      const data = await api<ApiList<Owner> & { pagination: Pagination }>(`/owners?${query}`);
      setOwners(data.items); setOwnerPagination(data.pagination);
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.searchFailed); }
  }, [copy]);

  return {
    user,
    users,
    userPagination,
    owners,
    ownerPagination,
    listings,
    bookings,
    overview,
    audit,
    days,
    setDays,
    error,
    loading,
    load,
    runAction,
    searchUsers,
    searchOwners,
    clearError: (_value?: string) => setError(''),
  };
}
