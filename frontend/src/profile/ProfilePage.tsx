import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, KeyRound, LogOut, Save, Trash2, UserRound } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { clearLocalSession, request } from '../utils/request';
import { decodeText } from '../utils/decodeText';
import ProfileListingCard from './ProfileListingCard';
import { maskEmail, normalizeListing } from './profileUtils';
import type { ListingEdit, ProfileListing, ProfileUser } from './types';
import './profile.css';

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [listings, setListings] = useState<ProfileListing[]>([]);
  const [favorites, setFavorites] = useState<ProfileListing[]>([]);
  const [name, setName] = useState({ firstName: '', lastName: '' });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request<{ user: ProfileUser }>('/profile'),
      request<{ items: Record<string, unknown>[] }>('/listings/mine'),
      request<{ items: Record<string, unknown>[] }>('/favorites'),
    ]).then(([profile, ownListings, saved]) => {
      setUser(profile.user);
      setName({ firstName: decodeText(profile.user.firstName), lastName: decodeText(profile.user.lastName) });
      setListings(ownListings.items.map(normalizeListing));
      setFavorites(saved.items.map(normalizeListing));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Impossible de charger votre profil.')).finally(() => setLoading(false));
  }, []);

  const initials = useMemo(() => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U', [user]);
  const notify = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 3500); };

  const updateName = async (event: FormEvent) => {
    event.preventDefault();
    const result = await request<{ user?: ProfileUser; item?: ProfileUser }>('/profile', { method: 'PATCH', body: JSON.stringify(name) });
    const updated = result.user || result.item;
    if (updated) setUser(updated);
    notify('Votre nom a été mis à jour.');
  };

  const updateListing = async (id: number, data: ListingEdit) => {
    const result = await request<{ item: Record<string, unknown> }>(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    const updated = normalizeListing(result.item);
    setListings((items) => items.map((item) => item.listingId === id ? { ...updated, status: 'pending' } : item));
    notify('Modification envoyée à l’administration pour validation.');
  };

  const deleteListing = async (id: number) => {
    await request<void>(`/listings/${id}`, { method: 'DELETE' });
    setListings((items) => items.filter((item) => item.listingId !== id));
    notify('L’annonce a été supprimée.');
  };

  const removeFavorite = async (id: number) => {
    await request(`/favorites/${id}/toggle`, { method: 'POST' });
    setFavorites((items) => items.filter((item) => item.listingId !== id));
  };

  const logout = async () => { await request('/auth/logout', { method: 'POST' }).catch(() => undefined); window.location.assign('/'); };
  const deleteProfile = async () => { await request<void>('/profile', { method: 'DELETE' }); clearLocalSession(); window.location.assign('/'); };

  if (loading) return <div className="profile-state">Chargement de votre profil…</div>;
  if (error || !user) return <div className="profile-state"><UserRound size={38} /><h1>Profil indisponible</h1><p>{error}</p><a href="/">Retour à l’accueil</a></div>;

  return <main className="profile-page"><header className="profile-topbar"><a className="brand" href="/"><b>B</b>bouzid<span>.</span></a><a href="/"><ArrowLeft size={17} />Retour au site</a></header><section className="profile-hero"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="Photo de profil" /> : <span>{initials}</span>}</div><div><small>MON PROFIL</small><h1>{decodeText(user.firstName)} {decodeText(user.lastName)}</h1><p>{maskEmail(decodeText(user.email))}</p></div><span className="profile-role">{decodeText(user.role)}</span></section>

    {message && <div className="profile-message" role="status">{message}</div>}

    <section className="profile-grid"><article className="profile-panel"><div className="profile-panel-heading"><div><small>INFORMATIONS</small><h2>Votre identité</h2></div></div><form className="profile-name-form" onSubmit={updateName}><label>Prénom<input required value={name.firstName} onChange={(event) => setName({ ...name, firstName: event.target.value })} /></label><label>Nom<input required value={name.lastName} onChange={(event) => setName({ ...name, lastName: event.target.value })} /></label><button><Save size={16} />Enregistrer</button></form><div className="profile-security-actions"><button onClick={() => setPasswordOpen(true)}><KeyRound size={17} />Changer le mot de passe</button><button onClick={logout}><LogOut size={17} />Se déconnecter</button></div></article>

      <article className="profile-panel profile-favorites"><div className="profile-panel-heading"><div><small>COUPS DE CŒUR</small><h2>Vos favoris</h2></div><b>{favorites.length}</b></div>{favorites.length ? <div className="favorite-list">{favorites.map((favorite) => <div key={favorite.listingId}><div>{favorite.coverImageUrl ? <img src={favorite.coverImageUrl} alt={decodeText(favorite.title)} /> : <Heart />}</div><span><b>{decodeText(favorite.title)}</b><small>{favorite.serviceType || 'Service'}</small></span><button onClick={() => void removeFavorite(favorite.listingId!)} aria-label={`Retirer ${decodeText(favorite.title)} des favoris`}><Heart fill="currentColor" size={17} /></button></div>)}</div> : <p className="profile-empty">Vous n’avez encore enregistré aucun favori.</p>}</article>
    </section>

    <section className="profile-owned"><div className="profile-panel-heading"><div><small>VOS SERVICES</small><h2>Vos annonces</h2><p>Les modifications doivent être confirmées par un administrateur.</p></div><b>{listings.length}</b></div>{listings.length ? <div className="profile-listing-grid">{listings.map((listing) => <ProfileListingCard key={listing.listingId} listing={listing} onUpdate={updateListing} onDelete={deleteListing} />)}</div> : <div className="profile-empty">Vous n’avez publié aucune annonce.</div>}</section>

    <section className="profile-danger"><div><small>ZONE SENSIBLE</small><h2>Supprimer votre profil</h2><p>Cette action est définitive et supprimera votre accès au compte.</p></div>{confirmDelete ? <div className="profile-delete-confirm"><span>Confirmez-vous la suppression définitive ?</span><button onClick={() => void deleteProfile()}><Trash2 size={16} />Oui, supprimer</button><button className="quiet" onClick={() => setConfirmDelete(false)}>Annuler</button></div> : <button onClick={() => setConfirmDelete(true)}><Trash2 size={16} />Supprimer mon profil</button>}</section>

    {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} onMessage={notify} />}
  </main>;
}
