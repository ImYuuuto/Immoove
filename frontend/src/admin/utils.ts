import { activeLanguage } from '../i18n/language';

export function formatDate(date?: string) {
  const locale = activeLanguage === 'ar' ? 'ar-MA' : activeLanguage === 'en' ? 'en-GB' : 'fr-FR';
  const missing = activeLanguage === 'ar' ? 'غير محدد' : activeLanguage === 'en' ? 'Not provided' : 'Non renseignée';
  return date
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date))
    : missing;
}
