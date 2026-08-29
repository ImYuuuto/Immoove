import { ArrowUpRight } from 'lucide-react';
import Heading from './Heading';
import { useLanguage } from '../i18n/language';
import ResponsiveImage from './ResponsiveImage';

export default function Dining() {
  const { text } = useLanguage();
  const venues = [
    ['/uploads/site/dining/chez-laura.jpg', 'EL JADIDA / 01', 'Restaurant Chez Laura'],

    ['/uploads/site/dining/la-caleche.jpg', 'SIDI BOUZID / 02', 'Café La Calèche'],

    ['/uploads/site/dining/le-spot.jpg', 'LA PLAGE / 03', 'Le Spot'],
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

        <p>{text.diningText}</p>
      </div>

      <div className="dining-grid">
        {venues.map(([image, meta, title]) => (
          <article key={title}>
            <ResponsiveImage
              src={image}
              alt={title}
              sizes="(max-width: 800px) calc(100vw - 44px), 33vw"
            />

            <div>
              <small>{meta}</small>

              <h3>{title}</h3>
            </div>
          </article>
        ))}
      </div>

      <a className="outline-button" href="/categories/services">
        {text.exploreMore}
        <ArrowUpRight size={17} />
      </a>
    </section>
  );
}
