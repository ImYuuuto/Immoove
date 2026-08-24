import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react';
import AnnouncementModal from '../components/AnnouncementModal';
import BookingModal from '../components/BookingModal';
import CategoryGrid from '../components/CategoryGrid';
import Dining from '../components/Dining';
import Heading from '../components/Heading';
import HeroSearch from '../components/HeroSearch';
import ListingCard from '../components/ListingCard';
import { EditorialSection, Newsletter, WhyBouzid } from '../components/LuxurySections';
import Navbar from '../components/Navbar';
import UserBookings from '../components/UserBookings';
import { fallbackListings, fallbackPosts, images } from '../data/content';
import type { Listing, Post, SearchFilters } from '../types';
import { request } from '../utils/request';
import { decodeText } from '../utils/decodeText';

export default function App() {
  const [open, setOpen] =
    useState(false);

  const [modal, setModal] =
    useState(false);

  const [bookingListing, setBookingListing] =
    useState<Listing | null>(null);

  const [message, setMessage] =
    useState('');

  const [listings, setListings] =
    useState(fallbackListings);

  const [posts, setPosts] =
    useState(fallbackPosts);

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
          setListings(
            featured.rentals,
          );
        }

        if (blog.items?.length) {
          setPosts(blog.items);
        }
      })
      .catch(() => {});
  }, []);

  const notify = (text: string) => {
    setMessage(text);

    window.setTimeout(
      () => setMessage(''),
      3500,
    );
  };

  const search = async (
    filters: SearchFilters,
  ) => {
    const query =
      new URLSearchParams(
        Object.entries(filters).filter(
          ([, value]) => value,
        ) as [string, string][],
      );

    try {
      const result =
        await request<{
          items: Listing[];
        }>(
          `/listings/search?${query}`,
        );

      setListings(result.items);

      notify(
        `${result.items.length} adresse(s) trouvée(s).`,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Recherche indisponible.',
      );
    }

    document
      .querySelector('#escapes')
      ?.scrollIntoView({
        behavior: 'smooth',
      });
  };

  const favorite = async (
    id?: number,
  ) => {
    if (!id) {
      return notify(
        'Cette adresse de démonstration n’est pas encore enregistrée.',
      );
    }

    try {
      await request(
        `/favorites/${id}/toggle`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${
              localStorage.getItem(
                'bouzid_token',
              ) || ''
            }`,
          },
        },
      );

      notify(
        'Favori mis à jour.',
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Connectez-vous pour enregistrer cette adresse.',
      );
    }
  };

  return (
    <div id="top">

      <Navbar
        open={open}
        setOpen={setOpen}
        onAnnouncement={() =>
          setModal(true)
        }
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
    poster={images.hero}
  >
    <source
      src="/videos/sidi-bouzid-hero.mp4"
      type="video/mp4"
    />
  </video>

  <div className="hero-shade" />
  <div className="location-badge"><MapPin size={14} /> SIDI BOUZID <i /> EL JADIDA <i /> MOROCCO</div>

  <div className="hero-copy">
    <small className="eyebrow">
      L’ESCALE SOLAIRE DE LA CÔTE MAROCAINE
    </small>

    <h1>
      Là où l’été
      <br />
      <em>vous attend.</em>
    </h1>

    <p>
      Entre ciel, sable et océan, trouvez votre prochain
      séjour d’exception à Sidi Bouzid.
    </p>

    <a className="light-button" href="#escapes">
      Préparer mon séjour
      <ArrowUpRight size={18} />
    </a>
  </div>

  <HeroSearch onSearch={search} />
  <a className="scroll-indicator" href="#categories">SCROLL TO EXPLORE <ArrowDown size={14} /></a>
</section>

        <section className="premium-stats"><article><strong>120<span>+</span></strong><p>Beautiful<br />addresses</p></article><article><strong>35<span>+</span></strong><p>Local<br />experiences</p></article><article><strong>4.9<small>/5</small></strong><p>Guest<br />rating</p></article></section>

        {/* CATEGORIES */}

        <CategoryGrid
          onAnnouncement={() =>
            setModal(true)
          }
        />

        {/* ESCAPES */}

        <section
          className="section escapes"
          id="escapes"
        >
          <div className="heading-row">

            <Heading
              eyebrow="Sélection Bouzid"
              title={
                <>
                  Évasions sélectionnées
                  <br />
                  pour vous
                  <span>.</span>
                </>
              }
            />

            <a href="#categories">
              Voir toutes les adresses
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="listing-grid">

            {listings
              .slice(0, 3)
              .map((listing) => (
                <ListingCard
                  listing={listing}
                  onFavorite={favorite}
                  onBook={setBookingListing}
                  key={
                    listing.listingId ||
                    listing.title
                  }
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

        <section
          className="section journal"
          id="story"
        >
          <div className="heading-row">

            <Heading
              eyebrow="Le petit journal"
              title={
                <>
                  Inspiration & conseils
                  <br />
                  de voyage
                  <span>.</span>
                </>
              }
            />

            <a href="#story">
              Tous les articles
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="journal-grid">

            {posts
              .slice(0, 3)
              .map((post) => (
                <article
                  className="post"
                  key={
                    post.post_id ||
                    post.title
                  }
                >
                  <img
                    src={
                      post.cover_image_url ||
                      images.explore
                    }
                    alt=""
                  />

                  <small>
                    {decodeText(post.category) ||
                      'IDÉES & INSPIRATION'}
                  </small>

                  <h3>
                    {decodeText(post.title)}
                  </h3>

                  <p>
                    {decodeText(post.excerpt)}
                  </p>

                  <a href="#story">
                    Continuer la lecture
                    <ArrowUpRight size={14} />
                  </a>
                </article>
              ))}
          </div>
        </section>

        {/* HOST */}

        <section
          className="host section"
          id="host"
        >
          <img
            src="https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?auto=format&fit=crop&w=2000&q=85"
            alt="Paysage côtier"
          />

          <div>

            <small className="eyebrow">
              POUR LES BELLES ADRESSES
            </small>

            <h2>
              Et si votre adresse devenait leur prochaine destination de rêve
              <span>?</span>
            </h2>

            <p>
              Rejoignez une communauté qui aime découvrir, séjourner et partager local.
            </p>

            <button
              className="light-button"
              onClick={() =>
                setModal(true)
              }
            >
              Ajouter mon adresse
              <ArrowUpRight size={18} />
            </button>

          </div>
        </section>

        <Newsletter />
      </main>

      {/* FOOTER */}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-intro">
            <a className="brand" href="#top"><b>B</b> bouzid<span>.</span></a>
            <p>Des séjours qui ont le goût du soleil, pensés avec soin depuis la côte marocaine.</p>
          </div>
          <nav aria-label="Footer navigation">
            <small>EXPLORER</small>
            <a href="#categories">Séjours</a>
            <a href="#escapes">Nos adresses</a>
            <a href="#story">Le journal</a>
          </nav>
          <div className="footer-location">
            <small>NOUS TROUVER</small>
            <p>Sidi Bouzid<br />El Jadida, Maroc</p>
            <a href="#host">Proposer mon adresse →</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Bouzid Escapes</span>
          <span>Mentions légales &amp; CGU</span>
          <span>Made with care in Sidi Bouzid</span>
        </div>
      </footer>

      {/* ANNOUNCEMENT MODAL */}

      {modal && (
        <AnnouncementModal
          onClose={() =>
            setModal(false)
          }
          onMessage={notify}
        />
      )}

      {bookingListing && (
        <BookingModal
          listing={bookingListing}
          onClose={() => setBookingListing(null)}
          onMessage={notify}
        />
      )}

      {/* TOAST */}

      {message && (
        <div className="toast">
          {message}
        </div>
      )}

    </div>
  );
}
