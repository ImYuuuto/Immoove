import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { AuthUser } from '../types';
import { request } from '../utils/request';

export default function AuthModal({
  onClose,
  onMessage,
  onAuthenticated,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
  onAuthenticated: (user: AuthUser) => void;
}) {
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

      onAuthenticated(result.user);

      onMessage(
        registerMode
          ? 'Votre compte a été créé.'
          : 'Connexion réussie.',
      );

      onClose();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : 'Connexion impossible.',
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
          aria-label="Fermer"
        >
          <X />
        </button>

        <small className="eyebrow">
          BOUZID ESCAPES
        </small>

        <h2>
          {registerMode
            ? 'Créer un compte'
            : 'Bienvenue à nouveau'}
        </h2>

        <p>
          {registerMode
            ? 'Rejoignez la communauté Bouzid.'
            : 'Connectez-vous pour enregistrer vos adresses favorites.'}
        </p>

        {registerMode && (
          <div className="auth-names">
            <input
              required
              aria-label="Prénom"
              placeholder="Prénom"
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
              aria-label="Nom"
              placeholder="Nom"
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
          aria-label="Adresse e-mail"
          type="email"
          placeholder="Adresse e-mail"
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
          placeholder="Mot de passe (12 caractères minimum)"
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
            ? 'Créer mon compte'
            : 'Se connecter'}

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
            ? 'J’ai déjà un compte'
            : 'Créer un compte'}
        </button>
      </form>
    </div>
  );
}
