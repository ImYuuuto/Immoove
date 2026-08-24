import { useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchFilters, ServiceType } from '../types';
import { useLanguage } from '../i18n/language';

export default function HeroSearch({
  onSearch,
}: {
  onSearch: (
    filters: SearchFilters,
  ) => void;
}) {
  const { text } = useLanguage();
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
          {text.dates}
        </small>

        <input
          type="date"
          aria-label={text.arrivalDate}
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
          {text.guests}
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
            {text.addGuests}
          </option>

          <option value="1">
            1 {text.guest}
          </option>

          <option value="2">
            2 {text.guestsPlural}
          </option>

          <option value="4">
            4 {text.guestsPlural}
          </option>

          <option value="6">
            6 {text.guestsPlural}
          </option>
        </select>
      </label>

      <label>
        <small>
          {text.service}
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
            {text.allServices}
          </option>

          <option value="VACATION_RENTAL">
            {text.stay}
          </option>

          <option value="RESTAURANT_CAFE">
            {text.dining}
          </option>

          <option value="ACTIVITY">
            {text.explore}
          </option>
        </select>
      </label>

      <button aria-label={text.search}>
        <Search size={23} />
      </button>
    </form>
  );
}
