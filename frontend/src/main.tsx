import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { activeLanguage, applyLanguage } from './i18n/language';
import './styles.css';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const route = window.location.pathname.replace(/\/+$/, '');
const isAdminRoute = route === '/admin';
const isProfileRoute = route === '/profile';

createRoot(document.getElementById('root')!).render(
  isAdminRoute ? (
    <Suspense fallback={<div className="admin-loading">Chargement...</div>}>
      <AdminDashboard />
    </Suspense>
  ) : isProfileRoute ? (
    <Suspense fallback={<div className="profile-state">Chargement…</div>}>
      <ProfilePage />
    </Suspense>
  ) : (
    <App />
  ),
);

if (!isAdminRoute && !isProfileRoute) {
  window.setTimeout(() => applyLanguage(activeLanguage), 0);
}
