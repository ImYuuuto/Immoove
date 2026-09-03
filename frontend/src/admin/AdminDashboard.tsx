import { useState } from 'react';
import { Menu, ShieldAlert, X } from 'lucide-react';
import './admin.css';
import './admin-polish.css';
import { api } from './api';
import { AdminSidebar } from './components/AdminSidebar';
import {
  AdminAnalyticsView,
  AuditView,
  BookingsView,
  ListingsView,
  OverviewView,
  OwnersView,
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
    listings: copy.listings,
    bookings: copy.bookings,
    users: copy.users,
    owners: extra.owners,
    audit: extra.audit,
  };
  const [view, setView] = useState<View>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const {
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
    searchBookings,
    clearError,
  } = useAdminData();
  const editListing = (id: number, data: { title: string; basePrice: number }) =>
    runAction(() => api(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
  const deleteListing = (id: number) =>
    runAction(() => api(`/listings/${id}`, { method: 'DELETE' }));
  const createOwnerProperty = (data: FormData) => runAction(() => api('/owners/property', { method: 'POST', body: data }));
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
            <small>IMMOOVE / ADMIN</small>
            <h1>{titles[view]}</h1>
          </div>
          <div className="admin-header-account">
            <div className="admin-user">
              <span>{roleLabel(user?.role, language)}</span>
              <b>
                {copy.admin} #{user?.userId}
              </b>
            </div>
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
            bookings={bookings}
            overview={overview}
            onView={setView}
          />
        )}
        {view === 'analytics' && (
          <AdminAnalyticsView overview={overview} days={days} onDays={setDays} />
        )}
        {view === 'listings' && (
          <ListingsView
            listings={listings}
            onCreate={createOwnerProperty}
            onUpdate={editListing}
            onDelete={deleteListing}
            onRefresh={() => void load()}
          />
        )}
        {view === 'bookings' && (
          <BookingsView
            bookings={bookings}
            onCreate={createBooking}
            onUpdate={updateBooking}
            onDelete={deleteBooking}
            onRefresh={() => void load()}
            onSearch={searchBookings}
          />
        )}
        {view === 'users' && (
          <UsersView
            users={users}
            pagination={userPagination}
            currentUserId={user?.userId}
            onSearch={searchUsers}
            onStatus={updateUserStatus}
          />
        )}
        {view === 'owners' && <OwnersView owners={owners} pagination={ownerPagination} onSearch={searchOwners} />}
        {view === 'audit' && <AuditView items={audit} />}
      </main>
    </div>
  );
}
