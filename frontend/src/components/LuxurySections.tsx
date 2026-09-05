import { useEffect, useRef } from 'react';
import { ArrowRight, CalendarCheck, CheckSquare, Headphones, Home, LockKeyhole, MapPin, Quote, ShieldCheck, Star, Tag } from 'lucide-react';
import { useLanguage } from '../i18n/language';

export function EditorialSection() {
  const { language, text } = useLanguage();
  const benefits = language === 'fr'
    ? ['Publiez facilement votre logement', 'Gérez vos réservations', 'Augmentez vos revenus']
    : language === 'ar'
      ? ['انشروا عقاركم بسهولة', 'دبّروا حجوزاتكم', 'طوّروا مداخيلكم']
      : ['List your property with ease', 'Manage your bookings', 'Grow your revenue'];
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () =>
      ref.current?.style.setProperty(
        '--shift',
        `${Math.max(-34, Math.min(34, -ref.current.getBoundingClientRect().top * 0.08))}px`,
      );
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="editorial-luxury" ref={ref}>
      <div className="editorial-photo" />
      <div className="editorial-content reveal">
        <small className="eyebrow">{text.editorialEyebrow}</small>
        <h2>
          {text.editorialLine1}
          <br />
          {text.editorialLine2}
          <span>.</span>
        </h2>
        <p>{text.editorialText}</p>
        <a href="/properties">{text.discoverCoast}</a>
        <ul className="editorial-benefits">
          {benefits.map((benefit, index) => {
            const Icon = [Home, CalendarCheck, CheckSquare][index];
            return <li key={benefit}><Icon aria-hidden="true" /><span>{benefit}</span></li>;
          })}
        </ul>
      </div>
    </section>
  );
}

export function TrustStrip() {
  const { language } = useLanguage();
  const copy = {
    fr: {
      eyebrow: 'Pourquoi nous choisir ?',
      title: 'Votre confiance, notre priorité',
      items: [
        ['Logements vérifiés', 'Tous nos logements sont soigneusement vérifiés.'],
        ['Réservation sécurisée', 'Réservez en toute sécurité sur notre plateforme.'],
        ['Support disponible', 'Notre équipe vous accompagne 7j/7.'],
        ['Prix transparents', 'Aucun frais caché, le meilleur prix garanti.'],
      ],
    },
    en: {
      eyebrow: 'Why choose us?',
      title: 'Your trust is our priority',
      items: [
        ['Verified properties', 'Every property is carefully reviewed.'],
        ['Secure booking', 'Book safely through our platform.'],
        ['Available support', 'Our team is here for you 7 days a week.'],
        ['Transparent pricing', 'No hidden fees, with the best price guaranteed.'],
      ],
    },
    ar: {
      eyebrow: 'لماذا تختاروننا؟',
      title: 'ثقتكم هي أولويتنا',
      items: [
        ['إقامات موثوقة', 'يتم التحقق من جميع الإقامات بعناية.'],
        ['حجز آمن', 'احجزوا بأمان عبر منصتنا.'],
        ['دعم متوفر', 'فريقنا رهن إشارتكم طوال أيام الأسبوع.'],
        ['أسعار واضحة', 'بدون رسوم مخفية وبأفضل سعر مضمون.'],
      ],
    },
  } as const;
  const text = copy[language];
  const icons = [ShieldCheck, LockKeyhole, Headphones, Tag];

  return (
    <section className="trust-strip" aria-labelledby="trust-strip-title">
      <header>
        <small>{text.eyebrow}</small>
        <h2 id="trust-strip-title"><span className="home-emoji" aria-hidden="true">🛡️</span>{text.title}</h2>
      </header>
      <div className="trust-strip-grid">
        {text.items.map(([title, description], index) => {
          const Icon = icons[index];
          return (
            <article key={title}>
              <Icon aria-hidden="true" />
              <div><h3>{title}</h3><p>{description}</p></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function WhyImmoove() {
  const { text } = useLanguage();
  return (
    <section className="map-luxury section">
        <div className="map-copy reveal">
          <small className="eyebrow">{text.mapEyebrow}</small>
          <h2 className="luxury-title">
            {text.mapLine1}
            <br />
            {text.mapLine2}
            <span>.</span>
          </h2>
          <p>{text.mapText}</p>
          <div className="map-legend">
            ● {text.apartments} &nbsp; ● {text.studios} &nbsp; ● {text.villas} &nbsp; ●{' '}
            {text.cities}
          </div>
        </div>
        <div className="local-map reveal">
          <span>{text.ocean}</span>
          <button className="pin p1">
            <MapPin /> {text.apartments}
          </button>
          <button className="pin p2">
            <MapPin /> {text.studios}
          </button>
          <button className="pin p3">
            <MapPin /> {text.villas}
          </button>
          <button className="pin p4">
            <MapPin /> {text.cities}
          </button>
        </div>
    </section>
  );
}

export function JourneySection() {
  const { language } = useLanguage();
  const copy = language === 'fr'
    ? { eyebrow: 'Votre prochaine escapade', title: 'Votre séjour commence ici', body: 'Des logements uniques, des villes inspirantes et des souvenirs inoubliables vous attendent.', action: 'Explorer les logements', stats: ['Voyageurs satisfaits', 'Logements disponibles', 'Destinations au Maroc', 'Taux de satisfaction'] }
    : language === 'ar'
      ? { eyebrow: 'رحلتكم القادمة', title: 'إقامتكم تبدأ هنا', body: 'إقامات فريدة ومدن ملهمة وذكريات لا تُنسى في انتظاركم.', action: 'استكشفوا الإقامات', stats: ['مسافرون سعداء', 'إقامات متاحة', 'وجهات في المغرب', 'نسبة الرضا'] }
      : { eyebrow: 'Your next escape', title: 'Your stay starts here', body: 'Unique homes, inspiring cities and unforgettable memories are waiting for you.', action: 'Explore properties', stats: ['Happy travellers', 'Available properties', 'Moroccan destinations', 'Satisfaction rate'] };
  const stats = [
    { value: '+10 000', label: copy.stats[0], icon: Home },
    { value: '+1 500', label: copy.stats[1], icon: CalendarCheck },
    { value: '+20', label: copy.stats[2], icon: MapPin },
    { value: '98%', label: copy.stats[3], icon: Star },
  ];
  return (
    <section className="journey-section">
      <div className="journey-copy reveal">
        <small><span className="home-emoji" aria-hidden="true">🧭</span>{copy.eyebrow}</small><h2>{copy.title}</h2><p>{copy.body}</p>
        <a href="/properties">{copy.action}<ArrowRight size={15} /></a>
      </div>
      <div className="journey-stats">
        {stats.map(({ value, label, icon: Icon }) => (
          <article key={label}><Icon aria-hidden="true" /><div><strong>{value}</strong><span>{label}</span></div></article>
        ))}
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const { language, text } = useLanguage();
  const intro = language === 'fr'
    ? { eyebrow: 'Avis de nos voyageurs', title: 'Ils ont séjourné avec nous', body: 'Découvrez les expériences de nos voyageurs à travers le Maroc.', all: 'Voir tous les avis' }
    : language === 'ar'
      ? { eyebrow: 'آراء مسافرينا', title: 'أقاموا معنا', body: 'اكتشفوا تجارب مسافرينا في مختلف أنحاء المغرب.', all: 'عرض جميع الآراء' }
      : { eyebrow: 'Guest reviews', title: 'They stayed with us', body: 'Discover our guests’ experiences across Morocco.', all: 'View all reviews' };
  const reviews = [
    { quote: text.testimonial1, name: 'Sophie Martin', city: 'Marrakech', initials: 'SM' },
    { quote: text.testimonial2, name: 'Youssef El Amrani', city: 'Agadir', initials: 'YA' },
    { quote: text.testimonial1, name: 'Camille Dupont', city: 'Casablanca', initials: 'CD' },
  ];
  const loopReviews = [...reviews, ...reviews];

  return (
    <section className="testimonials testimonials-showcase" aria-labelledby="testimonials-title">
      <div className="testimonials-intro">
        <small><span className="home-emoji" aria-hidden="true">💬</span>{intro.eyebrow}</small>
        <h2 id="testimonials-title">{intro.title}</h2>
        <p>{intro.body}</p>
        <a href="/properties">{intro.all} <span aria-hidden="true">→</span></a>
      </div>
      <div className="testimonials-track-wrapper">
        <div className="testimonials-track">
          {loopReviews.map((review, index) => (
            <figure key={`${review.name}-${index}`} aria-hidden={index >= reviews.length || undefined}>
              <div className="testimonial-stars" aria-label="5/5">★★★★★</div>
              <Quote className="testimonial-card-quote" aria-hidden="true" />
              <blockquote>“{review.quote}”</blockquote>
              <figcaption><span>{review.initials}</span><b>{review.name}<small>{review.city}</small></b></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Newsletter() {
  const { text } = useLanguage();
  return (
    <section className="newsletter section">
      <small className="eyebrow">{text.newsletterEyebrow}</small>
      <h2 className="luxury-title">
        {text.newsletterTitle}
        <span>.</span>
      </h2>
      <p>{text.newsletterText}</p>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="email" required aria-label={text.yourEmail} placeholder={text.yourEmail} />
        <button>{text.subscribe}</button>
      </form>
    </section>
  );
}
