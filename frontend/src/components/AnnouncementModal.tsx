import { type FormEvent, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import type { Announcement } from '../types';
import { request } from '../utils/request';

export default function AnnouncementModal({
  onClose,
  onMessage,
}: {
  onClose: () => void;
  onMessage: (message: string) => void;
}) {
  const [data, setData] =
    useState<Announcement>({
      service_type:
        'VACATION_RENTAL',
      title: '',
      description: '',
      address: '',
      contact_phone: '',
    });

  const update = (
    key: keyof Announcement,
    value: string,
  ) => {
    setData({
      ...data,
      [key]: value,
    });
  };

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    try {
      await request(
        '/announcements/request',
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${
              localStorage.getItem(
                'bouzid_token',
              ) || ''
            }`,
          },

          body: JSON.stringify(data),
        },
      );

      onMessage(
        'Votre annonce a été envoyée.',
      );

      onClose();
    } catch (error) {
      onMessage(
        error instanceof Error
          ? error.message
          : 'Impossible d’envoyer la demande.',
      );
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <form
        className="modal"
        onSubmit={submit}
        onMouseDown={(e) =>
          e.stopPropagation()
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
          REJOINDRE BOUZID
        </small>

        <h2>
          Publier une annonce
        </h2>

        <p>
          Présentez votre adresse à notre équipe.
        </p>

        <select
          value={data.service_type}
          onChange={(e) =>
            update(
              'service_type',
              e.target.value,
            )
          }
        >
          <option value="VACATION_RENTAL">
            Location de vacances
          </option>

          <option value="RESTAURANT_CAFE">
            Restaurant ou café
          </option>

          <option value="ACTIVITY">
            Activité
          </option>

          <option value="CAR_RENTAL">
            Location de voiture
          </option>
        </select>

        <input
          required
          placeholder="Nom de votre adresse"
          value={data.title}
          onChange={(e) =>
            update(
              'title',
              e.target.value,
            )
          }
        />

        <input
          required
          placeholder="Adresse"
          value={data.address}
          onChange={(e) =>
            update(
              'address',
              e.target.value,
            )
          }
        />

        <input
          placeholder="Téléphone"
          value={data.contact_phone}
          onChange={(e) =>
            update(
              'contact_phone',
              e.target.value,
            )
          }
        />

        <textarea
          placeholder="Décrivez votre activité"
          value={data.description}
          onChange={(e) =>
            update(
              'description',
              e.target.value,
            )
          }
        />

        <button
          className="light-button"
          type="submit"
        >
          Envoyer la demande
          <ArrowUpRight size={17} />
        </button>
      </form>
    </div>
  );
}

