import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/language';

const copy = {
  fr: {
    eyebrow: 'Une adresse pour chaque envie',
    title: 'Trouvez le logement qui vous ressemble',
    subtitle: 'Découvrez une sélection de logements pensée pour chaque façon de séjourner au Maroc.',
    explore: 'Explorer',
    names: ['Villas', 'Appartements', 'Riads', 'Maisons', 'Studios'],
  },
  en: {
    eyebrow: 'A place for every stay',
    title: 'Find the home that feels like you',
    subtitle: 'Discover a curated selection of homes for every way of staying in Morocco.',
    explore: 'Explore',
    names: ['Villas', 'Apartments', 'Riads', 'Houses', 'Studios'],
  },
  ar: {
    eyebrow: 'سكن يناسب كل إقامة',
    title: 'اعثروا على السكن الذي يشبهكم',
    subtitle: 'اكتشفوا مجموعة مختارة من المساكن تناسب مختلف الإقامات في المغرب.',
    explore: 'استكشفوا',
    names: ['فيلات', 'شقق', 'رياض', 'منازل', 'استوديوهات'],
  },
} as const;

const propertyTypes = [
  { key: 'villa', emoji: '🏡', image: '/img/property-types/villa.png', href: '/properties/villas' },
  { key: 'apartment', emoji: '🏙️', image: '/img/property-types/apartment.png', href: '/properties/apartments' },
  { key: 'riad', emoji: '🕌', image: '/img/property-types/riad.png', href: '/properties?property_type=riad' },
  { key: 'house', emoji: '🏠', image: '/img/property-types/house.png', href: '/properties?property_type=house' },
  { key: 'studio', emoji: '🔑', image: '/img/property-types/studio.png', href: '/properties/studios' },
] as const;

export default function PropertyTypeShowcase() {
  const { language } = useLanguage();
  const text = copy[language];

  return (
    <section className="property-type-showcase" aria-labelledby="property-type-title">
      <header>
        <small>{text.eyebrow}</small>
        <h2 id="property-type-title">{text.title}</h2>
        <p>{text.subtitle}</p>
      </header>

      <div className="property-type-grid">
        {propertyTypes.map((type, index) => (
          <a className="property-type-card" href={type.href} key={type.key}>
            <img src={type.image} alt="" loading="lazy" />
            <span className="property-type-shade" aria-hidden="true" />
            <span className="property-type-copy">
              <strong><span className="home-emoji" aria-hidden="true">{type.emoji}</span>{text.names[index]}</strong>
              <span>{text.explore}<ArrowRight size={16} /></span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
