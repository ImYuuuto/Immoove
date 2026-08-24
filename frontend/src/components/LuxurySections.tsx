import { useEffect, useRef } from 'react';
import { MapPin, Quote } from 'lucide-react';

export function EditorialSection() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const onScroll = () => ref.current?.style.setProperty('--shift', `${Math.max(-34, Math.min(34, -ref.current.getBoundingClientRect().top * .08))}px`);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <section className="editorial-luxury" ref={ref}>
    <div className="editorial-photo" />
    <div className="editorial-content reveal"><small className="eyebrow">THE ART OF TAKING YOUR TIME</small><h2>Take your time.<br />The coast isn&apos;t going anywhere<span>.</span></h2><p>À Sidi Bouzid, les meilleurs jours ne suivent pas un programme. Ils commencent avec la lumière et finissent quand vous le décidez.</p><a href="#dining">Discover the coast →</a></div>
  </section>;
}

export function WhyBouzid() {
  const reasons = [['Curated locally', 'Authentic experiences'], ['Made for slow days', 'Sun, sea & good food'], ['Rooted in place', 'The coast, as locals know it']];
  return <>
    <section className="why-bouzid section" id="experiences"><small className="eyebrow reveal">WHY BOUZID?</small><h2 className="luxury-title reveal">A little closer<br />to what matters<span>.</span></h2><div className="why-grid">{reasons.map(([title, text], i) => <article className="reveal" key={title}><b>0{i + 1}</b><h3>{title}</h3><i /><p>{text}</p></article>)}</div></section>
    <section className="map-luxury section"><div className="map-copy reveal"><small className="eyebrow">YOUR LOCAL GUIDE</small><h2 className="luxury-title">The coast,<br />mapped gently<span>.</span></h2><p>Les adresses qui donnent à Sidi Bouzid son caractère, réunies dans un seul endroit.</p><div className="map-legend">● Villas &nbsp; ● Restaurants &nbsp; ● Beaches &nbsp; ● Activities</div></div><div className="local-map reveal"><span>ATLANTIC OCEAN</span><button className="pin p1"><MapPin /> Villas</button><button className="pin p2"><MapPin /> Restaurants</button><button className="pin p3"><MapPin /> Beach</button><button className="pin p4"><MapPin /> Activities</button></div></section>
    <section className="testimonials"><Quote /><figure><blockquote>“A beautiful place,<br />amazing experience.”</blockquote><figcaption>— Sarah, Casablanca</figcaption></figure><figure><blockquote>“The kind of weekend<br />you remember in winter.”</blockquote><figcaption>— Adam, Rabat</figcaption></figure></section>
  </>;
}

export function Newsletter() {
  return <section className="newsletter section"><small className="eyebrow">STAY IN THE KNOW</small><h2 className="luxury-title">Get the Bouzid letter<span>.</span></h2><p>Local places. Secret spots. Good stories.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" required aria-label="Your email" placeholder="Your email" /><button>Subscribe →</button></form></section>;
}
