import { ArrowUpRight } from 'lucide-react';
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
      number: '01 / SÉJOURNER',
      title: 'Locations de vacances',
      text:
        'Des hébergements sélectionnés pour vos parenthèses au soleil.',
    },

    {
      image: images.explore,
      number: '02 / EXPLORER',
      title: 'Activités & loisirs',
    },

    {
      image: images.food,
      number: '03 / SAVOURER',
      title: 'Restaurants & Cafés',
    },
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
            className={`category-card ${
              card.className || ''
            }`}
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

        <button
          className="category-card host-card"
          onClick={onAnnouncement}
        >
          <strong>✦</strong>

          <small>
            VOUS ÊTES PROFESSIONNEL ?
          </small>

          <h3>
            Publier une annonce
          </h3>

          <p>
            Faites découvrir votre adresse à ceux qui cherchent déjà leur prochaine escale.
          </p>

          <ArrowUpRight />
        </button>
      </div>
    </section>
  );
}

