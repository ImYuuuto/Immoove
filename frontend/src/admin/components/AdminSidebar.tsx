import {
  Activity,
  CalendarDays,
  FileClock,
  LayoutDashboard,
  LogOut,
  UserRound,
  Store,
  Users,
} from 'lucide-react';
import type { View } from '../types';
import { useAdminCopy } from '../adminI18n';
import { useAdminExtraCopy } from '../adminExtraI18n';

export function AdminSidebar({
  view,
  setView,
  open,
  onNavigate,
  onLogout,
}: {
  view: View;
  setView: (view: View) => void;
  open: boolean;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const go = (next: View) => {
    setView(next);
    onNavigate();
  };
  return (
    <aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}>
      <div className="admin-brand">
        <span>B</span>
        <div>
          <b>Immoove</b>
          <small>{copy.console}</small>
        </div>
      </div>
      <nav>
        <button className={view === 'overview' ? 'active' : ''} onClick={() => go('overview')}>
          <LayoutDashboard size={17} />
          {copy.overview}
        </button>
        <button className={view === 'analytics' ? 'active' : ''} onClick={() => go('analytics')}>
          <Activity size={17} />
          {extra.analytics}
        </button>
        <button className={view === 'listings' ? 'active' : ''} onClick={() => go('listings')}>
          <Store size={17} />
          {copy.listings}
        </button>
        <button className={view === 'bookings' ? 'active' : ''} onClick={() => go('bookings')}>
          <CalendarDays size={17} />
          {copy.bookings}
        </button>
        <button className={view === 'users' ? 'active' : ''} onClick={() => go('users')}>
          <Users size={17} />
          {copy.users}
        </button>
        <button className={view === 'audit' ? 'active' : ''} onClick={() => go('audit')}>
          <FileClock size={17} />
          {extra.audit}
        </button>
      </nav>
      <div className="admin-account-actions">
        <a className="admin-profile-link" href="/profile">
          <UserRound size={17} />
          {copy.backProfile}
        </a>
        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={17} />
          {copy.logout}
        </button>
      </div>
    </aside>
  );
}
