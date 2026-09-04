import { useEffect, useRef } from 'react';
import { MapPin, Quote } from 'lucide-react';
import { useLanguage } from '../i18n/language';

export function EditorialSection() {
  const { text } = useLanguage();
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
      </div>
    </section>
  );
}

export function WhyImmoove() {
  const { text } = useLanguage();
  return (
    <>
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
      <section className="testimonials" aria-label="Témoignages">
        <Quote className="testimonial-quote-icon" />
        <div className="testimonials-track-wrapper">
          <div className="testimonials-track">
            <figure>
              <blockquote>“{text.testimonial1}”</blockquote>
              <figcaption>— Sarah, Casablanca</figcaption>
            </figure>
            <figure>
              <blockquote>“{text.testimonial2}”</blockquote>
              <figcaption>— Adam, Rabat</figcaption>
            </figure>
            <figure>
              <blockquote>“{text.testimonial1}”</blockquote>
              <figcaption>— Sarah, Casablanca</figcaption>
            </figure>
            <figure>
              <blockquote>“{text.testimonial2}”</blockquote>
              <figcaption>— Adam, Rabat</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </>
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
