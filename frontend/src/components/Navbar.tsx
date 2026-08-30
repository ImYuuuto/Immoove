import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { AuthUser, Language } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import AuthModal from './AuthModal';
import ResponsiveImage from './ResponsiveImage';

export default function Navbar({
  open,
  setOpen,
  onAnnouncement,
  onUserChange,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onAnnouncement: () => void;
  onUserChange?: (user: AuthUser | null) => void;
}) {
  const { language, text, setLanguage } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);

  const [message, setMessage] = useState('');

  const [user, setUser] = useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    request<{ user: AuthUser }>('/auth/session')
      .then(async (session) => {
        const profile = await request<{ user: AuthUser }>('/profile').catch(() => null);
        const nextUser = profile?.user || session.user;
        setUser(nextUser);
        onUserChange?.(nextUser);
      })
      .catch(() => {
        setUser(null);
        onUserChange?.(null);
      })
      .finally(() => setAuthLoading(false));
  }, [onUserChange]);

  useEffect(() => {
    const requireLogin = (event: Event) => {
      setUser(null);
      onUserChange?.(null);
      setAuthOpen(true);
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
    };
    window.addEventListener('auth:unauthorized', requireLogin);
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === '1') setAuthOpen(true);
    if (params.get('reauth') === '1') setMessage(text.sessionChanged);
    return () => window.removeEventListener('auth:unauthorized', requireLogin);
  }, [onUserChange, text.sessionChanged]);

  const changeLanguage = (language: Language) => {
    setLanguage(language);
    setLanguageOpen(false);
  };

  return (
    <header className="navbar">
      {/* BRAND */}

      <a className="brand" href="/">
        <b>B</b>
        immoove<span>.</span>
      </a>

      {/* NAVIGATION */}

      <nav className={open ? 'nav-links open' : 'nav-links'}>
        <a href="/properties" onClick={() => setOpen(false)}>
          {text.discover}
        </a>

        <a href="/" onClick={() => setOpen(false)}>
          {text.about}
        </a>

        {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
          <button onClick={onAnnouncement}>{text.services}</button>
        )}

        {user?.role === 'ADMIN' && (
          <a className="admin-link" href="/admin" onClick={() => setOpen(false)}>
            {text.admin}
          </a>
        )}

        {user && (
          <a className="mobile-profile-link" href="/profile" onClick={() => setOpen(false)}>
            {text.profile}
          </a>
        )}
      </nav>

      {/* NAV ACTIONS */}

      <div className="nav-actions">
        {/* CUSTOM LANGUAGE MENU */}

        <div className="language-picker navbar-language-picker">
          <button
            type="button"
            className={`language-trigger ${languageOpen ? 'is-open' : ''}`}
            onClick={() => setLanguageOpen(!languageOpen)}
            aria-expanded={languageOpen}
            aria-haspopup="menu"
          >
            <span>{language.toUpperCase()}</span>

            <ChevronDown size={14} className="language-chevron" />
          </button>

          {languageOpen && (
            <div className="language-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className={language === 'fr' ? 'selected' : ''}
                onClick={() => changeLanguage('fr')}
              >
                <span className="language-code">FR</span>

                <span className="language-name">Français</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={language === 'en' ? 'selected' : ''}
                onClick={() => changeLanguage('en')}
              >
                <span className="language-code">EN</span>

                <span className="language-name">English</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={language === 'ar' ? 'selected' : ''}
                onClick={() => changeLanguage('ar')}
              >
                <span className="language-code">AR</span>

                <span className="language-name">العربية</span>
              </button>
            </div>
          )}
        </div>

        {/* AUTH / PROFILE */}

        {authLoading ? (
          <button className="login" type="button" disabled aria-label={text.sessionCheck}>
            …
          </button>
        ) : user ? (
          <a className="nav-profile-avatar" href="/profile" aria-label={text.profile}>
            {user.avatarUrl ? (
              <ResponsiveImage
                src={user.avatarUrl}
                alt={text.profile}
                width={44}
                height={44}
                sizes="44px"
                priority
              />
            ) : (
              <span>
                {user.firstName?.trim().charAt(0).toUpperCase() ||
                  user.email?.trim().charAt(0).toUpperCase() ||
                  'U'}
              </span>
            )}
          </a>
        ) : (
          <button
            className="login"
            data-auth-action="login"
            onClick={() => {
              setAuthOpen(true);
            }}
          >
            {text.login}
          </button>
        )}

        {/* MOBILE MENU */}

        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* AUTH */}

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onMessage={(text) => {
            setMessage(text);

            window.setTimeout(() => setMessage(''), 3500);
          }}
          onAuthenticated={(nextUser) => {
            const next = new URLSearchParams(window.location.search).get('next');
            if (next?.startsWith('/') && !next.startsWith('//')) {
              window.location.assign(next);
              return;
            }
            if (new URLSearchParams(window.location.search).has('login')) {
              window.history.replaceState(null, '', '/');
            }
            setUser(nextUser);
            onUserChange?.(nextUser);
            setAuthLoading(false);
          }}
        />
      )}

      {/* TOAST */}

      {message && <div className="toast">{message}</div>}
    </header>
  );
}
