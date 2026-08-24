import type { Language } from '../types';

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

export let activeLanguage: Language =
  (localStorage.getItem('bouzid_language') as Language) || 'fr';

export const languageText = () => translations[activeLanguage];

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

export function applyAuthLanguage(language: Language) {
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

export function applyLanguage(language: Language) {
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
    '.login[data-auth-action="login"]',
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


/* =========================================================
   HEADING
   ========================================================= */


/* =========================================================
   AUTH MODAL
   ========================================================= */
