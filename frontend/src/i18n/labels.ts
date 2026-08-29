import type { Language } from '../types';

const serviceTypes: Record<Language, Record<string, string>> = {
  fr: {
    VACATION_RENTAL: 'Location de vacances',
    CAR_RENTAL: 'Location de voiture',
    RESTAURANT_CAFE: 'Restaurant et café',
    ACTIVITY: 'Activité',
  },
  en: {
    VACATION_RENTAL: 'Vacation rental',
    CAR_RENTAL: 'Car rental',
    RESTAURANT_CAFE: 'Restaurant and café',
    ACTIVITY: 'Activity',
  },
  ar: {
    VACATION_RENTAL: 'إقامة للعطلات',
    CAR_RENTAL: 'تأجير السيارات',
    RESTAURANT_CAFE: 'مطعم ومقهى',
    ACTIVITY: 'نشاط',
  },
};

const roles: Record<Language, Record<string, string>> = {
  fr: { user: 'Utilisateur', moderator: 'Modérateur', staff: 'Équipe', admin: 'Administrateur' },
  en: { user: 'User', moderator: 'Moderator', staff: 'Staff', admin: 'Administrator' },
  ar: { user: 'مستخدم', moderator: 'مشرف', staff: 'فريق الإشراف', admin: 'مدير' },
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
  return roles[language][value.toLowerCase()] || value;
}
