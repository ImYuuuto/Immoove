import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../i18n/language';

const labels = {
  fr: 'Retour en haut',
  en: 'Back to top',
  ar: 'العودة إلى الأعلى',
};

export default function ScrollToTopButton() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 500);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return <button type="button" className={`scroll-to-top${visible ? ' visible' : ''}`} onClick={scrollToTop} aria-label={labels[language]} title={labels[language]} aria-hidden={!visible} tabIndex={visible ? 0 : -1}><ArrowUp size={20} /></button>;
}
