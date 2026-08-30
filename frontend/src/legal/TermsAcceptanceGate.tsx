import { type FormEvent, useEffect, useState } from 'react';
import { ArrowUpRight, LogOut } from 'lucide-react';
import { useLanguage } from '../i18n/language';
import type { AuthUser } from '../types';
import { request } from '../utils/request';

export default function TermsAcceptanceGate() {
  const { language, text } = useLanguage();
  const [required, setRequired] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const show = () => {
      setAccepted(false);
      setRequired(true);
    };

    window.addEventListener('terms:required', show);
    request<{ user: AuthUser }>('/auth/session')
      .then(({ user }) => {
        if (user.requiresTermsAcceptance) show();
      })
      .catch(() => undefined);

    return () => window.removeEventListener('terms:required', show);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accepted) return;
    setSubmitting(true);
    setError('');
    try {
      await request('/legal/terms/accept', {
        method: 'POST',
        body: JSON.stringify({ acceptTerms: true, language }),
      });
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      setSubmitting(false);
    }
  };

  const logout = async () => {
    setSubmitting(true);
    await request('/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/');
  };

  if (!required) return null;

  return (
    <div className="modal-backdrop legal-consent-backdrop" role="presentation">
      <form className="modal auth-modal legal-consent-modal" onSubmit={submit}>
        <small className="eyebrow">{text.termsOfUse}</small>
        <h2>{text.renewTermsTitle}</h2>
        <p>{text.renewTermsText}</p>

        <label className="auth-consent">
          <input
            required
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            {text.acceptTermsPrefix}{' '}
            <a href={`/terms?language=${language}`} target="_blank" rel="noreferrer">
              {text.termsOfUse}
            </a>{' '}
            {text.and}{' '}
            <a href={`/privacy?language=${language}`} target="_blank" rel="noreferrer">
              {text.privacyPolicy}
            </a>
          </span>
        </label>

        {error && (
          <p className="legal-consent-error" role="alert">
            {error}
          </p>
        )}

        <button className="light-button" type="submit" disabled={submitting || !accepted}>
          {text.acceptUpdatedTerms}
          <ArrowUpRight size={17} />
        </button>
        <button className="auth-switch" type="button" onClick={logout} disabled={submitting}>
          <LogOut size={15} />
          {text.logout}
        </button>
      </form>
    </div>
  );
}
