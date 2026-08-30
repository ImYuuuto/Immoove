import { useMemo, useState } from 'react';
import { Menu, ShieldAlert, X } from 'lucide-react';
import './admin.css';
import './admin-polish.css';
import { api } from './api';
import { AdminSidebar } from './components/AdminSidebar';
import {
  AdminAnalyticsView,
  ApprovalsView,
  AnnouncementsView,
  AuditView,
  BookingsView,
  ListingsView,
  OverviewView,
  UsersView,
} from './components/AdminViews';
import { useAdminData } from './hooks/useAdminData';
import type { View } from './types';
import { useAdminCopy } from './adminI18n';
import { useAdminExtraCopy } from './adminExtraI18n';
import { roleLabel } from '../i18n/labels';
import { useLanguage } from '../i18n/language';

export default function AdminDashboard() {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const titles: Record<View, string> = {
    overview: copy.overview,
    analytics: extra.analytics,
    approvals: copy.approvals,
    listings: copy.listings,
    announcements: copy.publicationRequests,
    bookings: copy.bookings,
    users: copy.users,
    audit: extra.audit,
  };
  const [view, setView] = useState<View>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const {
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
    clearError,
  } = useAdminData();
  const pendingListings = useMemo(
    () => listings.filter((item) => item.status === 'pending').length,
    [listings],
  );
  const pendingAnnouncements = useMemo(
    () => announcements.filter((item) => item.status === 'ESCALATED').length,
    [announcements],
  );
  const decideApproval = (id: number, decision: 'approved' | 'rejected' | 'changes_requested') =>
    runAction(() =>
      api(`/admin/approvals/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reasonCode: decision === 'approved' ? 'admin_approved' : 'admin_review',
          note: decision === 'approved' ? undefined : 'Reviewed by an administrator',
        }),
      }),
    );
  const decideBooking = (id: number, status: 'processing' | 'confirmed' | 'rejected') =>
    runAction(() =>
      api(`/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(status === 'rejected' ? { reason: 'Rejected by an administrator' } : {}),
        }),
      }),
    );
  const editListing = (id: number, data: { title: string; basePrice: number }) =>
    runAction(() => api(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
  const deleteListing = (id: number) =>
    runAction(() => api(`/listings/${id}`, { method: 'DELETE' }));
  const approveAnnouncement = (id: number) =>
    runAction(() =>
      api(`/announcements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED', reason: 'Approved for publication' }),
      }),
    );
  const updateRole = (id: number, role: 'CLIENT' | 'OWNER') =>
    runAction(() => api(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }));
  const updateUserStatus = (id: number, status: 'active' | 'suspended') =>
    runAction(() =>
      api(`/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: 'Administrator dashboard action' }),
      }),
    );
  const createBooking = (data: Record<string, number | string>) =>
    runAction(() => api('/bookings', { method: 'POST', body: JSON.stringify(data) }));
  const updateBooking = (id: number, data: Record<string, number | string>) =>
    runAction(() => api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
  const deleteBooking = (id: number) =>
    runAction(() => api(`/bookings/${id}`, { method: 'DELETE' }));
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/');
  };

  if (loading) return <div className="admin-loading">{copy.loading}</div>;
  if (error && !user)
    return (
      <div className="admin-denied">
        <ShieldAlert size={42} />
        <h1>{copy.denied}</h1>
        <p>{error}</p>
        <a href="/">{copy.backHome}</a>
      </div>
    );

  return (
    <div className="admin-shell">
      <AdminSidebar
        view={view}
        setView={setView}
        pendingListings={pendingListings}
        pendingAnnouncements={pendingAnnouncements}
        pendingApprovals={approvals.length}
        open={mobileNav}
        onNavigate={() => setMobileNav(false)}
        onLogout={logout}
      />
      <button
        className="admin-menu"
        onClick={() => setMobileNav((open) => !open)}
        aria-label={copy.menu}
      >
        <Menu />
      </button>
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <small>BOUZID ESCAPES / ADMIN</small>
            <h1>{titles[view]}</h1>
          </div>
          <div className="admin-user">
            <span>{roleLabel(user?.role, language)}</span>
            <b>
              {copy.admin} #{user?.userId}
            </b>
          </div>
        </header>
        {error && (
          <div className="admin-error">
            {error}
            <button onClick={() => clearError()}>
              <X size={15} />
            </button>
          </div>
        )}
        {view === 'overview' && (
          <OverviewView
            listings={listings}
            announcements={announcements}
            bookings={bookings}
            overview={overview}
            onView={setView}
          />
        )}
        {view === 'analytics' && (
          <AdminAnalyticsView overview={overview} days={days} onDays={setDays} />
        )}
        {view === 'approvals' && (
          <ApprovalsView
            items={approvals}
            onDecision={decideApproval}
            onBookingDecision={decideBooking}
            onFinalPublication={approveAnnouncement}
          />
        )}
        {view === 'listings' && (
          <ListingsView
            listings={listings}
            onUpdate={editListing}
            onDelete={deleteListing}
            onRefresh={() => void load()}
          />
        )}
        {view === 'announcements' && (
          <AnnouncementsView items={announcements} onApprove={approveAnnouncement} />
        )}
        {view === 'bookings' && (
          <BookingsView
            bookings={bookings}
            onCreate={createBooking}
            onUpdate={updateBooking}
            onDelete={deleteBooking}
            onRefresh={() => void load()}
          />
        )}
        {view === 'users' && (
          <UsersView
            users={users}
            pagination={userPagination}
            currentUserId={user?.userId}
            onSearch={searchUsers}
            onRole={updateRole}
            onStatus={updateUserStatus}
          />
        )}
        {view === 'audit' && <AuditView items={audit} />}
      </main>
    </div>
  );
}
