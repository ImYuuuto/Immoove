import { type FormEvent, useState } from 'react';
import { ArrowUpRight, LogOut, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';
import PasswordField from './PasswordField';

export default function AuthModal({
  onClose,
  onMessage,
  onAuthenticated,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const { text, language } = useLanguage();
  const [registerMode, setRegisterMode] = useState(false);
  const [renewalRequired, setRenewalRequired] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    acceptTerms: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedForm = event.currentTarget;
    const password = String(new FormData(submittedForm).get('password') || '');
    submittedForm.reset();

    try {
      if (renewalRequired) {
        await request('/legal/terms/accept', {
          method: 'POST',
          body: JSON.stringify({ acceptTerms: form.acceptTerms, language }),
        });
        const session = await request<{ user: AuthUser }>('/auth/session');
        onAuthenticated(session.user);
        onMessage(text.termsAccepted);
        onClose();
        return;
      }
      const result = await request<{ user: AuthUser }>(
        registerMode ? '/auth/register' : '/auth/login',
        {
          method: 'POST',

          body: JSON.stringify(
            registerMode
              ? {
                  first_name: form.first_name,
                  last_name: form.last_name,
                  email: form.email,
                  phone: form.phone,
                  password,
                  acceptTerms: form.acceptTerms,
                  language,
                }
              : {
                  email: form.email,
                  password,
                },
          ),
        },
      );

      if (result.user.requiresTermsAcceptance) {
        setForm({ ...form, acceptTerms: false });
        setRenewalRequired(true);
        return;
      }

      const session = await request<{ user: AuthUser }>('/auth/session');

      if (session.user.requiresTermsAcceptance) {
        setForm((current) => ({ ...current, acceptTerms: false }));
        setRenewalRequired(true);
        return;
      }

      onAuthenticated(session.user || result.user);

      onMessage(registerMode ? text.accountCreated : text.loginSuccess);

      onClose();
    } catch (error) {
      onMessage(error instanceof Error ? error.message : text.loginFailed);
    }
  };

  const cancelRenewal = async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => undefined);
    onClose();
    window.location.assign('/');
  };

  return (
    <div className="modal-backdrop" onMouseDown={renewalRequired ? undefined : onClose}>
      <form
        className="modal auth-modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!renewalRequired && (
          <button type="button" className="modal-close" onClick={onClose} aria-label={text.close}>
            <X />
          </button>
        )}

        <small className="eyebrow">{text.authEyebrow}</small>

        <h2>
          {renewalRequired
            ? text.renewTermsTitle
            : registerMode
              ? text.registerTitle
              : text.loginTitle}
        </h2>

        <p>
          {renewalRequired
            ? text.renewTermsText
            : registerMode
              ? text.registerText
              : text.loginText}
        </p>

        {registerMode && !renewalRequired && (
          <div className="auth-names">
            <input
              required
              aria-label={text.firstName}
              placeholder={text.firstName}
              value={form.first_name}
              onChange={(event) => update('first_name', event.target.value)}
            />

            <input
              required
              aria-label={text.lastName}
              placeholder={text.lastName}
              value={form.last_name}
              onChange={(event) => update('last_name', event.target.value)}
            />
          </div>
        )}

        {!renewalRequired && (
          <input
            required
            aria-label={text.email}
            type="email"
            placeholder={text.email}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
          />
        )}

        {registerMode && !renewalRequired && (
          <input
            aria-label={text.phone}
            type="tel"
            autoComplete="tel"
            placeholder={text.phoneOptional}
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
          />
        )}

        {!renewalRequired && (
          <PasswordField
            key={registerMode ? 'register-password' : 'login-password'}
            name="password"
            required
            aria-label={text.password}
            minLength={12}
            autoComplete={registerMode ? 'new-password' : 'current-password'}
            placeholder={text.password}
          />
        )}

        {(registerMode || renewalRequired) && (
          <label className="auth-consent">
            <input
              required
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(event) => update('acceptTerms', event.target.checked)}
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
        )}

        <button className="light-button" type="submit">
          {renewalRequired ? text.acceptUpdatedTerms : registerMode ? text.register : text.login}

          <ArrowUpRight size={17} />
        </button>

        {renewalRequired && (
          <button type="button" className="auth-switch" onClick={cancelRenewal}>
            <LogOut size={15} />
            {text.logout}
          </button>
        )}

        {!renewalRequired && (
          <button
            type="button"
            className="auth-switch"
            onClick={() => setRegisterMode(!registerMode)}
          >
            {registerMode ? text.switchLogin : text.switchRegister}
          </button>
        )}
      </form>
    </div>
  );
}
