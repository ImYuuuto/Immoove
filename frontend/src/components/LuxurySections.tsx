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
  const reasons = [
    [text.reason1Title, text.reason1Text],
    [text.reason2Title, text.reason2Text],
    [text.reason3Title, text.reason3Text],
  ];
  return (
    <>
      <section className="why-immoove section" id="experiences">
        <small className="eyebrow reveal">{text.whyEyebrow}</small>
        <h2 className="luxury-title reveal">
          {text.whyLine1}
          <br />
          {text.whyLine2}
          <span>.</span>
        </h2>
        <div className="why-grid">
          {reasons.map(([title, description], i) => (
            <article className="reveal" key={title}>
              <b>0{i + 1}</b>
              <h3>{title}</h3>
              <i />
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
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
            ● {text.villas} &nbsp; ● {text.restaurants} &nbsp; ● {text.beach} &nbsp; ●{' '}
            {text.activities}
          </div>
        </div>
        <div className="local-map reveal">
          <span>{text.ocean}</span>
          <button className="pin p1">
            <MapPin /> {text.villas}
          </button>
          <button className="pin p2">
            <MapPin /> {text.restaurants}
          </button>
          <button className="pin p3">
            <MapPin /> {text.beach}
          </button>
          <button className="pin p4">
            <MapPin /> {text.activities}
          </button>
        </div>
      </section>
      <section className="testimonials">
        <Quote />
        <figure>
          <blockquote>“{text.testimonial1}”</blockquote>
          <figcaption>— Sarah, Casablanca</figcaption>
        </figure>
        <figure>
          <blockquote>“{text.testimonial2}”</blockquote>
          <figcaption>— Adam, Rabat</figcaption>
        </figure>
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
