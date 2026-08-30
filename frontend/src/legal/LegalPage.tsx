import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/language';
import { request } from '../utils/request';

type LegalDocument = {
  type: 'terms' | 'privacy';
  version: string;
  title: string;
  requestedLanguage: 'en' | 'fr' | 'ar';
  language: 'en' | 'fr' | 'ar';
  translationAvailable: boolean;
  effectiveAt: string | null;
  isDraft: boolean;
  content: string;
};

const messages = {
  en: {
    loading: 'Loading legal document…',
    fallback: 'This translation is not yet available. The English source is displayed.',
    draft: 'Draft — legal details must be completed before production.',
    back: 'Back to Immoove',
  },
  fr: {
    loading: 'Chargement du document juridique…',
    fallback: 'Cette traduction n’est pas encore disponible. La source anglaise est affichée.',
    draft:
      'Projet — les informations juridiques doivent être complétées avant la mise en production.',
    back: 'Retour à Immoove',
  },
  ar: {
    loading: 'جارٍ تحميل المستند القانوني…',
    fallback: 'هذه الترجمة غير متاحة بعد. يتم عرض المصدر الإنجليزي.',
    draft: 'مسودة — يجب استكمال المعلومات القانونية قبل الإطلاق الفعلي.',
    back: 'العودة إلى Immoove',
  },
};

export default function LegalPage({ type }: { type: 'terms' | 'privacy' }) {
  const { language } = useLanguage();
  const linkedLanguage = new URLSearchParams(window.location.search).get('language');
  const requestedLanguage =
    linkedLanguage === 'en' || linkedLanguage === 'fr' || linkedLanguage === 'ar'
      ? linkedLanguage
      : language;
  const copy = messages[requestedLanguage];
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setDocument(null);
    setError('');
    request<{ document: LegalDocument }>(`/legal/${type}?language=${requestedLanguage}`)
      .then((result) => setDocument(result.document))
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [requestedLanguage, type]);

  return (
    <main
      className="legal-page"
      lang={requestedLanguage}
      dir={requestedLanguage === 'ar' ? 'rtl' : 'ltr'}
    >
      <a className="legal-back" href="/">
        ← {copy.back}
      </a>
      {!document && !error && <p>{copy.loading}</p>}
      {error && <p role="alert">{error}</p>}
      {document && (
        <article>
          <header>
            <h1>{document.title}</h1>
            <span>v{document.version}</span>
          </header>
          {!document.translationAvailable && <p className="legal-warning">{copy.fallback}</p>}
          {document.isDraft && <p className="legal-warning">{copy.draft}</p>}
          <div className="legal-content">{document.content}</div>
        </article>
      )}
    </main>
  );
}
