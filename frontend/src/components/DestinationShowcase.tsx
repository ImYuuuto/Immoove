import { ArrowRight, Heart, House } from 'lucide-react';
import { useLanguage } from '../i18n/language';

const copy = {
  fr: {
    eyebrow: 'Destinations populaires',
    title: 'Explorez les plus belles destinations du Maroc',
    subtitle: 'Des villes uniques, des cultures riches et des séjours inoubliables vous attendent.',
    discover: 'À découvrir',
    homes: 'logements',
    all: 'Voir toutes les destinations',
    descriptions: ['La côte, tout en douceur.', 'La ville rouge, riche en émotions.', 'Entre modernité et tradition.', 'Soleil, plage et détente.', 'Un voyage dans le temps.'],
  },
  en: {
    eyebrow: 'Popular destinations',
    title: 'Explore Morocco’s most beautiful destinations',
    subtitle: 'Unique cities, rich cultures and unforgettable stays are waiting for you.',
    discover: 'Discover',
    homes: 'properties',
    all: 'View all destinations',
    descriptions: ['A gentle coastal escape.', 'The red city, full of emotion.', 'Where modernity meets tradition.', 'Sun, beach and relaxation.', 'A journey through time.'],
  },
  ar: {
    eyebrow: 'وجهات رائجة',
    title: 'اكتشفوا أجمل وجهات المغرب',
    subtitle: 'مدن فريدة وثقافات غنية وإقامات لا تُنسى في انتظاركم.',
    discover: 'اكتشفوا',
    homes: 'إقامات',
    all: 'عرض جميع الوجهات',
    descriptions: ['ساحل هادئ وساحر.', 'المدينة الحمراء الغنية بالمشاعر.', 'بين الحداثة والأصالة.', 'شمس وشاطئ واسترخاء.', 'رحلة عبر الزمن.'],
  },
} as const;

const destinations = [
  { name: 'Sidi Bouzid', emoji: '🌊', image: '/img/destinations/sidi-bouzid.png', position: 'center' },
  { name: 'Marrakech', emoji: '🌴', image: '/img/destinations/marrakech.png', position: 'center' },
  { name: 'Casablanca', emoji: '🏙️', image: '/img/destinations/casablanca.png', position: 'center' },
  { name: 'Agadir', emoji: '☀️', image: '/img/destinations/agadir.png', position: 'center' },
  { name: 'Fès', emoji: '🕌', image: '/img/destinations/fes.png', position: 'center' },
];

export default function DestinationShowcase() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <section className="destination-showcase" aria-labelledby="destination-title">
      <header>
        <small><span />{text.eyebrow}</small>
        <h2 id="destination-title">{text.title}</h2>
        <p>{text.subtitle}</p>
      </header>

      <div className="destination-grid">
        {destinations.map((destination, index) => (
          <a className="destination-card" href="/properties" key={destination.name}>
            <div className="destination-card-media">
              <img src={destination.image} alt="" loading="lazy" style={{ objectPosition: destination.position }} />
              {index === 0 && <span className="destination-discover">{text.discover}</span>}
              <span className="destination-favorite" aria-hidden="true"><Heart size={15} /></span>
            </div>
            <div className="destination-card-copy">
              <h3><span className="home-emoji" aria-hidden="true">{destination.emoji}</span>{destination.name}</h3>
              <p>{text.descriptions[index]}</p>
              <span><House size={13} /> {text.homes}</span>
            </div>
          </a>
        ))}
      </div>

      <a className="destination-all" href="/properties">
        {text.all}<ArrowRight size={15} />
      </a>
    </section>
  );
}
