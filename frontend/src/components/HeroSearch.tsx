import { useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchFilters, ServiceType } from '../types';

export default function HeroSearch({
  onSearch,
}: {
  onSearch: (
    filters: SearchFilters,
  ) => void;
}) {
  const [filters, setFilters] =
    useState<SearchFilters>({});

  const update = (
    key: keyof SearchFilters,
    value: string,
  ) => {
    setFilters({
      ...filters,
      [key]: value,
    });
  };

  return (
    <form
      className="search-panel"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(filters);
      }}
    >
      <label>
        <small>
          DATES DU SÉJOUR
        </small>

        <input
          type="date"
          aria-label="Date d’arrivée"
          onChange={(e) =>
            update(
              'check_in',
              e.target.value,
            )
          }
        />
      </label>

      <label>
        <small>
          VOYAGEURS
        </small>

        <select
          defaultValue=""
          onChange={(e) =>
            update(
              'guests',
              e.target.value,
            )
          }
        >
          <option value="">
            Ajouter des voyageurs
          </option>

          <option value="1">
            1 voyageur
          </option>

          <option value="2">
            2 voyageurs
          </option>

          <option value="4">
            4 voyageurs
          </option>

          <option value="6">
            6 voyageurs
          </option>
        </select>
      </label>

      <label>
        <small>
          SERVICE
        </small>

        <select
          defaultValue=""
          onChange={(e) =>
            update(
              'service_type',
              e.target.value as
                | ServiceType
                | '',
            )
          }
        >
          <option value="">
            Tous les services
          </option>

          <option value="VACATION_RENTAL">
            Locations de vacances
          </option>

          <option value="RESTAURANT_CAFE">
            Restaurants & Cafés
          </option>

          <option value="ACTIVITY">
            Activités & Loisirs
          </option>
        </select>
      </label>

      <button aria-label="Rechercher">
        <Search size={23} />
      </button>
    </form>
  );
}
