import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { AuthUser, Language } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import AuthModal from './AuthModal';

export default function Navbar({
  open,
  setOpen,
  onAnnouncement,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  onAnnouncement: () => void;
}) {
  const { language, text, setLanguage } = useLanguage();
  const [authOpen, setAuthOpen] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [languageOpen, setLanguageOpen] =
    useState(false);

  useEffect(() => {
    request<{ user: AuthUser }>(
      '/auth/session',
    )
      .then(async (session) => {
        const profile = await request<{ user: AuthUser }>('/profile').catch(() => null);
        setUser(profile?.user || session.user);
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const requireLogin = () => { setUser(null); setAuthOpen(true); };
    window.addEventListener('auth:unauthorized', requireLogin);
    if (new URLSearchParams(window.location.search).get('login') === '1') setAuthOpen(true);
    return () => window.removeEventListener('auth:unauthorized', requireLogin);
  }, []);

  const changeLanguage = (
    language: Language,
  ) => {
    setLanguage(language);
    setLanguageOpen(false);
  };

  return (
    <header className="navbar">

      {/* BRAND */}

      <a
        className="brand"
        href="/"
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
          href="/categories"
          onClick={() =>
            setOpen(false)
          }
        >
          {text.discover}
        </a>

        <a
          href="/"
          onClick={() =>
            setOpen(false)
          }
        >
          {text.about}
        </a>

        <button
          onClick={() => {
            if (user) {
              onAnnouncement();
              return;
            }
            setMessage(text.loginRequiredPublish);
            setAuthOpen(true);
          }}
        >
          {text.services}
        </button>

        {user &&
          ['ADMIN', 'admin'].includes(
            user.role,
          ) && (
            <a
              className="admin-link"
              href="/admin"
              onClick={() =>
                setOpen(false)
              }
            >
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
              {language.toUpperCase()}
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
                  language === 'fr'
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
                  language === 'en'
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
                  language === 'ar'
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

        {/* AUTH / PROFILE */}

        {authLoading ? (
          <button className="login" type="button" disabled aria-label={text.sessionCheck}>
            …
          </button>
        ) : user ? (
          <a className="nav-profile-avatar" href="/profile" aria-label="Ouvrir mon profil">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Photo de profil" />
            ) : (
              <span>{user.firstName?.trim().charAt(0).toUpperCase() || user.email?.trim().charAt(0).toUpperCase() || 'U'}</span>
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
          ) => {
            const next = new URLSearchParams(window.location.search).get('next');
            if (next?.startsWith('/') && !next.startsWith('//')) {
              window.location.assign(next);
              return;
            }
            setUser(nextUser);
            setAuthLoading(false);
          }
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
