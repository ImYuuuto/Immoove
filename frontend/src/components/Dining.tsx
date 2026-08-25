import { ArrowUpRight } from 'lucide-react';
import Heading from './Heading';
import { useLanguage } from '../i18n/language';

export default function Dining() {
  const { text } = useLanguage();
  const venues = [
    [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
      'EL JADIDA / 01',
      'Restaurant Chez Laura',
    ],

    [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=85',
      'SIDI BOUZID / 02',
      'Café La Calèche',
    ],

    [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85',
      'LA PLAGE / 03',
      'Le Spot',
    ],
  ];

  return (
    <section className="dining section">

      <div className="dining-intro">

        <Heading
          light
          eyebrow={text.atTable}
          title={
            <>
              {text.tablesLine1}
              <br />
              {text.tablesLine2}
              <span>.</span>
            </>
          }
        />

        <p>
          {text.diningText}
        </p>
      </div>

      <div className="dining-grid">

        {venues.map(
          ([image, meta, title]) => (
            <article key={title}>
              <img
                src={image}
                alt={title}
              />

              <div>
                <small>
                  {meta}
                </small>

                <h3>
                  {title}
                </h3>
              </div>
            </article>
          ),
        )}
      </div>

      <a
        className="outline-button"
        href="/categories/services"
      >
        {text.exploreMore}
        <ArrowUpRight size={17} />
      </a>
    </section>
  );
}
