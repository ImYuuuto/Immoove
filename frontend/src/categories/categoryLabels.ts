import type { Language } from '../types';

const labels: Record<Language, Record<string, string>> = {
  fr: {
    housing: 'Hébergement',
    services: 'Services',
    'hobbies-and-activities': 'Loisirs et activités',
    'renting-cars': 'Location de voitures',
  },
  en: {
    housing: 'Housing',
    services: 'Services',
    'hobbies-and-activities': 'Hobbies and activities',
    'renting-cars': 'Car rental',
  },
  ar: {
    housing: 'الإقامة',
    services: 'الخدمات',
    'hobbies-and-activities': 'الهوايات والأنشطة',
    'renting-cars': 'تأجير السيارات',
  },
};

export function categoryLabel(slug: string, language: Language, fallback: string) {
  return labels[language][slug] || fallback;
}
