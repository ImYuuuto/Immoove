import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { AuthUser, Language } from '../types';
import { request } from '../utils/request';
import { activeLanguage, applyAuthLanguage, applyLanguage, languageText } from '../i18n/language';
import AuthModal from './AuthModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar({
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

  const [passwordOpen, setPasswordOpen] =
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
      .then((result) =>
        setUser(result.user),
      )
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const requireLogin = () => { setUser(null); setPasswordOpen(false); setAuthOpen(true); };
    window.addEventListener('auth:unauthorized', requireLogin);
    if (new URLSearchParams(window.location.search).get('login') === '1') setAuthOpen(true);
    return () => window.removeEventListener('auth:unauthorized', requireLogin);
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
          onClick={() => {
            if (user) {
              onAnnouncement();
              return;
            }
            setMessage('Connectez-vous pour publier une annonce.');
            setAuthOpen(true);
          }}
        >
          {languageText().services}
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
              Admin
            </a>
          )}

        {user && (
          <a className="mobile-profile-link" href="/profile" onClick={() => setOpen(false)}>
            Mon profil
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

        {authLoading ? (
          <button className="login" type="button" disabled aria-label="Vérification de la session">
            …
          </button>
        ) : user ? (
          <div className="account-actions"><a className="account-security" href="/profile">Mon profil</a><button className="account-security" type="button" onClick={() => setPasswordOpen(true)}>Mot de passe</button><button className="login" data-auth-action="logout" onClick={logout}>Se déconnecter</button></div>
        ) : (
          <button
            className="login"
            data-auth-action="login"
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
          ) => {
            setUser(nextUser);
            setAuthLoading(false);
          }
          }
        />
      )}

      {passwordOpen && (
        <ChangePasswordModal
          onClose={() => setPasswordOpen(false)}
          onMessage={(text) => {
            setMessage(text);
            window.setTimeout(() => setMessage(''), 3500);
          }}
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
