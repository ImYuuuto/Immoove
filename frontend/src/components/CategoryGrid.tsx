import { images } from '../data/content';
import Heading from './Heading';
import { useLanguage } from '../i18n/language';
import { useCategories } from '../categories/useCategories';
import '../categories/category.css';

export default function CategoryGrid({
  onAnnouncement,
}: {
  onAnnouncement: () => void;
}) {
  const { text } = useLanguage();
  const categories = useCategories();
  const presentation = [
    {
      image: images.stay,
      number: '01 / STAY', icon: '🏡', title: text.villas, text: text.villasText,
    },

    {
      image: images.explore,
      number: '02 / EXPLORE', icon: '🌊', title: text.activities, text: text.activitiesText,
    },

    {
      image: images.food,
      number: '03 / TASTE', icon: '🍽', title: text.restaurants, text: text.restaurantsText,
    },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85', number: '04 / SWIM', icon: '🏖', title: text.beach, text: text.beachText },
  ];
  const cards = categories.map((category, index) => ({
    ...category,
    ...presentation[index % presentation.length],
    title: category.name,
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
            <img
              src={card.image}
              alt=""
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
      <button className="discover-host-link" onClick={onAnnouncement}>{text.shareAddress}</button>
    </section>
  );
}

