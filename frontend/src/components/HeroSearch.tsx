import { useState } from 'react';
import { Search } from 'lucide-react';
import type { RentalTerm, SearchFilters } from '../types';
import { useLanguage } from '../i18n/language';

export default function HeroSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const { text } = useLanguage();
  const [filters, setFilters] = useState<SearchFilters>({});

  const update = (key: keyof SearchFilters, value: string) => {
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
        <small>{text.dates}</small>

        <input
          type="date"
          aria-label={text.arrivalDate}
          onChange={(e) => update('check_in', e.target.value)}
        />
      </label>

      <label>
        <small>{text.guests}</small>

        <select defaultValue="" onChange={(e) => update('guests', e.target.value)}>
          <option value="">{text.addGuests}</option>

          <option value="1">1 {text.guest}</option>

          <option value="2">2 {text.guestsPlural}</option>

          <option value="4">4 {text.guestsPlural}</option>

          <option value="6">6 {text.guestsPlural}</option>
        </select>
      </label>

      <label>
        <small>{text.rentalTerm}</small>

        <select
          defaultValue=""
          onChange={(e) => update('rental_term', e.target.value as RentalTerm | '')}
        >
          <option value="">{text.allRentalTerms}</option>
          <option value="short_term">{text.shortTerm}</option>
          <option value="long_term">{text.longTerm}</option>
          <option value="both">{text.bothRentalTerms}</option>
        </select>
      </label>

      <button aria-label={text.search}>
        <Search size={23} />
      </button>
    </form>
  );
}
