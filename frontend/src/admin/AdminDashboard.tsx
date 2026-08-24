import { useMemo, useState } from 'react';
import { Menu, ShieldAlert, X } from 'lucide-react';
import './admin.css';
import './admin-polish.css';
import { api } from './api';
import { AdminSidebar } from './components/AdminSidebar';
import { AnnouncementsView, BookingsView, ListingsView, OverviewView, UsersView } from './components/AdminViews';
import { useAdminData } from './hooks/useAdminData';
import type { View } from './types';

const titles: Record<View, string> = { overview: 'Vue d’ensemble', listings: 'Annonces', announcements: 'Demandes de publication', bookings: 'Réservations', users: 'Utilisateurs' };

export default function AdminDashboard() {
  const [view, setView] = useState<View>('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const { user, users, userPagination, listings, announcements, bookings, error, loading, load, runAction, searchUsers, clearError } = useAdminData();
  const pendingListings = useMemo(() => listings.filter((item) => item.status === 'pending').length, [listings]);
  const pendingAnnouncements = useMemo(() => announcements.filter((item) => item.status === 'PENDING').length, [announcements]);

  const updateListing = (id: number, status: 'approved' | 'rejected') => runAction(() => api(`/listings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }));
  const editListing = (id: number, data: { title: string; basePrice: number }) => runAction(() => api(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
  const deleteListing = (id: number) => runAction(() => api(`/listings/${id}`, { method: 'DELETE' }));
  const updateAnnouncement = (id: number, status: 'APPROVED' | 'REJECTED') => runAction(() => api(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }));
  const updateRole = (id: number, role: 'user' | 'moderator') => runAction(() => api(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }));
  const createBooking = (data: Record<string, number | string>) => runAction(() => api('/bookings', { method: 'POST', body: JSON.stringify(data) }));
  const updateBooking = (id: number, data: Record<string, number | string>) => runAction(() => api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }));
  const deleteBooking = (id: number) => runAction(() => api(`/bookings/${id}`, { method: 'DELETE' }));
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => undefined); window.location.assign('/'); };

  if (loading) return <div className="admin-loading">Chargement de votre espace sécurisé...</div>;
  if (error && !user) return <div className="admin-denied"><ShieldAlert size={42} /><h1>Accès refusé</h1><p>{error}</p><a href="/">Retour à l’accueil</a></div>;

  return <div className="admin-shell">
    <AdminSidebar view={view} setView={setView} pendingListings={pendingListings} pendingAnnouncements={pendingAnnouncements} open={mobileNav} onNavigate={() => setMobileNav(false)} onLogout={logout} />
    <button className="admin-menu" onClick={() => setMobileNav((open) => !open)} aria-label="Menu administrateur"><Menu /></button>
    <main className="admin-main">
      <header className="admin-header"><div><small>BOUZID ESCAPES / ADMIN</small><h1>{titles[view]}</h1></div><div className="admin-user"><span>{user?.role}</span><b>Admin #{user?.userId}</b></div></header>
      {error && <div className="admin-error">{error}<button onClick={() => clearError()}><X size={15} /></button></div>}
      {view === 'overview' && <OverviewView listings={listings} announcements={announcements} bookings={bookings} onView={setView} />}
      {view === 'listings' && <ListingsView listings={listings} onStatus={updateListing} onUpdate={editListing} onDelete={deleteListing} onRefresh={() => void load()} />}
      {view === 'announcements' && <AnnouncementsView items={announcements} onStatus={updateAnnouncement} />}
      {view === 'bookings' && <BookingsView bookings={bookings} onCreate={createBooking} onUpdate={updateBooking} onDelete={deleteBooking} onRefresh={() => void load()} />}
      {view === 'users' && <UsersView users={users} pagination={userPagination} currentUserId={user?.userId} onSearch={searchUsers} onRole={updateRole} />}
    </main>
  </div>;
}
