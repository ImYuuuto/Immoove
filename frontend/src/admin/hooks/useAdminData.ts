import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type {
  AdminOverview,
  ApprovalCase,
  Announcement,
  ApiList,
  AuditEntry,
  Booking,
  Listing,
  Pagination,
  User,
} from '../types';
import { useAdminCopy } from '../adminI18n';

export function useAdminData() {
  const copy = useAdminCopy();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<Pagination | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [approvals, setApprovals] = useState<ApprovalCase[]>([]);
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
        announcementData,
        bookingData,
        userData,
        overviewData,
        auditData,
        approvalData,
      ] = await Promise.all([
        api<ApiList<Listing>>('/listings?limit=100'),
        api<ApiList<Announcement>>('/announcements'),
        api<ApiList<Booking>>('/bookings'),
        api<ApiList<User> & { pagination: Pagination }>('/users?limit=100'),
        api<AdminOverview>(`/admin/overview?days=${days}`),
        api<ApiList<AuditEntry>>('/admin/audit?limit=50'),
        api<ApiList<ApprovalCase>>('/admin/approvals?scope=all&limit=100'),
      ]);
      setListings(listingData.items);
      setAnnouncements(announcementData.items);
      setBookings(bookingData.items);
      setUsers(userData.items);
      setUserPagination(userData.pagination);
      setOverview(overviewData);
      setAudit(auditData.items);
      setApprovals(approvalData.items);
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
    async (search: string) => {
      try {
        const query = new URLSearchParams({ page: '1', limit: '100' });
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

  return {
    user,
    users,
    userPagination,
    listings,
    announcements,
    bookings,
    overview,
    audit,
    approvals,
    days,
    setDays,
    error,
    loading,
    load,
    runAction,
    searchUsers,
    clearError: (_value?: string) => setError(''),
  };
}
