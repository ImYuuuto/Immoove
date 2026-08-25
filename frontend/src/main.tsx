import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { activeLanguage, applyLanguage, languageText } from './i18n/language';
import './styles.css';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const ListingPage = lazy(() => import('./listing/ListingPage'));
const CheckoutPage = lazy(() => import('./listing/CheckoutPage'));
const CategoryPage = lazy(() => import('./categories/CategoryPage'));
const CategoriesPage = lazy(() => import('./categories/CategoriesPage'));
const route = window.location.pathname.replace(/\/+$/, '');
const isAdminRoute = route === '/admin';
const isProfileRoute = route === '/profile';
const listingMatch = route.match(/^\/listings?\/(\d+)$/);
const checkoutMatch = route.match(/^\/checkout\/(\d+)$/);
const categoryMatch = route.match(/^\/categories\/([a-z0-9-]+)$/);
const isCategoriesRoute = route === '/categories';

createRoot(document.getElementById('root')!).render(
  isAdminRoute ? (
    <Suspense fallback={<div className="admin-loading">{languageText().loading}</div>}>
      <AdminDashboard />
    </Suspense>
  ) : isProfileRoute ? (
    <Suspense fallback={<div className="profile-state">{languageText().loading}</div>}>
      <ProfilePage />
    </Suspense>
  ) : listingMatch ? (
    <Suspense fallback={<div className="listing-state">{languageText().loading}</div>}>
      <ListingPage listingId={Number(listingMatch[1])} />
    </Suspense>
  ) : checkoutMatch ? (
    <Suspense fallback={<div className="listing-state">{languageText().loading}</div>}>
      <CheckoutPage listingId={Number(checkoutMatch[1])} />
    </Suspense>
  ) : isCategoriesRoute ? (
    <Suspense fallback={<div className="category-state">{languageText().loading}</div>}>
      <CategoriesPage />
    </Suspense>
  ) : categoryMatch ? (
    <Suspense fallback={<div className="category-state">{languageText().loading}</div>}>
      <CategoryPage slug={categoryMatch[1]} />
    </Suspense>
  ) : (
    <App />
  ),
);

if (!isAdminRoute && !isProfileRoute) {
  window.setTimeout(() => applyLanguage(activeLanguage), 0);
}
