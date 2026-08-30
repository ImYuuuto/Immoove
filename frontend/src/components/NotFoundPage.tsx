import { useEffect } from 'react';
import { ArrowLeft, Compass } from 'lucide-react';
import { useLanguage } from '../i18n/language';

const copy = {
  fr: {
    eyebrow: 'HORS DES SENTIERS',
    title: 'Cette adresse reste introuvable.',
    body: 'La page que vous cherchez a peut-être changé d’adresse, ou n’a jamais existé.',
    home: 'Retour à l’accueil',
    explore: 'Explorer les adresses',
    titleTag: 'Page introuvable — Immoove',
  },
  en: {
    eyebrow: 'OFF THE MAP',
    title: 'This address cannot be found.',
    body: 'The page you are looking for may have moved, or it may never have existed.',
    home: 'Back to home',
    explore: 'Explore our addresses',
    titleTag: 'Page not found — Immoove',
  },
  ar: {
    eyebrow: 'خارج الخريطة',
    title: 'لم نتمكن من العثور على هذا العنوان.',
    body: 'ربما انتقلت الصفحة التي تبحثون عنها إلى عنوان آخر، أو أنها لم تكن موجودة.',
    home: 'العودة إلى الرئيسية',
    explore: 'استكشفوا عناويننا',
    titleTag: 'الصفحة غير موجودة — Immoove',
  },
};

export default function NotFoundPage() {
  const { language } = useLanguage();
  const text = copy[language];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = text.titleTag;
    return () => {
      document.title = previousTitle;
    };
  }, [text.titleTag]);

  return (
    <main className="not-found-page">
      <header className="not-found-nav">
        <a className="brand" href="/" aria-label="Immoove">
          <b>B</b>
          immoove<span>.</span>
        </a>
        <a href="/categories">
          <Compass size={17} />
          {text.explore}
        </a>
      </header>

      <section className="not-found-content">
        <div className="not-found-number" aria-hidden="true">
          404
        </div>
        <div className="not-found-copy">
          <small>{text.eyebrow}</small>
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <div className="not-found-actions">
            <a className="not-found-primary" href="/">
              <ArrowLeft size={18} />
              {text.home}
            </a>
            <a className="not-found-secondary" href="/categories">
              {text.explore}
            </a>
          </div>
        </div>
      </section>

      <div className="not-found-horizon" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </main>
  );
}
