import { type FormEvent, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { ApiError, redirectToLogin, request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import PasswordField from './PasswordField';

export default function ChangePasswordModal({
  onClose,
  onMessage,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      onMessage(text.passwordMismatch);
      return;
    }
    setSubmitting(true);
    setCooldownMessage('');
    try {
      await request<void>('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      onClose();
      redirectToLogin();
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setCooldownMessage(error.message);
        setSubmitting(false);
        return;
      }
      onMessage(error instanceof Error ? error.message : text.passwordFailed);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal auth-modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label={text.close}>
          <X />
        </button>
        <small className="eyebrow">{text.security}</small>
        <h2>{text.changePassword}</h2>
        <p>{text.reconnectAll}</p>
        {cooldownMessage && (
          <div className="auth-error" role="alert">
            {cooldownMessage}
          </div>
        )}
        <PasswordField
          required
          aria-label={text.currentPassword}
          autoComplete="current-password"
          placeholder={text.currentPassword}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <PasswordField
          required
          aria-label={text.newPassword}
          minLength={12}
          autoComplete="new-password"
          placeholder={text.newPassword}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <PasswordField
          required
          aria-label={text.confirmPassword}
          minLength={12}
          autoComplete="new-password"
          placeholder={text.confirmPassword}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <button className="light-button" type="submit" disabled={submitting}>
          <KeyRound size={17} />
          {submitting ? text.changing : text.changePassword}
        </button>
      </form>
    </div>
  );
}
