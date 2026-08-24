import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Store, Users } from 'lucide-react';
import type { View } from '../types';
import { useAdminCopy } from '../adminI18n';

export function AdminSidebar({ view, setView, pendingListings, pendingAnnouncements, open, onNavigate, onLogout }: { view: View; setView: (view: View) => void; pendingListings: number; pendingAnnouncements: number; open: boolean; onNavigate: () => void; onLogout: () => void }) {
  const copy = useAdminCopy();
  const go = (next: View) => { setView(next); onNavigate(); };
  return <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}><div className="admin-brand"><span>B</span><div><b>Bouzid</b><small>{copy.console}</small></div></div><nav>
    <button className={view === 'overview' ? 'active' : ''} onClick={() => go('overview')}><LayoutDashboard size={17} />{copy.overview}</button>
    <button className={view === 'listings' ? 'active' : ''} onClick={() => go('listings')}><Store size={17} />{copy.listings} <i>{pendingListings}</i></button>
    <button className={view === 'announcements' ? 'active' : ''} onClick={() => go('announcements')}><ClipboardList size={17} />{copy.requests} <i>{pendingAnnouncements}</i></button>
    <button className={view === 'bookings' ? 'active' : ''} onClick={() => go('bookings')}><CalendarDays size={17} />{copy.bookings}</button>
    <button className={view === 'users' ? 'active' : ''} onClick={() => go('users')}><Users size={17} />{copy.users}</button>
  </nav><button className="admin-logout" onClick={onLogout}><LogOut size={17} />{copy.logout}</button></aside>;
}
