import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { activeLanguage, applyLanguage } from './i18n/language';
import './styles.css';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  isAdminRoute ? (
    <Suspense fallback={<div className="admin-loading">Chargement...</div>}>
      <AdminDashboard />
    </Suspense>
  ) : (
    <App />
  ),
);

if (!isAdminRoute) {
  window.setTimeout(() => applyLanguage(activeLanguage), 0);
}
