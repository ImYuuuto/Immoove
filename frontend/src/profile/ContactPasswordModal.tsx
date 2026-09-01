import { type FormEvent, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import type { Language } from '../types';
import { profileCopy } from './profileI18n';

export default function ContactPasswordModal({
  language,
  onClose,
  onConfirm,
}: {
  language: Language;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const copy = profileCopy(language);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = String(new FormData(form).get('currentPassword') || '');
    form.reset();
    if (!password) return;
    setSubmitting(true);
    try {
      await onConfirm(password);
    } catch {
      // The parent displays the server error; keep this confirmation step open.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal auth-modal" autoComplete="off" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={copy.close}><X /></button>
        <small className="eyebrow">{copy.security}</small>
        <h2>{copy.confirmContactTitle}</h2>
        <p>{copy.confirmContactText}</p>
        <input name="currentPassword" type="password" required autoComplete="current-password" spellCheck={false} placeholder={copy.currentPassword} aria-label={copy.currentPassword} />
        <button className="light-button" type="submit" disabled={submitting}><ShieldCheck size={17} />{copy.confirmContact}</button>
      </form>
    </div>
  );
}
