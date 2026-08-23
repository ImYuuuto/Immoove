import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  Star,
  X,
} from 'lucide-react';

import AdminDashboard from './admin/AdminDashboard';
import './styles.css';

const API =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

type ServiceType =
  | 'VACATION_RENTAL'
  | 'CAR_RENTAL'
  | 'RESTAURANT_CAFE'
  | 'ACTIVITY';

type Listing = {
  listingId?: number;
  title: string;
  description?: string;
  basePrice?: number;
  guestCapacity?: number;
  coverImageUrl?: string;
  images?: { url: string }[];
  location?: { name: string };
};

type Post = {
  post_id?: number;
  title: string;
  excerpt?: string;
  category?: string;
  cover_image_url?: string;
};

type SearchFilters = {
  check_in?: string;
  check_out?: string;
  guests?: string;
  service_type?: ServiceType | '';
};

type Announcement = {
  service_type: ServiceType;
  title: string;
  description: string;
  address: string;
  contact_phone: string;
};

type AuthUser = {
  userId: number;
  role: string;
  email?: string;
};

type Language = 'fr' | 'ar' | 'en';

type Translation = {
  discover: string;
  about: string;
  services: string;
  login: string;
  eyebrow: string;
  heroTitle: string;
  heroText: string;
  prepare: string;
  dates: string;
  datesPlaceholder: string;
  guests: string;
  guestsPlaceholder: string;
  service: string;
  allServices: string;
  selectReason: string;
  stay: string;
  explore: string;
  dining: string;
  publish: string;
  publishText: string;
  selection: string;
  excellent: string;
  travelers: string;
  from: string;
  night: string;
  selected: string;
  allAddresses: string;
  atTable: string;
  tables: string;
  diningText: string;
  exploreMore: string;
  journal: string;
  inspiration: string;
  allArticles: string;
  read: string;
  hosts: string;
  hostTitle: string;
  hostText: string;
  addAddress: string;
  legal: string;
  footer: string;
};

const translations: Record<Language, Translation> = {
  fr: {
    discover: 'Découvrir',
    about: 'À propos',
    services: 'Nos services',
    login: 'Se connecter',
    eyebrow: "L’ESCALE SOLAIRE DE LA CÔTE MAROCAINE",
    heroTitle: 'Là où l’été<br/><em>vous attend.</em>',
    heroText:
      'Entre ciel, sable et océan, trouvez votre prochain séjour d’exception à Sidi Bouzid.',
    prepare: 'Préparer mon séjour',
    dates: 'DATES DU SÉJOUR',
    datesPlaceholder: 'Ajouter des dates',
    guests: 'VOYAGEURS',
    guestsPlaceholder: 'Ajouter des voyageurs',
    service: 'SERVICE',
    allServices: 'Tous les services',
    selectReason: 'Une belle raison<br/>de rester<span>.</span>',
    stay: 'Locations de vacances',
    explore: 'Activités & loisirs',
    dining: 'Restaurants & Cafés',
    publish: 'Publier une annonce',
    publishText:
      'Faites découvrir votre adresse à ceux qui cherchent déjà leur prochaine escale.',
    selection: 'SÉLECTION',
    excellent: 'Excellent',
    travelers: 'voyageurs',
    from: 'À partir de',
    night: 'nuit',
    selected: 'Sélection Bouzid',
    allAddresses: 'Voir toutes les adresses',
    atTable: 'À table',
    tables: 'Nos tables<br/>coup de cœur<span>.</span>',
    diningText:
      'Une cuisine généreuse, des terrasses qui s’attardent et le goût des bons moments.',
    exploreMore: 'Explorer davantage',
    journal: 'Le petit journal',
    inspiration: 'Inspiration & conseils<br/>de voyage<span>.</span>',
    allArticles: 'Tous les articles',
    read: 'Continuer la lecture',
    hosts: 'POUR LES BELLES ADRESSES',
    hostTitle:
      'Et si votre adresse devenait leur prochaine destination de rêve<span>?</span>',
    hostText:
      'Rejoignez une communauté qui aime découvrir, séjourner et partager local.',
    addAddress: 'Ajouter mon adresse',
    legal: 'Mentions légales & CGU',
    footer: 'Des séjours qui ont le goût du soleil.',
  },

  en: {
    discover: 'Discover',
    about: 'About us',
    services: 'Our services',
    login: 'Log in',
    eyebrow: 'THE SUNNY ESCAPE ON MOROCCO’S COAST',
    heroTitle: 'Where summer<br/><em>is waiting.</em>',
    heroText:
      'Between sky, sand and ocean, find your next exceptional stay in Sidi Bouzid.',
    prepare: 'Plan my stay',
    dates: 'STAY DATES',
    datesPlaceholder: 'Add dates',
    guests: 'GUESTS',
    guestsPlaceholder: 'Add guests',
    service: 'SERVICE',
    allServices: 'All services',
    selectReason: 'A beautiful reason<br/>to stay<span>.</span>',
    stay: 'Vacation rentals',
    explore: 'Activities & leisure',
    dining: 'Restaurants & Cafés',
    publish: 'List your address',
    publishText:
      'Put your address in front of people already dreaming of their next escape.',
    selection: 'FEATURED',
    excellent: 'Excellent',
    travelers: 'guests',
    from: 'From',
    night: 'night',
    selected: 'Bouzid selection',
    allAddresses: 'See all addresses',
    atTable: 'At the table',
    tables: 'Our favourite<br/>tables<span>.</span>',
    diningText:
      'Generous cooking, lingering terraces and the taste of good moments.',
    exploreMore: 'Explore more',
    journal: 'The little journal',
    inspiration: 'Travel inspiration<br/>& advice<span>.</span>',
    allArticles: 'All articles',
    read: 'Continue reading',
    hosts: 'FOR BEAUTIFUL ADDRESSES',
    hostTitle:
      'What if your address became their next dream destination<span>?</span>',
    hostText:
      'Join a community that loves discovering, staying and sharing local.',
    addAddress: 'Add my address',
    legal: 'Legal information & terms',
    footer: 'Stays that taste like sunshine.',
  },

  ar: {
    discover: 'اكتشف',
    about: 'من نحن',
    services: 'خدماتنا',
    login: 'تسجيل الدخول',
    eyebrow: 'ملاذ مشمس على الساحل المغربي',
    heroTitle: 'حيث الصيف<br/><em>في انتظاركم.</em>',
    heroText:
      'بين السماء والرمال والمحيط، اكتشفوا إقامتكم الاستثنائية القادمة في سيدي بوزيد.',
    prepare: 'حضّروا إقامتكم',
    dates: 'تواريخ الإقامة',
    datesPlaceholder: 'أضيفوا التواريخ',
    guests: 'المسافرون',
    guestsPlaceholder: 'أضيفوا المسافرين',
    service: 'الخدمة',
    allServices: 'كل الخدمات',
    selectReason: 'سبب جميل<br/>للبقاء<span>.</span>',
    stay: 'إقامات العطلات',
    explore: 'أنشطة وترفيه',
    dining: 'مطاعم ومقاهٍ',
    publish: 'انشروا إعلاناً',
    publishText:
      'عرّفوا بعنوانكم لمن يبحثون عن رحلتهم القادمة.',
    selection: 'مختارات',
    excellent: 'ممتاز',
    travelers: 'مسافرون',
    from: 'ابتداءً من',
    night: 'ليلة',
    selected: 'مختارات بوزيد',
    allAddresses: 'شاهدوا كل العناوين',
    atTable: 'على المائدة',
    tables: 'موائدنا<br/>المفضلة<span>.</span>',
    diningText:
      'مطبخ كريم وشرفات تدعو للبقاء وطعم اللحظات الجميلة.',
    exploreMore: 'اكتشفوا المزيد',
    journal: 'المجلة الصغيرة',
    inspiration: 'إلهام ونصائح<br/>للسفر<span>.</span>',
    allArticles: 'كل المقالات',
    read: 'تابعوا القراءة',
    hosts: 'للعناوين الجميلة',
    hostTitle:
      'ماذا لو أصبح عنوانكم وجهتهم الحلم القادمة<span>؟</span>',
    hostText:
      'انضموا إلى مجتمع يحب الاكتشاف والإقامة ومشاركة التجارب المحلية.',
    addAddress: 'أضيفوا عنوانكم',
    legal: 'المعلومات القانونية والشروط',
    footer: 'إقامات بطعم الشمس.',
  },
};

let activeLanguage: Language =
  (localStorage.getItem('bouzid_language') as Language) || 'fr';

const languageText = () => translations[activeLanguage];

const authTranslations: Record<
  Language,
  {
    eyebrow: string;
    loginTitle: string;
    registerTitle: string;
    loginText: string;
    registerText: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    login: string;
    register: string;
    switchLogin: string;
    switchRegister: string;
  }
> = {
  fr: {
    eyebrow: 'BOUZID ESCAPES',
    loginTitle: 'Bienvenue à nouveau',
    registerTitle: 'Créer un compte',
    loginText:
      'Connectez-vous pour enregistrer vos adresses favorites.',
    registerText: 'Rejoignez la communauté Bouzid.',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Adresse e-mail',
    password: 'Mot de passe (12 caractères minimum)',
    login: 'Se connecter',
    register: 'Créer mon compte',
    switchLogin: 'J’ai déjà un compte',
    switchRegister: 'Créer un compte',
  },

  en: {
    eyebrow: 'BOUZID ESCAPES',
    loginTitle: 'Welcome back',
    registerTitle: 'Create an account',
    loginText: 'Log in to save your favourite addresses.',
    registerText: 'Join the Bouzid community.',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email address',
    password: 'Password (12 characters minimum)',
    login: 'Log in',
    register: 'Create my account',
    switchLogin: 'I already have an account',
    switchRegister: 'Create an account',
  },

  ar: {
    eyebrow: 'بوزيد إسكايبس',
    loginTitle: 'مرحباً بعودتكم',
    registerTitle: 'إنشاء حساب',
    loginText: 'سجلوا الدخول لحفظ عناوينكم المفضلة.',
    registerText: 'انضموا إلى مجتمع بوزيد.',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور (12 حرفاً على الأقل)',
    login: 'تسجيل الدخول',
    register: 'إنشاء حسابي',
    switchLogin: 'لدي حساب بالفعل',
    switchRegister: 'إنشاء حساب',
  },
};

function applyAuthLanguage(language: Language) {
  const copy = authTranslations[language];

  const set = (selector: string, value: string) => {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  };

  const placeholder = (selector: string, value: string) => {
    const element =
      document.querySelector<HTMLInputElement>(selector);

    if (element) {
      element.placeholder = value;
    }
  };

  const register =
    !!document.querySelector('.auth-modal .auth-names');

  set('.auth-modal .eyebrow', copy.eyebrow);
  set(
    '.auth-modal h2',
    register ? copy.registerTitle : copy.loginTitle,
  );
  set(
    '.auth-modal p',
    register ? copy.registerText : copy.loginText,
  );

  placeholder(
    '.auth-modal .auth-names input:first-child',
    copy.firstName,
  );

  placeholder(
    '.auth-modal .auth-names input:last-child',
    copy.lastName,
  );

  placeholder(
    '.auth-modal input[type="email"]',
    copy.email,
  );

  placeholder(
    '.auth-modal input[type="password"]',
    copy.password,
  );

  set(
    '.auth-modal .light-button',
    register ? copy.register : copy.login,
  );

  set(
    '.auth-modal .auth-switch',
    register
      ? copy.switchLogin
      : copy.switchRegister,
  );
}

function applyLanguage(language: Language) {
  activeLanguage = language;

  localStorage.setItem('bouzid_language', language);

  document.documentElement.lang = language;

  document.documentElement.dir =
    language === 'ar' ? 'rtl' : 'ltr';

  const t = languageText();

  const text = (
    selector: string,
    value: string,
    html = false,
  ) => {
    const element = document.querySelector(selector);

    if (element) {
      if (html) {
        element.innerHTML = value;
      } else {
        element.textContent = value;
      }
    }
  };

  text(
    '.nav-links a:nth-child(1)',
    t.discover,
  );

  text(
    '.nav-links a:nth-child(2)',
    t.about,
  );

  text(
    '.nav-links button',
    t.services,
  );

  text(
    '.login',
    t.login,
  );

  text(
    '.hero-copy .eyebrow',
    t.eyebrow,
  );

  text(
    '.hero h1',
    t.heroTitle,
    true,
  );

  text(
    '.hero-copy p',
    t.heroText,
  );

  text(
    '.hero-copy .light-button',
    t.prepare,
  );

  text(
    '.search-panel label:nth-child(1) small',
    t.dates,
  );

  text(
    '.search-panel label:nth-child(1) input',
    t.datesPlaceholder,
  );

  text(
    '.search-panel label:nth-child(2) small',
    t.guests,
  );

  text(
    '.search-panel label:nth-child(2) option:first-child',
    t.guestsPlaceholder,
  );

  text(
    '.search-panel label:nth-child(3) small',
    t.service,
  );

  text(
    '.search-panel label:nth-child(3) option:first-child',
    t.allServices,
  );

  text(
    '.categories .section-heading h2',
    t.selectReason,
    true,
  );

  text(
    '.category-card.large h3',
    t.stay,
  );

  text(
    '.category-card:nth-child(2) h3',
    t.explore,
  );

  text(
    '.category-card:nth-child(3) h3',
    t.dining,
  );

  text(
    '.host-card h3',
    t.publish,
  );

  text(
    '.host-card p',
    t.publishText,
  );

  text(
    '.escapes .eyebrow',
    t.selected,
  );

  text(
    '.dining .eyebrow',
    t.atTable,
  );

  text(
    '.dining .section-heading h2',
    t.tables,
    true,
  );

  text(
    '.dining-intro > p',
    t.diningText,
  );

  text(
    '.journal .eyebrow',
    t.journal,
  );

  text(
    '.journal .section-heading h2',
    t.inspiration,
    true,
  );

  text(
    '.host .eyebrow',
    t.hosts,
  );

  text(
    '.host h2',
    t.hostTitle,
    true,
  );

  text(
    '.host p',
    t.hostText,
  );

  text(
    '.host .light-button',
    t.addAddress,
  );

  text(
    'footer > p',
    t.footer,
  );
}

/* =========================================================
   IMAGES
   ========================================================= */

const images = {
  hero:
    'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2200&q=88',

  stay:
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85',

  explore:
    'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=85',

  food:
    'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85',
};

const fallbackListings: Listing[] = [
  {
    title: 'La Maison Bleue',
    description:
      'Villa lumineuse avec vue sur l’océan',
    basePrice: 1700,
    guestCapacity: 6,
    coverImageUrl:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=85',
  },

  {
    title: 'Dar El Bahri',
    description:
      'Un refuge doux à quelques pas de la plage',
    basePrice: 1250,
    guestCapacity: 4,
    coverImageUrl:
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=85',
  },

  {
    title: 'Villa des Dunes',
    description:
      'L’adresse idéale pour les grandes tablées',
    basePrice: 2200,
    guestCapacity: 8,
    coverImageUrl:
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85',
  },
];

const fallbackPosts: Post[] = [
  {
    title: '48 heures entre océan et médina',
    excerpt:
      'Nos idées pour ralentir, explorer et savourer la côte.',
    category: 'IDÉES & INSPIRATION',
    cover_image_url: images.explore,
  },

  {
    title: 'Le rythme doux de Sidi Bouzid',
    excerpt:
      'Une invitation à prendre le temps de ne rien faire, vraiment.',
    category: 'BIEN-ÊTRE & ÉQUILIBRE',
    cover_image_url:
      'https://images.unsplash.com/photo-1507520084875-3f0baf6f9d23?auto=format&fit=crop&w=900&q=85',
  },

  {
    title: 'Les saveurs de la côte',
    excerpt:
      'À la rencontre des tables qui racontent notre région.',
    category: 'CARNET GOURMAND',
    cover_image_url:
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
  },
];

/* =========================================================
   API
   ========================================================= */

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',

    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },

    ...options,
  });

  if (!response.ok) {
    throw new Error(
      (await response.json().catch(() => null))
        ?.error?.message ||
        `Erreur ${response.status}`,
    );
  }

  return response.status === 204
    ? (undefined as T)
    : response.json();
}

/* =========================================================
   HEADING
   ========================================================= */

function Heading({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  light?: boolean;
}) {
  useEffect(() => {
    applyLanguage(activeLanguage);
  });

  return (
    <div
      className={`section-heading ${
        light ? 'light' : ''
      }`}
    >
      <div>
        <small className="eyebrow">
          {eyebrow}
        </small>

        <h2>{title}</h2>
      </div>
    </div>
  );
}

/* =========================================================
   AUTH MODAL
   ========================================================= */

function AuthModal({
  onClose,
  onMessage,
  onAuthenticated,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [registerMode, setRegisterMode] =
    useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    try {
      const result =
        await request<{ user: AuthUser }>(
          registerMode
            ? '/auth/register'
            : '/auth/login',
          {
            method: 'POST',

            body: JSON.stringify(
              registerMode
                ? form
                : {
                    email: form.email,
                    password: form.password,
                  },
            ),
          },
        );

      onAuthenticated(result.user);

      onMessage(
        registerMode
          ? 'Votre compte a été créé.'
          : 'Connexion réussie.',
      );

      onClose();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : 'Connexion impossible.',
      );
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <form
        className="modal auth-modal"
        onSubmit={submit}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X />
        </button>

        <small className="eyebrow">
          BOUZID ESCAPES
        </small>

        <h2>
          {registerMode
            ? 'Créer un compte'
            : 'Bienvenue à nouveau'}
        </h2>

        <p>
          {registerMode
            ? 'Rejoignez la communauté Bouzid.'
            : 'Connectez-vous pour enregistrer vos adresses favorites.'}
        </p>

        {registerMode && (
          <div className="auth-names">
            <input
              required
              aria-label="Prénom"
              placeholder="Prénom"
              value={form.first_name}
              onChange={(event) =>
                update(
                  'first_name',
                  event.target.value,
                )
              }
            />

            <input
              required
              aria-label="Nom"
              placeholder="Nom"
              value={form.last_name}
              onChange={(event) =>
                update(
                  'last_name',
                  event.target.value,
                )
              }
            />
          </div>
        )}

        <input
          required
          aria-label="Adresse e-mail"
          type="email"
          placeholder="Adresse e-mail"
          value={form.email}
          onChange={(event) =>
            update(
              'email',
              event.target.value,
            )
          }
        />

        <input
          required
          aria-label="Mot de passe"
          minLength={12}
          type="password"
          placeholder="Mot de passe (12 caractères minimum)"
          value={form.password}
          onChange={(event) =>
            update(
              'password',
              event.target.value,
            )
          }
        />

        <button
          className="light-button"
          type="submit"
        >
          {registerMode
            ? 'Créer mon compte'
            : 'Se connecter'}

          <ArrowUpRight size={17} />
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() =>
            setRegisterMode(!registerMode)
          }
        >
          {registerMode
            ? 'J’ai déjà un compte'
            : 'Créer un compte'}
        </button>
      </form>
    </div>
  );
}
function LanguagePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(activeLanguage);

  const languages: {
    code: Language;
    label: string;
    native: string;
  }[] = [
    {
      code: 'fr',
      label: 'Français',
      native: 'FR',
    },
    {
      code: 'en',
      label: 'English',
      native: 'EN',
    },
    {
      code: 'ar',
      label: 'العربية',
      native: 'AR',
    },
  ];

  const current =
    languages.find((item) => item.code === language) || languages[0];

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);

    applyLanguage(nextLanguage);
    applyAuthLanguage(nextLanguage);

    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('.language-picker-custom')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="language-picker-custom">
      <button
        type="button"
        className={`language-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((value) => !value);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="language-trigger-code">
          {current.native}
        </span>

        <span className="language-trigger-arrow">
          <ChevronDown size={15} />
        </span>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          <div className="language-dropdown-title">
            Language
          </div>

          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`language-option ${
                language === item.code ? 'selected' : ''
              }`}
              onClick={() => changeLanguage(item.code)}
            >
              <span className="language-option-code">
                {item.native}
              </span>

              <span className="language-option-name">
                {item.label}
              </span>

              {language === item.code && (
                <span className="language-check">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   NAVBAR
   ========================================================= */

function Navbar({
  open,
  setOpen,
  onAnnouncement,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onAnnouncement: () => void;
}) {
  const [authOpen, setAuthOpen] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [languageOpen, setLanguageOpen] =
    useState(false);

  useEffect(() => {
    request<{ user: AuthUser }>(
      '/auth/session',
    )
      .then((result) =>
        setUser(result.user),
      )
      .catch(() => setUser(null));
  }, []);

  const changeLanguage = (
    language: Language,
  ) => {
    applyLanguage(language);
    applyAuthLanguage(language);
    setLanguageOpen(false);
  };

  const logout = async () => {
    await request(
      '/auth/logout',
      {
        method: 'POST',
      },
    ).catch(() => undefined);

    setUser(null);

    setMessage(
      'Vous êtes déconnecté.',
    );

    window.setTimeout(
      () => setMessage(''),
      3500,
    );
  };

  return (
    <header className="navbar">

      {/* BRAND */}

      <a
        className="brand"
        href="#top"
      >
        <b>B</b>
        bouzid<span>.</span>
      </a>

      {/* NAVIGATION */}

      <nav
        className={
          open
            ? 'nav-links open'
            : 'nav-links'
        }
      >
        <a
          href="#categories"
          onClick={() =>
            setOpen(false)
          }
        >
          {languageText().discover}
        </a>

        <a
          href="#story"
          onClick={() =>
            setOpen(false)
          }
        >
          {languageText().about}
        </a>

        <button
          onClick={onAnnouncement}
        >
          {languageText().services}
        </button>

        {user &&
          ['ADMIN', 'admin'].includes(
            user.role,
          ) && (
            <a
              className="admin-link"
              href="#/admin"
              onClick={() =>
                setOpen(false)
              }
            >
              Admin
            </a>
          )}
      </nav>

      {/* NAV ACTIONS */}

      <div className="nav-actions">

        {/* CUSTOM LANGUAGE MENU */}

        <div className="language-picker">

          <button
            type="button"
            className={`language-trigger ${
              languageOpen
                ? 'is-open'
                : ''
            }`}
            onClick={() =>
              setLanguageOpen(
                !languageOpen,
              )
            }
            aria-expanded={
              languageOpen
            }
            aria-haspopup="menu"
          >
            <span>
              {activeLanguage.toUpperCase()}
            </span>

            <ChevronDown
              size={14}
              className="language-chevron"
            />
          </button>

          {languageOpen && (
            <div
              className="language-menu"
              role="menu"
            >

              <button
                type="button"
                role="menuitem"
                className={
                  activeLanguage === 'fr'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  changeLanguage('fr')
                }
              >
                <span className="language-code">
                  FR
                </span>

                <span className="language-name">
                  Français
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={
                  activeLanguage === 'en'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  changeLanguage('en')
                }
              >
                <span className="language-code">
                  EN
                </span>

                <span className="language-name">
                  English
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={
                  activeLanguage === 'ar'
                    ? 'selected'
                    : ''
                }
                onClick={() =>
                  changeLanguage('ar')
                }
              >
                <span className="language-code">
                  AR
                </span>

                <span className="language-name">
                  العربية
                </span>
              </button>

            </div>
          )}
        </div>

        {/* LOGIN */}

        {user ? (
          <button
            className="login"
            onClick={logout}
          >
            Se déconnecter
          </button>
        ) : (
          <button
            className="login"
            onClick={() => {
              setAuthOpen(true);

              window.setTimeout(
                () =>
                  applyAuthLanguage(
                    activeLanguage,
                  ),
                0,
              );
            }}
          >
            {languageText().login}
          </button>
        )}

        {/* MOBILE MENU */}

        <button
          className="menu-button"
          onClick={() =>
            setOpen(!open)
          }
          aria-label="Menu"
        >
          {open ? (
            <X />
          ) : (
            <Menu />
          )}
        </button>
      </div>

      {/* AUTH */}

      {authOpen && (
        <AuthModal
          onClose={() =>
            setAuthOpen(false)
          }
          onMessage={(text) => {
            setMessage(text);

            window.setTimeout(
              () => setMessage(''),
              3500,
            );
          }}
          onAuthenticated={(
            nextUser,
          ) =>
            setUser(nextUser)
          }
        />
      )}

      {/* TOAST */}

      {message && (
        <div className="toast">
          {message}
        </div>
      )}
    </header>
  );
}

/* =========================================================
   HERO SEARCH
   ========================================================= */

function HeroSearch({
  onSearch,
}: {
  onSearch: (
    filters: SearchFilters,
  ) => void;
}) {
  const [filters, setFilters] =
    useState<SearchFilters>({});

  const update = (
    key: keyof SearchFilters,
    value: string,
  ) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  return (
    <form
      className="search-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(filters);
      }}
    >
      <label>
        <small>
          DATES DU SÉJOUR
        </small>

        <input
          type="date"
          aria-label="Date d’arrivée"
          onChange={(e) =>
            update(
              'check_in',
              e.target.value,
            )
          }
        />
      </label>

      <label>
        <small>
          VOYAGEURS
        </small>

        <select
          defaultValue=""
          onChange={(e) =>
            update(
              'guests',
              e.target.value,
            )
          }
        >
          <option value="">
            Ajouter des voyageurs
          </option>

          <option value="1">
            1 voyageur
          </option>

          <option value="2">
            2 voyageurs
          </option>

          <option value="4">
            4 voyageurs
          </option>

          <option value="6">
            6 voyageurs
          </option>
        </select>
      </label>

      <label>
        <small>
          SERVICE
        </small>

        <select
          defaultValue=""
          onChange={(e) =>
            update(
              'service_type',
              e.target.value as
                | ServiceType
                | '',
            )
          }
        >
          <option value="">
            Tous les services
          </option>

          <option value="VACATION_RENTAL">
            Locations de vacances
          </option>

          <option value="RESTAURANT_CAFE">
            Restaurants & Cafés
          </option>

          <option value="ACTIVITY">
            Activités & Loisirs
          </option>
        </select>
      </label>

      <button aria-label="Rechercher">
        <Search size={23} />
      </button>
    </form>
  );
}

/* =========================================================
   CATEGORY GRID
   ========================================================= */

function CategoryGrid({
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

/* =========================================================
   LISTING CARD
   ========================================================= */

function ListingCard({
  listing,
  onFavorite,
}: {
  listing: Listing;
  onFavorite: (id?: number) => void;
}) {
  const image =
    listing.coverImageUrl ||
    listing.images?.[0]?.url ||
    fallbackListings[0]
      .coverImageUrl;

  return (
    <article className="listing-card">

      <div className="listing-image">

        <img
          src={image}
          alt={listing.title}
        />

        <span>
          SÉLECTION
        </span>

        <button
          onClick={() =>
            onFavorite(
              listing.listingId,
            )
          }
          aria-label="Ajouter aux favoris"
        >
          <Heart size={18} />
        </button>
      </div>

      <div className="listing-info">

        <div className="rating">
          <span>
            <Star
              size={13}
              fill="currentColor"
            />
            5.00 · Excellent
          </span>

          <span>
            {listing.guestCapacity ||
              4}{' '}
            voyageurs
          </span>
        </div>

        <h3>
          {listing.title}
        </h3>

        <p>
          {listing.description ||
            'Une adresse choisie pour vos vacances.'}
        </p>

        <b>
          À partir de{' '}
          {Number(
            listing.basePrice || 0,
          ).toLocaleString(
            'fr-FR',
          )}{' '}
          MAD

          <i>
            {' '}
            / nuit
          </i>
        </b>
      </div>
    </article>
  );
}

/* =========================================================
   DINING
   ========================================================= */

function Dining() {
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
          eyebrow="À table"
          title={
            <>
              Nos tables
              <br />
              coup de cœur
              <span>.</span>
            </>
          }
        />

        <p>
          Une cuisine généreuse, des terrasses qui s’attardent et le goût des bons moments.
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
        href="#dining"
      >
        Explorer davantage
        <ArrowUpRight size={17} />
      </a>
    </section>
  );
}

/* =========================================================
   ANNOUNCEMENT MODAL
   ========================================================= */

function AnnouncementModal({
  onClose,
  onMessage,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const [data, setData] =
    useState<Announcement>({
      service_type:
        'VACATION_RENTAL',
      title: '',
      description: '',
      address: '',
      contact_phone: '',
    });

  const update = (
    key: keyof Announcement,
    value: string,
  ) => {
    setData({
      ...data,
      [key]: value,
    });
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    try {
      await request(
        '/announcements/request',
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${
              localStorage.getItem(
                'bouzid_token',
              ) || ''
            }`,
          },

          body: JSON.stringify(data),
        },
      );

      onMessage(
        'Votre annonce a été envoyée.',
      );

      onClose();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’envoyer la demande.',
      );
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <form
        className="modal"
        onSubmit={submit}
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X />
        </button>

        <small className="eyebrow">
          REJOINDRE BOUZID
        </small>

        <h2>
          Publier une annonce
        </h2>

        <p>
          Présentez votre adresse à notre équipe.
        </p>

        <select
          value={data.service_type}
          onChange={(e) =>
            update(
              'service_type',
              e.target.value,
            )
          }
        >
          <option value="VACATION_RENTAL">
            Location de vacances
          </option>

          <option value="RESTAURANT_CAFE">
            Restaurant ou café
          </option>

          <option value="ACTIVITY">
            Activité
          </option>

          <option value="CAR_RENTAL">
            Location de voiture
          </option>
        </select>

        <input
          required
          placeholder="Nom de votre adresse"
          value={data.title}
          onChange={(e) =>
            update(
              'title',
              e.target.value,
            )
          }
        />

        <input
          required
          placeholder="Adresse"
          value={data.address}
          onChange={(e) =>
            update(
              'address',
              e.target.value,
            )
          }
        />

        <input
          placeholder="Téléphone"
          value={data.contact_phone}
          onChange={(e) =>
            update(
              'contact_phone',
              e.target.value,
            )
          }
        />

        <textarea
          placeholder="Décrivez votre activité"
          value={data.description}
          onChange={(e) =>
            update(
              'description',
              e.target.value,
            )
          }
        />

        <button
          className="light-button"
          type="submit"
        >
          Envoyer la demande
          <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [open, setOpen] =
    useState(false);

  const [modal, setModal] =
    useState(false);

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
</section>

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
                  key={
                    listing.listingId ||
                    listing.title
                  }
                />
              ))}

          </div>
        </section>

        {/* DINING */}

        <Dining />

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
                    {post.category ||
                      'IDÉES & INSPIRATION'}
                  </small>

                  <h3>
                    {post.title}
                  </h3>

                  <p>
                    {post.excerpt}
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
      </main>

      {/* FOOTER */}

      <footer>

        <a
          className="brand"
          href="#top"
        >
          <b>B</b>
          bouzid<span>.</span>
        </a>

        <p>
          Des séjours qui ont le goût du soleil.
        </p>

        <div className="footer-bottom">
          <span>
            © 2025 Bouzid Escapes
          </span>

          <span>
            Mentions légales & CGU
          </span>

          <span>
            Made with care in Sidi Bouzid
          </span>
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

      {/* TOAST */}

      {message && (
        <div className="toast">
          {message}
        </div>
      )}

    </div>
  );
}

/* =========================================================
   ROUTING
   ========================================================= */

const root = createRoot(
  document.getElementById('root')!,
);

const renderRoute = () =>
  root.render(
    ['#admin', '#/admin'].includes(
      window.location.hash,
    ) ? (
      <AdminDashboard />
    ) : (
      <App />
    ),
  );

renderRoute();

window.addEventListener(
  'hashchange',
  renderRoute,
);

window.setTimeout(
  () =>
    applyLanguage(
      activeLanguage,
    ),
  0,
);