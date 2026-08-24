import { images } from '../data/content';
import Heading from './Heading';

export default function CategoryGrid({
  onAnnouncement,
}: {
  onAnnouncement: () => void;
}) {
  const cards = [
    {
      className: 'large',
      image: images.stay,
      number: '01 / STAY', icon: '🏡', title: 'Villas', text: 'Des maisons choisies pour les jours qui durent.',
    },

    {
      image: images.explore,
      number: '02 / EXPLORE', icon: '🌊', title: 'Activities', text: 'Des expériences au rythme de la côte.',
    },

    {
      image: images.food,
      number: '03 / TASTE', icon: '🍽', title: 'Restaurants', text: 'De belles tables, sans se presser.',
    },
    { image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85', number: '04 / SWIM', icon: '🏖', title: 'Beach', text: 'L’océan du matin au soir.' },
  ];

  return (
    <section
      className="section categories"
      id="categories"
    >
      <Heading
        eyebrow="Tout commence ici"
        title={
          <>
            Une belle raison
            <br />
            de rester<span>.</span>
          </>
        }
      />

      <div className="category-grid">

        {cards.map((card) => (
          <a
            className="category-card"
            href="#escapes"
            key={card.title}
          >
            <img
              src={card.image}
              alt=""
            />

            <div>
              <small>
                {card.number}
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
      <button className="discover-host-link" onClick={onAnnouncement}>Vous avez une belle adresse ? Partagez-la avec nous →</button>
    </section>
  );
}

