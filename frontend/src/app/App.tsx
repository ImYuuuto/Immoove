import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';
import AnnouncementModal from '../components/AnnouncementModal';
import CategoryGrid from '../components/CategoryGrid';
import Dining from '../components/Dining';
import Heading from '../components/Heading';
import HeroSearch from '../components/HeroSearch';
import ListingCard from '../components/ListingCard';
import { EditorialSection, Newsletter, WhyBouzid } from '../components/LuxurySections';
import Navbar from '../components/Navbar';
import UserBookings from '../components/UserBookings';
import { fallbackListings, fallbackPosts, images } from '../data/content';
import type { AuthUser, Listing, Post, SearchFilters } from '../types';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';
import { formatTranslation, useLanguage } from '../i18n/language';
import ResponsiveImage from '../components/ResponsiveImage';

export default function App() {
  const { text, language } = useLanguage();
  const [open, setOpen] = useState(false);

  const [modal, setModal] = useState(false);

  const [message, setMessage] = useState('');

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [listings, setListings] = useState(fallbackListings);

  const [posts, setPosts] = useState(fallbackPosts);

  useEffect(() => {
    Promise.all([
      request<{
        rentals: Listing[];
      }>('/listings/featured'),

      request<{
        items: Post[];
      }>('/blog/posts?limit=3'),
    ])
      .then(([featured, blog]) => {
        if (featured.rentals?.length) {
          setListings(featured.rentals);
        }

        if (blog.items?.length) {
          setPosts(blog.items);
        }
      })
      .catch(() => {});
  }, []);

  const notify = (text: string) => {
    setMessage(text);

    window.setTimeout(() => setMessage(''), 3500);
  };

  const search = async (filters: SearchFilters) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value) as [string, string][],
    );

    try {
      const result = await request<{
        items: Listing[];
      }>(`/listings/search?${query}`);

      setListings(result.items);

      notify(formatTranslation(text.searchFound, { count: result.items.length }));
    } catch (error) {
      notify(error instanceof Error ? error.message : text.searchUnavailable);
    }

    document.getElementById('escapes')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const favorite = async (id?: number) => {
    if (!id) {
      return notify(text.demoFavorite);
    }

    try {
      await request(`/favorites/${id}/toggle`, {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${localStorage.getItem('bouzid_token') || ''}`,
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
        onAnnouncement={() => setModal(true)}
        onUserChange={setCurrentUser}
      />

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
            <source src="/videos/sidi-bouzid-hero.mp4" type="video/mp4" />
          </video>

          <div className="hero-shade" />
          <div className="location-badge">
            <MapPin size={14} /> SIDI BOUZID <i /> EL JADIDA <i /> MOROCCO
          </div>

          <div className="hero-copy">
            <small className="eyebrow">{text.eyebrow}</small>

            <h1>
              {text.heroLine1}
              <br />
              <em>{text.heroLine2}</em>
            </h1>

            <p>{text.heroText}</p>

            <a className="light-button" href="/categories">
              {text.prepare}
              <ArrowUpRight size={18} />
            </a>
          </div>

          <HeroSearch onSearch={search} />
          <a className="scroll-indicator" href="/categories">
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
          showAnnouncement={currentUser?.role === 'OWNER'}
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

            <a href="/categories">
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

        {/* DINING */}

        <Dining />

        <WhyBouzid />

        <UserBookings />

        {/* JOURNAL */}

        <section className="section journal" id="story">
          <div className="heading-row">
            <Heading
              eyebrow={text.journal}
              title={
                <>
                  {text.inspirationLine1}
                  <br />
                  {text.inspirationLine2}
                  <span>.</span>
                </>
              }
            />

            <a href="/">
              {text.allArticles}
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="journal-grid">
            {posts.slice(0, 3).map((post) => (
              <article className="post" key={post.post_id || post.title}>
                <ResponsiveImage
                  src={post.cover_image_url || images.explore}
                  alt=""
                  width={900}
                  height={600}
                  sizes="(max-width: 760px) calc(100vw - 44px), 33vw"
                />

                <small>{decodeText(post.category) || text.ideas}</small>

                <h3>{decodeText(post.title)}</h3>

                <p>{decodeText(post.excerpt)}</p>

                <a href="/">
                  {text.read}
                  <ArrowUpRight size={14} />
                </a>
              </article>
            ))}
          </div>
        </section>

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

            {currentUser?.role === 'OWNER' && (
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
              <b>B</b> bouzid<span>.</span>
            </a>
            <p>{text.footerText}</p>
          </div>
          <nav aria-label="Footer navigation">
            <small>{text.exploreFooter}</small>
            <a href="/categories/housing">{text.stays}</a>
            <a href="/categories">{text.ourAddresses}</a>
            <a href="/">{text.journal}</a>
          </nav>
          <div className="footer-location">
            <small>{text.findUs}</small>
            <p>
              Sidi Bouzid
              <br />
              El Jadida, Maroc
            </p>
            <a href="/">{text.proposeAddress}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Bouzid Escapes</span>
          <span className="footer-legal-links">
            <a href={`/terms?language=${language}`}>{text.termsOfUse}</a>
            <a href={`/privacy?language=${language}`}>{text.privacyPolicy}</a>
          </span>
          <span>{text.madeWithCare}</span>
        </div>
      </footer>

      {/* ANNOUNCEMENT MODAL */}

      {modal && currentUser?.role === 'OWNER' && (
        <AnnouncementModal onClose={() => setModal(false)} onMessage={notify} />
      )}

      {/* TOAST */}

      {message && <div className="toast">{message}</div>}
    </div>
  );
}
