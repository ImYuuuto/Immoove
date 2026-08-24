import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { request } from '../utils/request';
import { useLanguage } from '../i18n/language';

export default function AuthModal({
  onClose,
  onMessage,
  onAuthenticated,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const { text } = useLanguage();
  const [registerMode, setRegisterMode] =
    useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    try {
      const result =
        await request<{ user: AuthUser }>(
          registerMode
            ? '/auth/register'
            : '/auth/login',
          {
            method: 'POST',

            body: JSON.stringify(
              registerMode
                ? form
                : {
                    email: form.email,
                    password: form.password,
                  },
            ),
          },
        );

      const session = await request<{ user: AuthUser }>('/auth/session');

      onAuthenticated(session.user || result.user);

      onMessage(
        registerMode
          ? text.accountCreated
          : text.loginSuccess,
      );

      onClose();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : text.loginFailed,
      );
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <form
        className="modal auth-modal"
        onSubmit={submit}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={text.close}
        >
          <X />
        </button>

        <small className="eyebrow">
          {text.authEyebrow}
        </small>

        <h2>
          {registerMode
            ? text.registerTitle
            : text.loginTitle}
        </h2>

        <p>
          {registerMode
            ? text.registerText
            : text.loginText}
        </p>

        {registerMode && (
          <div className="auth-names">
            <input
              required
              aria-label={text.firstName}
              placeholder={text.firstName}
              value={form.first_name}
              onChange={(event) =>
                update(
                  'first_name',
                  event.target.value,
                )
              }
            />

            <input
              required
              aria-label={text.lastName}
              placeholder={text.lastName}
              value={form.last_name}
              onChange={(event) =>
                update(
                  'last_name',
                  event.target.value,
                )
              }
            />
          </div>
        )}

        <input
          required
          aria-label={text.email}
          type="email"
          placeholder={text.email}
          value={form.email}
          onChange={(event) =>
            update(
              'email',
              event.target.value,
            )
          }
        />

        <input
          required
          aria-label="Mot de passe"
          minLength={12}
          type="password"
          placeholder={text.password}
          value={form.password}
          onChange={(event) =>
            update(
              'password',
              event.target.value,
            )
          }
        />

        <button
          className="light-button"
          type="submit"
        >
          {registerMode
            ? text.register
            : text.login}

          <ArrowUpRight size={17} />
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() =>
            setRegisterMode(!registerMode)
          }
        >
          {registerMode
            ? text.switchLogin
            : text.switchRegister}
        </button>
      </form>
    </div>
  );
}
