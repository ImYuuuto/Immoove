import { type FormEvent, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { ApiError, redirectToLogin, request } from '../utils/request';
import { useLanguage } from '../i18n/language';

export default function ChangePasswordModal({
  onClose,
  onMessage,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get('currentPassword') || '');
    const newPassword = String(data.get('newPassword') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');
    if (newPassword !== confirmPassword) {
      onMessage(text.passwordMismatch);
      form.reset();
      return;
    }
    setSubmitting(true);
    setCooldownMessage('');
    form.reset();
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
        <input
          type="password"
          name="currentPassword"
          required
          aria-label={text.currentPassword}
          autoComplete="current-password"
          placeholder={text.currentPassword}
        />
        <input
          type="password"
          name="newPassword"
          required
          aria-label={text.newPassword}
          minLength={12}
          autoComplete="new-password"
          placeholder={text.newPassword}
        />
        <input
          type="password"
          name="confirmPassword"
          required
          aria-label={text.confirmPassword}
          minLength={12}
          autoComplete="new-password"
          placeholder={text.confirmPassword}
        />
        <button className="light-button" type="submit" disabled={submitting}>
          <KeyRound size={17} />
          {submitting ? text.changing : text.changePassword}
        </button>
      </form>
    </div>
  );
}
