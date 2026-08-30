import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import ScrollToTopButton from './components/ScrollToTopButton';
import TermsAcceptanceGate from './legal/TermsAcceptanceGate';
import { activeLanguage, applyLanguage, languageText } from './i18n/language';
import './styles.css';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const OwnerDashboard = lazy(() => import('./owner/OwnerDashboard'));
const ProfilePage = lazy(() => import('./profile/ProfilePage'));
const ListingPage = lazy(() => import('./listing/ListingPage'));
const CheckoutPage = lazy(() => import('./listing/CheckoutPage'));
const CategoriesPage = lazy(() => import('./categories/CategoriesPage'));
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
const LegalPage = lazy(() => import('./legal/LegalPage'));

if (window.location.hash) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

let route = window.location.pathname.replace(/\/+$/, '');
const legacyListing = route.match(/^\/categories\/[a-z0-9-]+\/listing\/(\d+)$/);
if (legacyListing) {
  route = `/listings/${legacyListing[1]}`;
  window.history.replaceState(null, '', `${route}${window.location.search}`);
} else if (route === '/categories' || /^\/categories\/[a-z0-9-]+$/.test(route)) {
  route = '/properties';
  window.history.replaceState(null, '', `${route}${window.location.search}`);
}
const isAdminRoute = route === '/admin';
const isOwnerRoute = route === '/owner';
const isProfileRoute = route === '/profile';
const listingMatch = route.match(/^\/listings?\/(\d+)$/);
const checkoutMatch = route.match(/^\/checkout\/(\d+)$/);
const propertyMatch = route.match(/^\/properties\/(apartments|villas|houses|riads|other-stays)$/);
const isPropertiesRoute = route === '/properties';
const isHomeRoute = route === '' || route === '/';
const legalMatch = route.match(/^\/(terms|privacy)$/);

createRoot(document.getElementById('root')!).render(
  <>
    {legalMatch ? (
      <Suspense fallback={<div className="not-found-loading">{languageText().loading}</div>}>
        <LegalPage type={legalMatch[1] as 'terms' | 'privacy'} />
      </Suspense>
    ) : isAdminRoute ? (
      <Suspense fallback={<div className="admin-loading">{languageText().loading}</div>}>
        <AdminDashboard />
      </Suspense>
    ) : isOwnerRoute ? (
      <Suspense fallback={<div className="owner-state">{languageText().loading}</div>}>
        <OwnerDashboard />
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
    ) : isPropertiesRoute || propertyMatch ? (
      <Suspense fallback={<div className="category-state">{languageText().loading}</div>}>
        <CategoriesPage propertyPath={propertyMatch?.[1]} />
      </Suspense>
    ) : isHomeRoute ? (
      <App />
    ) : (
      <Suspense fallback={<div className="not-found-loading">{languageText().loading}</div>}>
        <NotFoundPage />
      </Suspense>
    )}
    <TermsAcceptanceGate />
    <ScrollToTopButton />
  </>,
);

if (!isAdminRoute && !isOwnerRoute && !isProfileRoute) {
  window.setTimeout(() => applyLanguage(activeLanguage), 0);
}
