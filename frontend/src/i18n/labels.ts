import type { Language } from '../types';

const serviceTypes: Record<Language, Record<string, string>> = {
  fr: {
    VACATION_RENTAL: 'Location de vacances',
  },
  en: {
    VACATION_RENTAL: 'Vacation rental',
  },
  ar: {
    VACATION_RENTAL: 'إقامة للعطلات',
  },
};

const roles: Record<Language, Record<string, string>> = {
  fr: { CLIENT: 'Utilisateur', ADMIN: 'Administrateur' },
  en: { CLIENT: 'User', ADMIN: 'Administrator' },
  ar: { CLIENT: 'مستخدم', ADMIN: 'مدير' },
};

export function serviceTypeLabel(
  value: string | null | undefined,
  language: Language,
  fallback: string,
) {
  if (!value) return fallback;
  return (
    serviceTypes[language][value.toUpperCase()] || value.replaceAll('_', ' ').toLocaleLowerCase()
  );
}

export function roleLabel(value: string | null | undefined, language: Language) {
  if (!value) return '';
  return roles[language][value] || value;
}
