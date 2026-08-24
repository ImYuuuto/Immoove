import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Store, Users } from 'lucide-react';
import type { View } from '../types';

export function AdminSidebar({ view, setView, pendingListings, pendingAnnouncements, open, onNavigate, onLogout }: { view: View; setView: (view: View) => void; pendingListings: number; pendingAnnouncements: number; open: boolean; onNavigate: () => void; onLogout: () => void }) {
  const go = (next: View) => { setView(next); onNavigate(); };
  return <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}><div className="admin-brand"><span>B</span><div><b>Bouzid</b><small>ADMIN CONSOLE</small></div></div><nav>
    <button className={view === 'overview' ? 'active' : ''} onClick={() => go('overview')}><LayoutDashboard size={17} />Vue d’ensemble</button>
    <button className={view === 'listings' ? 'active' : ''} onClick={() => go('listings')}><Store size={17} />Annonces <i>{pendingListings}</i></button>
    <button className={view === 'announcements' ? 'active' : ''} onClick={() => go('announcements')}><ClipboardList size={17} />Demandes <i>{pendingAnnouncements}</i></button>
    <button className={view === 'bookings' ? 'active' : ''} onClick={() => go('bookings')}><CalendarDays size={17} />Réservations</button>
    <button className={view === 'users' ? 'active' : ''} onClick={() => go('users')}><Users size={17} />Utilisateurs</button>
  </nav><button className="admin-logout" onClick={onLogout}><LogOut size={17} />Se déconnecter</button></aside>;
}
