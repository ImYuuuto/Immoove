import { images } from '../data/content';
import Heading from './Heading';
import { useLanguage } from '../i18n/language';
import '../properties/property.css';
import ResponsiveImage from './ResponsiveImage';

export default function CategoryGrid({
  onAnnouncement,
  showAnnouncement = true,
}: {
  onAnnouncement: () => void;
  showAnnouncement?: boolean;
}) {
  const { language, text } = useLanguage();
  const labels = {
    fr: ['Appartements', 'Studios', 'Villas'],
    en: ['Apartments', 'Studios', 'Villas'],
    ar: ['شقق', 'استوديوهات', 'فيلات'],
  }[language];
  const presentation = [
    {
      image: images.stay,
      number: '01 / APARTMENT',
      icon: '🏡',
      title: text.villas,
      text: text.villasText,
    },

    {
      image: images.stay,
      number: '02 / STUDIO',
      icon: '🛏️',
      title: labels[1],
      text: text.villasText,
    },

    {
      image: '/uploads/site/categories/beach.jpg',
      number: '03 / VILLA',
      icon: '🏊',
      title: labels[2],
      text: text.villasText,
    },
  ];
  presentation[0].title = labels[0];
  const paths = ['apartments', 'studios', 'villas'];

  return (
    <section className="section categories" id="categories">
      <Heading
        eyebrow={text.categoriesEyebrow}
        title={
          <>
            {text.categoriesLine1}
            <br />
            {text.categoriesLine2}
            <span>.</span>
          </>
        }
      />

      <div className="category-grid">
        {presentation.map((card, index) => (
          <a
            className={`category-card ${index === 0 ? 'large' : ''}`}
            href={`/properties/${paths[index]}`}
            key={paths[index]}
          >
            <ResponsiveImage src={card.image} alt="" sizes="(max-width: 800px) 78vw, 300px" />

            <div>
              <small>{card.number}</small>
              <span className="category-icon">{card.icon}</span>

              <h3>{card.title}</h3>

              {card.text && <p>{card.text}</p>}
            </div>
          </a>
        ))}
      </div>
      {showAnnouncement && (
        <button className="discover-host-link" onClick={onAnnouncement}>
          {text.shareAddress}
        </button>
      )}
    </section>
  );
}
