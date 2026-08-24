import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, KeyRound, LogOut, Save, Trash2, UserRound } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AuthModal from '../components/AuthModal';
import { ApiError, clearLocalSession, request } from '../utils/request';
import ProfileListingCard from './ProfileListingCard';
import { maskEmail } from './profileUtils';
import type { ListingEdit, ProfileListing, ProfileUser } from './types';
import './profile.css';
import { useLanguage } from '../i18n/language';

export default function ProfilePage() {
  const { language, text } = useLanguage();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [listings, setListings] = useState<ProfileListing[]>([]);
  const [favorites, setFavorites] = useState<ProfileListing[]>([]);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const [profile, ownListings, saved] = await Promise.all([
      request<{ user: ProfileUser }>('/profile'),
      request<{ items: ProfileListing[] }>('/listings/mine'),
      request<{ items: ProfileListing[] }>('/favorites'),
      ]);
      setUser(profile.user);
      setName({ firstName: profile.user.firstName, lastName: profile.user.lastName });
      setListings(ownListings.items);
      setFavorites(saved.items);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setAuthOpen(true);
      } else {
        setError(cause instanceof Error ? cause.message : text.profileLoadFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const requireLogin = () => { setUser(null); setPasswordOpen(false); setAuthOpen(true); };
    window.addEventListener('auth:unauthorized', requireLogin);
    return () => window.removeEventListener('auth:unauthorized', requireLogin);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, []);

  const initials = useMemo(() => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U', [user]);
  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 3500); };

  const updateName = async (event: FormEvent) => {
    event.preventDefault();
    const result = await request<{ user?: ProfileUser; item?: ProfileUser }>('/profile', { method: 'PATCH', body: JSON.stringify(name) });
    const updated = result.user || result.item;
    if (updated) setUser(updated);
    notify(text.nameUpdated);
  };

  const updateListing = async (id: number, data: ListingEdit) => {
    const result = await request<{ item: ProfileListing }>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    setListings((items) => items.map((item) => item.listingId === id ? result.item : item));
    notify(text.editSubmitted);
  };

  const deleteListing = async (id: number) => {
    await request<void>(`/listings/${id}`, { method: 'DELETE' });
    setListings((items) => items.filter((item) => item.listingId !== id));
    notify(text.listingDeleted);
  };

  const removeFavorite = async (id: number) => {
    await request(`/favorites/${id}/toggle`, { method: 'POST' });
    setFavorites((items) => items.filter((item) => item.listingId !== id));
  };

  const logout = async () => { await request('/auth/logout', { method: 'POST' }).catch(() => undefined); clearLocalSession(); window.location.assign('/'); };
  const deleteProfile = async () => { await request<void>('/profile', { method: 'DELETE' }); clearLocalSession(); window.location.assign('/'); };

  if (loading) return <div className="profile-state">{text.loadingProfile}</div>;
  if (!user) return <main className="profile-page"><header className="profile-topbar"><a className="brand" href="/"><b>B</b>bouzid<span>.</span></a><button className="profile-login" onClick={() => setAuthOpen(true)}>{text.login}</button></header><div className="profile-state"><UserRound size={38} /><h1>{error ? text.profileUnavailable : text.connect}</h1><p>{error || text.profileLoginText}</p><button className="profile-login" onClick={() => setAuthOpen(true)}>{text.login}</button></div>{authOpen && <AuthModal onClose={() => setAuthOpen(false)} onMessage={notify} onAuthenticated={() => { setAuthOpen(false); void loadProfile(); }} />}{message && <div className="toast">{message}</div>}</main>;

  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  return <main className="profile-page"><header className="profile-topbar"><a className="brand" href="/"><b>B</b>bouzid<span>.</span></a><a href="/"><ArrowLeft size={17} />{text.backSite}</a></header><section className="profile-hero"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt={text.profile} /> : <span>{initials}</span>}</div><div><small>{text.myProfile}</small><h1>{user.firstName} {user.lastName}</h1><p>{maskEmail(user.email)}</p></div><span className="profile-role">{user.role}</span></section>

    {message && <div className="profile-message" role="status">{message}</div>}

    <section className="profile-grid"><article className="profile-panel"><div className="profile-panel-heading"><div><small>{text.information}</small><h2>{text.identity}</h2></div></div><form className="profile-name-form" onSubmit={updateName}><label>{text.firstName}<input required value={name.firstName} onChange={(event) => setName({ ...name, firstName: event.target.value })} /></label><label>{text.lastName}<input required value={name.lastName} onChange={(event) => setName({ ...name, lastName: event.target.value })} /></label><button><Save size={16} />{text.save}</button></form><div className="profile-security-actions"><button onClick={() => setPasswordOpen(true)}><KeyRound size={17} />{text.changePassword}</button><button onClick={logout}><LogOut size={17} />{text.logout}</button></div></article>

      <article className="profile-panel profile-favorites"><div className="profile-panel-heading"><div><small>{text.favorites}</small><h2>{text.yourFavorites}</h2></div><b>{favorites.length}</b></div>{favorites.length ? <div className="favorite-list">{favorites.map((favorite) => <div key={favorite.listingId}><div>{favorite.coverImageUrl ? <img src={favorite.coverImageUrl} alt={favorite.title} /> : <Heart />}</div><span><b>{favorite.title}</b><small>{favorite.serviceType || text.service}</small></span><button onClick={() => void removeFavorite(favorite.listingId!)} aria-label={`${text.delete} ${favorite.title}`}><Heart fill="currentColor" size={17} /></button></div>)}</div> : <p className="profile-empty">{text.noFavorites}</p>}</article>
    </section>

    <section className="profile-owned"><div className="profile-panel-heading"><div><small>{text.yourServices}</small><h2>{text.yourListings}</h2><p>{text.editsNeedApproval}</p></div><b>{listings.length}</b></div>{listings.length ? <div className="profile-listing-grid">{listings.map((listing) => <ProfileListingCard key={listing.listingId} listing={listing} onUpdate={updateListing} onDelete={deleteListing} locale={locale} />)}</div> : <div className="profile-empty">{text.noListings}</div>}</section>

    <section className="profile-danger"><div><small>{text.dangerZone}</small><h2>{text.deleteProfile}</h2><p>{text.deleteProfileText}</p></div>{confirmDelete ? <div className="profile-delete-confirm"><span>{text.confirmDelete}</span><button onClick={() => void deleteProfile()}><Trash2 size={16} />{text.yesDelete}</button><button className="quiet" onClick={() => setConfirmDelete(false)}>{text.cancel}</button></div> : <button onClick={() => setConfirmDelete(true)}><Trash2 size={16} />{text.deleteProfile}</button>}</section>

    {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onMessage={notify} />}
  </main>;
}
