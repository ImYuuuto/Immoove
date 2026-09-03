import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Clock3, MapPin, X } from 'lucide-react';
import AnnouncementModal from '../components/AnnouncementModal';
import CategoryGrid from '../components/CategoryGrid';
import Heading from '../components/Heading';
import HeroSearch from '../components/HeroSearch';
import ListingCard from '../components/ListingCard';
import { EditorialSection, Newsletter, WhyImmoove } from '../components/LuxurySections';
import Navbar from '../components/Navbar';
import type { AuthUser, Listing, SearchFilters } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import ResponsiveImage from '../components/ResponsiveImage';

export default function App() {
  const { text, language } = useLanguage();
  const [open, setOpen] = useState(false);

  const [modal, setModal] = useState(false);

  const [message, setMessage] = useState('');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [pendingBooking, setPendingBooking] = useState<{ bookingId: number; listingId: number; listing?: { title?: string } } | null>(null);
  const reminderCopy = language === 'fr' ? { title: 'Demande en attente', body: 'Votre demande pour {listing} a bien été reçue. Nous vous contacterons bientôt pour la confirmation.', view: 'Voir mes réservations', close: 'Fermer' } : language === 'ar' ? { title: 'طلب قيد الانتظار', body: 'تم استلام طلبك لـ {listing}. سنتواصل معك قريباً للتأكيد.', view: 'عرض حجوزاتي', close: 'إغلاق' } : { title: 'Booking request pending', body: 'We received your request for {listing}. We’ll contact you soon to confirm it.', view: 'View my bookings', close: 'Close' };

  useEffect(() => {
    request<{
        rentals: Listing[];
      }>('/listings/featured')
      .then((featured) => {
        setListings(featured.rentals || []);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!currentUser) { setPendingBooking(null); return; }
    request<{ items: Array<{ bookingId: number; listingId: number; listing?: { title?: string } }> }>('/bookings?status=pending&page=1&pageSize=1')
      .then(result => setPendingBooking(result.items[0] || null)).catch(() => setPendingBooking(null));
  }, [currentUser]);

  const notify = (text: string) => {
    setMessage(text);

    window.setTimeout(() => setMessage(''), 3500);
  };

  const search = (filters: SearchFilters) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value) as [string, string][],
    );

    window.location.assign(`/properties${query.toString() ? `?${query}` : ''}`);
  };

  const favorite = async (id?: number) => {
    if (!id) {
      return notify(text.demoFavorite);
    }

    try {
      await request(`/favorites/${id}/toggle`, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${localStorage.getItem('immoove_token') || ''}`,
        },
      });

      notify(text.favoriteUpdated);
    } catch (error) {
      notify(error instanceof Error ? error.message : text.favoriteLogin);
    }
  };

  return (
    <div id="top">
      <Navbar
        open={open}
        setOpen={setOpen}
        onUserChange={setCurrentUser}
      />
      {pendingBooking && <aside className="pending-booking-reminder" role="status"><span><Clock3 /></span><div><small>{reminderCopy.title}</small><b>{reminderCopy.body.replace('{listing}', pendingBooking.listing?.title || `#${pendingBooking.listingId}`)}</b><a href="/profile?section=trips">{reminderCopy.view}</a></div><button aria-label={reminderCopy.close} onClick={() => setPendingBooking(null)}><X /></button></aside>}

      <main>
        {/* HERO */}

        <section className="hero">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            width={768}
            height={432}
            poster="/uploads/site/hero/coastal-hero-1200.webp"
          >
            <source src="/videos/morocco-hero.mp4" type="video/mp4" />
          </video>

          <div className="hero-shade" />
          <div className="location-badge">
            <MapPin size={14} /> MOROCCO
          </div>

          <div className="hero-copy">
            <small className="eyebrow">{text.eyebrow}</small>

            <h1>
              {text.heroLine1}
              <br />
              <em>{text.heroLine2}</em>
            </h1>

            <p>{text.heroText}</p>

            <a className="light-button" href="/properties">
              {text.prepare}
              <ArrowUpRight size={18} />
            </a>
          </div>

          <HeroSearch onSearch={search} />
          <a className="scroll-indicator" href="/properties">
            {text.scroll} <ArrowDown size={14} />
          </a>
        </section>

        <section className="premium-stats">
          <article>
            <strong>
              120<span>+</span>
            </strong>
            <p>{text.statsAddresses}</p>
          </article>
          <article>
            <strong>
              35<span>+</span>
            </strong>
            <p>{text.statsExperiences}</p>
          </article>
          <article>
            <strong>
              4.9<small>/5</small>
            </strong>
            <p>{text.statsRating}</p>
          </article>
        </section>

        {/* CATEGORIES */}

        <CategoryGrid
          onAnnouncement={() => setModal(true)}
          showAnnouncement={Boolean(currentUser)}
        />

        {/* ESCAPES */}

        <section className="section escapes" id="escapes">
          <div className="heading-row">
            <Heading
              eyebrow={text.selected}
              title={
                <>
                  {text.escapesLine1}
                  <br />
                  {text.escapesLine2}
                  <span>.</span>
                </>
              }
            />

            <a href="/properties">
              {text.allAddresses}
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="listing-grid">
            {listings.slice(0, 3).map((listing) => (
              <ListingCard
                listing={listing}
                onFavorite={favorite}
                onBook={(item) =>
                  item.listingId && window.location.assign(`/listings/${item.listingId}`)
                }
                key={listing.listingId || listing.title}
              />
            ))}
          </div>
        </section>

        <EditorialSection />

        <WhyImmoove />


        {/* HOST */}

        <section className="host section" id="host">
          <ResponsiveImage
            src="/uploads/site/hero/coastal-hero.jpg"
            alt={text.coastalLandscape}
            sizes="100vw"
          />

          <div>
            <small className="eyebrow">{text.hosts}</small>

            <h2>
              {text.hostTitle}
              <span>?</span>
            </h2>

            <p>{text.hostText}</p>

            {currentUser && (
              <button className="light-button" onClick={() => setModal(true)}>
                {text.addAddress}
                <ArrowUpRight size={18} />
              </button>
            )}
          </div>
        </section>

        <Newsletter />
      </main>

      {/* FOOTER */}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-intro">
            <a className="brand" href="/">
              <b>I</b> immoove<span>.</span>
            </a>
            <p>{text.footerText}</p>
          </div>
          <nav aria-label="Footer navigation">
            <small>{text.exploreFooter}</small>
            <a href="/properties">{text.stays}</a>
            <a href="/properties">{text.ourAddresses}</a>
          </nav>
          <div className="footer-location">
            <small>{text.findUs}</small>
            <p>
              Morocco
              <br />
              El Jadida, Maroc
            </p>
            <a href="/">{text.proposeAddress}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Immoove</span>
          <span className="footer-legal-links">
            <a href={`/terms?language=${language}`}>{text.termsOfUse}</a>
            <a href={`/privacy?language=${language}`}>{text.privacyPolicy}</a>
          </span>
          <span>{text.madeWithCare}</span>
        </div>
      </footer>

      {/* ANNOUNCEMENT MODAL */}

      {modal && currentUser && (
        <AnnouncementModal onClose={() => setModal(false)} onMessage={notify} />
      )}

      {/* TOAST */}

      {message && <div className="toast">{message}</div>}
    </div>
  );
}
