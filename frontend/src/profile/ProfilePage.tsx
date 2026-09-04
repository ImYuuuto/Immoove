import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Camera, Heart, Home, KeyRound, LogOut, Save, Settings, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AuthModal from '../components/AuthModal';
import ResponsiveImage from '../components/ResponsiveImage';
import { useLanguage } from '../i18n/language';
import { roleLabel, serviceTypeLabel } from '../i18n/labels';
import { ApiError, clearLocalSession, request } from '../utils/request';
import ProfileTrips from './ProfileTrips';
import ContactPasswordModal from './ContactPasswordModal';
import { profileCopy } from './profileI18n';
import { maskEmail, maskPhone } from './profileUtils';
import type { ProfileListing, ProfileSummary, ProfileUser } from './types';
import './profile.css';

type View = 'overview' | 'trips' | 'saved' | 'personal' | 'security';

const initialView = (): View => {
  const section = new URLSearchParams(window.location.search).get('section');
  return ['overview', 'trips', 'saved', 'personal', 'security'].includes(section || '')
    ? section as View
    : 'overview';
};

export default function ProfilePage() {
  const { language, text } = useLanguage();
  const copy = profileCopy(language);
  const [view, setView] = useState<View>(initialView);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [favorites, setFavorites] = useState<ProfileListing[]>([]);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [contact, setContact] = useState({ email: '', phone: '' });
  const [contactEditing, setContactEditing] = useState(false);
  const [contactConfirmOpen, setContactConfirmOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const notify = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(''), 4000);
  };

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await request<{ user: ProfileUser }>('/profile');
      const [summaryResult, saved] = await Promise.all([
        request<{ summary: ProfileSummary }>('/profile/summary'),
        request<{ items: ProfileListing[] }>('/favorites'),
      ]);
      setUser(profile.user);
      setSummary(summaryResult.summary);
      setName({ firstName: profile.user.firstName, lastName: profile.user.lastName });
      setContact({ email: profile.user.email, phone: profile.user.phone || '' });
      setFavorites(saved.items);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setAuthOpen(true);
      } else setError(cause instanceof Error ? cause.message : text.profileLoadFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const requireLogin = (event: Event) => {
      setUser(null); setPasswordOpen(false); setAuthOpen(true);
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
    };
    window.addEventListener('auth:unauthorized', requireLogin);
    return () => window.removeEventListener('auth:unauthorized', requireLogin);
  }, []);
  useEffect(() => { void loadProfile(); }, []);

  const initials = useMemo(() => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U', [user]);
  const updateName = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await request<{ user: ProfileUser }>('/profile', { method: 'PATCH', body: JSON.stringify(name) });
      setUser(result.user); notify(text.nameUpdated);
    } catch (cause) { notify(cause instanceof Error ? cause.message : text.profileLoadFailed); }
  };

  const updateContact = async (currentPassword: string) => {
    try {
      const previousEmail = user?.email;
      const result = await request<{ user: ProfileUser }>('/profile/contact', {
        method: 'PATCH', body: JSON.stringify({ ...contact, currentPassword }),
      });
      setUser(result.user);
      setContactEditing(false);
      setContactConfirmOpen(false);
      notify(copy.contactSaved);
      if (previousEmail !== result.user.email) {
        window.setTimeout(async () => {
          await request('/auth/logout', { method: 'POST' }).catch(() => undefined);
          clearLocalSession(); window.location.assign('/?login=1&reauth=1');
        }, 1200);
      }
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : text.profileLoadFailed);
      throw cause;
    }
  };

  const logout = async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearLocalSession(); window.location.assign('/');
  };
  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notify(copy.avatarTooLarge);
    setAvatarUploading(true);
    try {
      const body = new FormData();
      body.append('avatar', file);
      const result = await request<{ user: ProfileUser }>('/profile/avatar', { method: 'POST', body });
      setUser(result.user);
      notify(copy.avatarSaved);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : copy.avatarFailed);
    } finally {
      setAvatarUploading(false);
    }
  };
  const deactivate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const currentPassword = String(new FormData(form).get('currentPassword') || '');
    form.reset();
    if (!currentPassword) return notify(copy.passwordRequired);
    if (deleteConfirmation !== 'DELETE') return notify(copy.deleteConfirmationRequired);
    setDeleting(true);
    try {
      await request<void>('/profile', { method: 'DELETE', body: JSON.stringify({ currentPassword, confirmation: deleteConfirmation }) });
      clearLocalSession(); window.location.assign('/');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : text.profileLoadFailed); setDeleting(false);
    }
  };

  const removeFavorite = async (id: number) => {
    await request(`/favorites/${id}/toggle`, { method: 'POST' });
    setFavorites((items) => items.filter((item) => item.listingId !== id));
  };

  if (loading) return <div className="profile-state">{text.loadingProfile}</div>;
  if (!user) return (
    <main className="profile-page"><header className="profile-topbar"><a className="brand" href="/"><b>I</b>immoove<span>.</span></a></header>
      <div className="profile-state"><UserRound size={38} /><h1>{error ? text.profileUnavailable : text.connect}</h1><p>{error || text.profileLoginText}</p><button className="profile-login" onClick={() => setAuthOpen(true)}>{text.login}</button></div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onMessage={notify} onAuthenticated={() => { setAuthOpen(false); void loadProfile(); }} />}
    </main>
  );

  const nav: Array<[View, string, typeof Home]> = [
    ['overview', copy.overview, Home], ['trips', copy.trips, CalendarDays], ['saved', copy.saved, Heart],
    ['personal', copy.personal, UserRound], ['security', copy.security, ShieldCheck],
  ];
  const stats = [
    [copy.bookings, summary?.bookingCount || 0], [copy.activeTrips, summary?.activeTripCount || 0],
    [copy.favorites, summary?.favoriteCount || favorites.length], [copy.properties, summary?.listingCount || 0],
  ];

  return (
    <main className="profile-page">
      <header className="profile-topbar"><a className="brand" href="/"><b>I</b>immoove<span>.</span></a><a href="/"><ArrowLeft size={17} />{text.backSite}</a></header>
      <section className="profile-hero">
        <label className={avatarUploading ? 'profile-avatar uploading' : 'profile-avatar'} title={copy.changePhoto}>
          {user.avatarUrl ? <ResponsiveImage src={user.avatarUrl} alt={text.profile} width={104} height={104} sizes="104px" priority /> : <span>{initials}</span>}
          <span className="profile-avatar-action"><Camera size={17} />{avatarUploading ? copy.uploadingPhoto : copy.changePhoto}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={avatarUploading} onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value = ''; }} />
        </label>
        <div><small>{copy.welcome}</small><h1>{user.firstName} {user.lastName}</h1><p>{maskEmail(user.email)}</p></div>
        <span className="profile-role">{roleLabel(user.role, language)}</span>
      </section>
      {message && <div className="profile-message" role="status">{message}</div>}
      <div className="profile-shell">
        <aside className="profile-sidebar" aria-label={text.profile}>
          {nav.map(([value, label, Icon]) => <button key={value} className={view === value ? 'active' : ''} onClick={() => setView(value)}><Icon size={18} /><span>{label}</span></button>)}
          {user.role === 'ADMIN' && <a href="/admin"><Settings size={18} />Admin dashboard</a>}
          <button className="profile-sidebar-logout" onClick={() => void logout()}><LogOut size={18} /><span>{copy.signOut}</span></button>
        </aside>
        <div className="profile-content">
          {view === 'overview' && <section className="profile-workspace">
            <div className="profile-section-title"><div><small>IMMOOVE</small><h2>{copy.overview}</h2><p>{copy.accountHub}</p></div></div>
            <div className="profile-stats">{stats.map(([label, value]) => <article key={label}><b>{value}</b><span>{label}</span></article>)}</div>
            <article className="profile-next-stay"><CalendarDays /><div><small>{copy.nextStay}</small><h3>{summary?.nextBookingId ? `${copy.booking} #${summary.nextBookingId}` : copy.noNextStay}</h3></div><button onClick={() => setView(summary?.nextBookingId ? 'trips' : 'saved')}>{summary?.nextBookingId ? copy.details : copy.exploreHomes}</button></article>
          </section>}
          {view === 'trips' && <ProfileTrips language={language} notify={notify} />}
          {view === 'saved' && <section className="profile-workspace"><div className="profile-section-title"><div><small>{copy.saved}</small><h2>{text.yourFavorites}</h2></div><b>{favorites.length}</b></div>
            {favorites.length ? <div className="saved-grid">{favorites.map((favorite) => <article key={favorite.listingId}><a className="saved-card-media" href={`/listings/${favorite.listingId}`}>{favorite.coverImageUrl ? <ResponsiveImage pictureClassName="saved-card-picture" src={favorite.coverImageUrl} alt={favorite.title} width={500} height={300} sizes="(max-width: 700px) calc(100vw - 76px), 340px" /> : <Heart />}</a><div><small>{serviceTypeLabel(favorite.serviceType, language, text.service)}</small><h3>{favorite.title}</h3><button onClick={() => void removeFavorite(favorite.listingId!)}><Heart fill="currentColor" size={17} />{text.delete}</button></div></article>)}</div> : <p className="profile-empty">{text.noFavorites}</p>}
          </section>}
          {view === 'personal' && <section className="profile-workspace"><div className="profile-section-title"><div><small>{copy.personal}</small><h2>{copy.identityTitle}</h2><p>{copy.identityText}</p></div></div>
            <div className="profile-form-grid"><form className="profile-panel profile-name-form" onSubmit={updateName}><label>{text.firstName}<input required value={name.firstName} onChange={(event) => setName({ ...name, firstName: event.target.value })} /></label><label>{text.lastName}<input required value={name.lastName} onChange={(event) => setName({ ...name, lastName: event.target.value })} /></label><button><Save size={16} />{text.save}</button></form>
              <div className="profile-panel profile-contact-form"><h3>{copy.contactTitle}</h3><p>{copy.contactText}</p>
                {!contactEditing ? <div className="protected-contact-list">
                  <div><span>{copy.email}<small>{copy.protectedValue}</small></span><b>{maskEmail(user.email)}</b></div>
                  <div><span>{copy.phone}<small>{copy.protectedValue}</small></span><b>{maskPhone(user.phone)}</b></div>
                  <button type="button" onClick={() => { setContact({ email: user.email, phone: user.phone || '' }); setContactEditing(true); }}><ShieldCheck size={16} />{copy.editContact}</button>
                </div> : <form className="protected-contact-edit" onSubmit={(event) => { event.preventDefault(); setContactConfirmOpen(true); }} autoComplete="off">
                  <label>{copy.email}<input type="email" required autoComplete="email" spellCheck={false} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></label>
                  <label>{copy.phone}<input type="tel" inputMode="tel" placeholder="+212612345678" required autoComplete="tel" spellCheck={false} value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label>
                  <div className="protected-contact-actions"><button><ShieldCheck size={16} />{copy.saveContact}</button><button type="button" className="quiet" onClick={() => { setContactEditing(false); setContact({ email: user.email, phone: user.phone || '' }); }}>{copy.cancelEdit}</button></div><small>{copy.contactChangeSession}</small>
                </form>}
              </div></div>
          </section>}
          {view === 'security' && <section className="profile-workspace"><div className="profile-section-title"><div><small>{copy.security}</small><h2>{copy.securityTitle}</h2></div></div>
            <div className="security-primary"><button onClick={() => setPasswordOpen(true)}><KeyRound />{copy.changePassword}</button></div>
            <details className="profile-advanced"><summary><span><Trash2 size={17} /><b>{copy.advanced}</b><small>{copy.advancedText}</small></span></summary><form onSubmit={deactivate} autoComplete="off"><h3>{copy.deleteAccount}</h3><p>{copy.deleteExplanation}</p><label>{copy.currentPassword}<input name="currentPassword" type="password" autoComplete="current-password" spellCheck={false} /></label><label>{copy.deleteType}<input autoComplete="off" spellCheck={false} value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label><button disabled={deleting || deleteConfirmation !== 'DELETE'}><Trash2 size={16} />{deleting ? copy.deleting : copy.deactivate}</button></form></details>
          </section>}
        </div>
      </div>
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onMessage={notify} />}
      {contactConfirmOpen && <ContactPasswordModal language={language} onClose={() => setContactConfirmOpen(false)} onConfirm={updateContact} />}
    </main>
  );
}
