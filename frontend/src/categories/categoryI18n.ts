import { useLanguage } from '../i18n/language';

const fr = {
  back: 'Retour à l’accueil', eyebrow: 'CATÉGORIE', listings: 'adresses', loading: 'Chargement des adresses…', unavailable: 'Impossible de charger cette catégorie.', retry: 'Réessayer', empty: 'Aucune adresse dans cette catégorie pour le moment.', previous: 'Précédent', next: 'Suivant', page: 'Page {page} sur {total}',
};
type Copy = { [K in keyof typeof fr]: string };
const en: Copy = { back: 'Back to home', eyebrow: 'CATEGORY', listings: 'listings', loading: 'Loading listings…', unavailable: 'Unable to load this category.', retry: 'Try again', empty: 'There are no listings in this category yet.', previous: 'Previous', next: 'Next', page: 'Page {page} of {total}' };
const ar: Copy = { back: 'العودة إلى الرئيسية', eyebrow: 'الفئة', listings: 'إعلانات', loading: 'جارٍ تحميل الإعلانات…', unavailable: 'تعذر تحميل هذه الفئة.', retry: 'حاولوا مجدداً', empty: 'لا توجد إعلانات في هذه الفئة حالياً.', previous: 'السابق', next: 'التالي', page: 'الصفحة {page} من {total}' };

export function useCategoryCopy() {
  const { language } = useLanguage();
  return language === 'ar' ? ar : language === 'en' ? en : fr;
}
