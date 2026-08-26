import { images } from '../data/content';
import Heading from './Heading';
import { useLanguage } from '../i18n/language';
import { useCategories } from '../categories/useCategories';
import { categoryLabel } from '../categories/categoryLabels';
import '../categories/category.css';
import ResponsiveImage from './ResponsiveImage';

export default function CategoryGrid({
  onAnnouncement,
  showAnnouncement = true,
}: {
  onAnnouncement: () => void;
  showAnnouncement?: boolean;
}) {
  const { language, text } = useLanguage();
  const categories = useCategories();
  const presentation = [
    {
      image: images.stay,
      number: `01 / ${text.stay.toUpperCase()}`, icon: '🏡', title: text.villas, text: text.villasText,
    },

    {
      image: images.explore,
      number: `02 / ${text.explore.toUpperCase()}`, icon: '🌊', title: text.activities, text: text.activitiesText,
    },

    {
      image: images.food,
      number: `03 / ${text.dining.toUpperCase()}`, icon: '🍽', title: text.restaurants, text: text.restaurantsText,
    },
    { image: '/uploads/site/categories/beach.jpg', number: `04 / ${text.carRental.toUpperCase()}`, icon: '🚗', title: text.carRental, text: text.beachText },
  ];
  const cards = categories.map((category, index) => ({
    ...category,
    ...presentation[index % presentation.length],
    title: categoryLabel(category.slug, language, category.name),
  }));

  return (
    <section
      className="section categories"
      id="categories"
    >
      <Heading
        eyebrow={text.categoriesEyebrow}
        title={
          <>
            {text.categoriesLine1}
            <br />
            {text.categoriesLine2}<span>.</span>
          </>
        }
      />

      <div className="category-grid">

        {cards.map((card) => (
          <a
            className={`category-card ${card === cards[0] ? 'large' : ''}`}
            href={`/categories/${card.slug}`}
            key={card.categoryId}
          >
            <ResponsiveImage
              src={card.image}
              alt=""
              sizes="(max-width: 800px) 78vw, 300px"
            />

            <div>
              <small>
                {card.number}{card.listingCount !== undefined && <span className="category-count">{card.listingCount}</span>}
              </small>
              <span className="category-icon">{card.icon}</span>

              <h3>
                {card.title}
              </h3>

              {card.text && (
                <p>
                  {card.text}
                </p>
              )}
            </div>
          </a>
        ))}

      </div>
      {showAnnouncement && <button className="discover-host-link" onClick={onAnnouncement}>{text.shareAddress}</button>}
    </section>
  );
}

