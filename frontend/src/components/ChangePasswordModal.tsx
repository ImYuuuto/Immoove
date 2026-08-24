import { type FormEvent, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { ApiError, redirectToLogin, request } from '../utils/request';

export default function ChangePasswordModal({ onClose, onMessage }: { onClose: () => void; onMessage: (message: string) => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { onMessage('Les nouveaux mots de passe ne correspondent pas.'); return; }
    setSubmitting(true);
    setCooldownMessage('');
    try {
      await request<void>('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) });
      onClose();
      redirectToLogin();
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setCooldownMessage(error.message);
        setSubmitting(false);
        return;
      }
      onMessage(error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.');
      setSubmitting(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal auth-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X /></button><small className="eyebrow">SÉCURITÉ DU COMPTE</small><h2>Modifier le mot de passe</h2><p>Vous devrez vous reconnecter sur tous vos appareils.</p>{cooldownMessage && <div className="auth-error" role="alert">{cooldownMessage}</div>}<input required type="password" autoComplete="current-password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><input required type="password" minLength={12} autoComplete="new-password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><input required type="password" minLength={12} autoComplete="new-password" placeholder="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /><button className="light-button" type="submit" disabled={submitting}><KeyRound size={17} />{submitting ? 'Modification…' : 'Modifier le mot de passe'}</button></form></div>;
}
