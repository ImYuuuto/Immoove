import type { Language } from '../types';

export function isRecentListing(dateString?: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export function formatPublicationDate(
  dateString?: string | null,
  language: Language = 'fr',
): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return null;

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';

  if (language === 'fr') {
    if (diffHours < 24) return "Publié aujourd'hui";
    if (diffDays === 1) return 'Publié hier';
    if (diffDays < 7) return `Publié il y a ${diffDays} jours`;
    if (diffWeeks === 1) return 'Publié il y a 1 semaine';
    if (diffWeeks < 4) return `Publié il y a ${diffWeeks} semaines`;
    return `Publié le ${date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }

  if (language === 'ar') {
    if (diffHours < 24) return 'نُشر اليوم';
    if (diffDays === 1) return 'نُشر بالأمس';
    if (diffDays < 7) return `نُشر منذ ${diffDays} أيام`;
    if (diffWeeks === 1) return 'نُشر منذ أسبوع';
    if (diffWeeks < 4) return `نُشر منذ ${diffWeeks} أسابيع`;
    return `نُشر في ${date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }

  // English fallback
  if (diffHours < 24) return 'Published today';
  if (diffDays === 1) return 'Published yesterday';
  if (diffDays < 7) return `Published ${diffDays} days ago`;
  if (diffWeeks === 1) return 'Published 1 week ago';
  if (diffWeeks < 4) return `Published ${diffWeeks} weeks ago`;
  return `Published on ${date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function newBadgeLabel(language: Language = 'fr'): string {
  if (language === 'ar') return 'جديد';
  if (language === 'en') return 'NEW';
  return 'Nouveau';
}
