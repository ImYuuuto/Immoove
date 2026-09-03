import { type CSSProperties, FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { useLanguage } from '../i18n/language';
import { request } from '../utils/request';
import { getPropertyDiscoveryOptions, searchProperties } from './api';
import type { PropertyDiscoveryOptions, PropertySearchResponse } from './types';
import './property.css';

const propertyPaths: Record<string, string> = {
  apartments: 'apartment',
  studios: 'studio',
  villas: 'villa',
};
const pathsByPropertyType = Object.fromEntries(
  Object.entries(propertyPaths).map(([path, type]) => [type, path]),
);
const copy = {
  fr: {
    title: 'Trouvez votre prochain logement',
    subtitle: 'Explorez des logements vérifiés partout au Maroc.',
    all: 'Tous les logements',
    apartments: 'Appartements',
    villas: 'Villas',
    studios: 'Studios',
    region: 'Région',
    city: 'Ville',
    citySearch: 'Rechercher une ville',
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    guests: 'Voyageurs',
    type: 'Type de logement',
    min: 'Prix minimum',
    max: 'Prix maximum',
    price: 'Fourchette de prix',
    bedrooms: 'Chambres minimum',
    bathrooms: 'Salles de bain minimum',
    amenities: 'Équipements',
    rating: 'Note minimum',
    instant: 'Disponible aux dates choisies',
    search: 'Rechercher',
    results: 'logements trouvés',
    empty: 'Aucun logement ne correspond à ces critères.',
    loading: 'Recherche des logements…',
    retry: 'Réessayer',
    previous: 'Précédent',
    next: 'Suivant',
    any: 'Tous',
    home: 'Accueil',
    moreFilters: 'Plus de filtres',
    fewerFilters: 'Moins de filtres',
  },
  en: {
    title: 'Find your next property',
    subtitle: 'Explore verified stays across Morocco.',
    all: 'All properties',
    apartments: 'Apartments',
    villas: 'Villas',
    studios: 'Studios',
    region: 'Region',
    city: 'City',
    citySearch: 'Search for a city',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    type: 'Property type',
    min: 'Minimum price',
    max: 'Maximum price',
    price: 'Price range',
    bedrooms: 'Minimum bedrooms',
    bathrooms: 'Minimum bathrooms',
    amenities: 'Amenities',
    rating: 'Minimum rating',
    instant: 'Available for selected dates',
    search: 'Search',
    results: 'properties found',
    empty: 'No properties match these filters.',
    loading: 'Finding properties…',
    retry: 'Try again',
    previous: 'Previous',
    next: 'Next',
    any: 'Any',
    home: 'Home',
    moreFilters: 'More filters',
    fewerFilters: 'Fewer filters',
  },
  ar: {
    title: 'اعثروا على إقامتكم القادمة',
    subtitle: 'استكشفوا إقامات موثوقة في جميع أنحاء المغرب.',
    all: 'كل الإقامات',
    apartments: 'شقق',
    villas: 'فيلات',
    studios: 'استوديوهات',
    region: 'الجهة',
    city: 'المدينة',
    citySearch: 'ابحث عن مدينة',
    checkIn: 'الوصول',
    checkOut: 'المغادرة',
    guests: 'الضيوف',
    type: 'نوع العقار',
    min: 'أدنى سعر',
    max: 'أعلى سعر',
    price: 'نطاق السعر',
    bedrooms: 'الحد الأدنى للغرف',
    bathrooms: 'الحد الأدنى للحمامات',
    amenities: 'التجهيزات',
    rating: 'أدنى تقييم',
    instant: 'متاح في التواريخ المختارة',
    search: 'بحث',
    results: 'إقامة متاحة',
    empty: 'لا توجد إقامات تطابق هذه المعايير.',
    loading: 'جارٍ البحث…',
    retry: 'إعادة المحاولة',
    previous: 'السابق',
    next: 'التالي',
    any: 'الكل',
    home: 'الرئيسية',
    moreFilters: 'المزيد من الفلاتر',
    fewerFilters: 'فلاتر أقل',
  },
};

function initialFilters(propertyPath?: string) {
  const query = new URLSearchParams(window.location.search);
  query.delete('region_id');
  query.delete('area_id');
  if (propertyPath && propertyPaths[propertyPath])
    query.set('property_type', propertyPaths[propertyPath]);
  return query;
}

export default function PropertyDirectoryPage({ propertyPath }: { propertyPath?: string }) {
  const { language } = useLanguage();
  const text = copy[language];
  const [filters, setFilters] = useState(() => initialFilters(propertyPath));
  const [options, setOptions] = useState<PropertyDiscoveryOptions | null>(null);
  const [data, setData] = useState<PropertySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(() =>
    ['min_price', 'max_price', 'bedrooms', 'bathrooms', 'min_rating', 'amenities', 'instant_available'].some((key) => initialFilters(propertyPath).has(key)),
  );
  const cities = options?.cities || [];
  const selectedCity = cities.find((item) => item.cityId === Number(filters.get('city_id')));
  const availableMinimum = Math.floor(options?.priceRange.minimum || 0);
  const availableMaximum = Math.ceil(options?.priceRange.maximum || availableMinimum);

  const load = async (next = filters) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(next);
      query.set('limit', '18');
      const [metadata, results] = await Promise.all([
        options ? Promise.resolve(options) : getPropertyDiscoveryOptions(),
        searchProperties(query),
      ]);
      setOptions(metadata);
      setData(results);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.empty);
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(filters);
    value ? next.set(name, value) : next.delete(name);
    next.delete('page');
    setFilters(next);
  };
  const setPriceRange = (minimum: number, maximum: number) => {
    const next = new URLSearchParams(filters);
    minimum > availableMinimum ? next.set('min_price', String(minimum)) : next.delete('min_price');
    maximum < availableMaximum ? next.set('max_price', String(maximum)) : next.delete('max_price');
    next.delete('page');
    setFilters(next);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const selectedPath = pathsByPropertyType[filters.get('property_type') || ''];
    const pathname = selectedPath ? `/properties/${selectedPath}` : '/properties';
    window.history.replaceState(null, '', `${pathname}${filters.toString() ? `?${filters}` : ''}`);
    void load(filters);
  };
  const page = Number(filters.get('page') || 1);
  const changePage = (value: number) => {
    const next = new URLSearchParams(filters);
    next.set('page', String(value));
    setFilters(next);
    window.history.replaceState(null, '', `${window.location.pathname}?${next}`);
    void load(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const favorite = async (listingId?: number) => {
    if (!listingId) return;
    try {
      await request(`/favorites/${listingId}/toggle`, { method: 'POST' });
    } catch {
      window.location.assign(
        `/?login=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    }
  };
  const amenityValues = (filters.get('amenities') || '').split(',').filter(Boolean);
  const activePropertyPath = pathsByPropertyType[filters.get('property_type') || ''];

  return (
    <main className="category-page property-discovery">
      <header className="category-topbar">
        <a className="brand" href="/">
          <b>I</b>immoove<span>.</span>
        </a>
        <a href="/">
          <ArrowLeft size={17} />
          {text.home}
        </a>
      </header>
      <nav className="category-navigation property-navigation" aria-label={text.type}>
        <a className={!activePropertyPath ? 'active' : ''} href="/properties">
          {text.all}
        </a>
        {(['apartments', 'studios', 'villas'] as const).map((key) => (
          <a
            className={activePropertyPath === key ? 'active' : ''}
            href={`/properties/${key}`}
            key={key}
          >
            {text[key]}
          </a>
        ))}
      </nav>
      <section className="property-hero">
        <small>
          <SlidersHorizontal size={14} /> IMMOOVE MOROCCO
        </small>
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </section>
      <form className="property-filters" onSubmit={submit}>
        <CitySearchFilter
          label={text.city}
          value={filters.get('city_id') || ''}
          onChange={(value) => set('city_id', value)}
          placeholder={text.citySearch}
          items={cities.map((item) => ({ value: item.cityId, label: item.name }))}
          selectedLabel={selectedCity?.name || ''}
        />
        <InputFilter
          label={text.checkIn}
          type="date"
          value={filters.get('check_in') || ''}
          onChange={(value) => set('check_in', value)}
        />
        <InputFilter
          label={text.checkOut}
          type="date"
          min={filters.get('check_in') || undefined}
          value={filters.get('check_out') || ''}
          onChange={(value) => set('check_out', value)}
        />
        <InputFilter
          label={text.guests}
          type="number"
          min="1"
          value={filters.get('guests') || ''}
          onChange={(value) => set('guests', value)}
        />
        {showMoreFilters && <div className="advanced-filters">
        {options && availableMaximum >= availableMinimum && <PriceRangeFilter
          label={text.price}
          minLabel={text.min}
          maxLabel={text.max}
          availableMinimum={availableMinimum}
          availableMaximum={availableMaximum}
          minValue={Number(filters.get('min_price') || availableMinimum)}
          maxValue={Number(filters.get('max_price') || availableMaximum)}
          onChange={setPriceRange}
        />}
        <InputFilter
          label={text.bedrooms}
          type="number"
          min="0"
          value={filters.get('bedrooms') || ''}
          onChange={(value) => set('bedrooms', value)}
        />
        <InputFilter
          label={text.bathrooms}
          type="number"
          min="0"
          value={filters.get('bathrooms') || ''}
          onChange={(value) => set('bathrooms', value)}
        />
        <SelectFilter
          label={text.rating}
          value={filters.get('min_rating') || ''}
          onChange={(value) => set('min_rating', value)}
          any={text.any}
          items={[5, 4, 3, 2, 1].map((value) => ({ value, label: `${value}+` }))}
        />
        <fieldset className="amenity-filter">
          <legend>{text.amenities}</legend>
          {options?.amenities.map((item) => (
            <label key={item.featureId}>
              <input
                type="checkbox"
                checked={amenityValues.includes(String(item.featureId))}
                onChange={(event) =>
                  set(
                    'amenities',
                    event.target.checked
                      ? [...amenityValues, String(item.featureId)].join(',')
                      : amenityValues.filter((value) => value !== String(item.featureId)).join(','),
                  )
                }
              />
              {item.name}
            </label>
          ))}
        </fieldset>
        <label className="instant-filter">
          <input
            type="checkbox"
            checked={filters.get('instant_available') === 'true'}
            onChange={(event) => set('instant_available', event.target.checked ? 'true' : '')}
          />
          {text.instant}
        </label>
        </div>}
        <div className="filter-actions">
          <button className="more-filters-button" type="button" aria-expanded={showMoreFilters} onClick={() => setShowMoreFilters((current) => !current)}>
            <SlidersHorizontal size={17} />{showMoreFilters ? text.fewerFilters : text.moreFilters}{showMoreFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="filter-search-button" type="submit"><Search size={17} />{text.search}</button>
        </div>
      </form>
      {loading ? (
        <div className="category-state">{text.loading}</div>
      ) : !data ? (
        <div className="category-state">
          <p>{error}</p>
          <button onClick={() => void load()}>{text.retry}</button>
        </div>
      ) : (
        <section className="category-results property-results">
          <h2>
            {data.pagination.total.toLocaleString()} {text.results}
          </h2>
          {data.items.length ? (
            <div className="listing-grid">
              {data.items.map((listing, index) => (
                <ListingCard
                  listing={listing}
                  imagePriority={index === 0}
                  onFavorite={favorite}
                  onBook={(item) =>
                    item.listingId && window.location.assign(`/listings/${item.listingId}`)
                  }
                  key={listing.listingId}
                />
              ))}
            </div>
          ) : (
            <div className="category-empty">{text.empty}</div>
          )}
          {data.pagination.totalPages > 1 && (
            <nav className="category-pagination">
              <button disabled={page <= 1} onClick={() => changePage(page - 1)}>
                <ArrowLeft size={16} />
                {text.previous}
              </button>
              <span>
                {page} / {data.pagination.totalPages}
              </span>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => changePage(page + 1)}
              >
                {text.next}
                <ArrowRight size={16} />
              </button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}

function InputFilter({
  label,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  type: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input {...props} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
function SelectFilter({
  label,
  value,
  onChange,
  any,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  any: string;
  items: Array<{ value: string | number; label: string }>;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{any}</option>
        {items.map((item) => (
          <option value={item.value} key={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CitySearchFilter({ label, value, selectedLabel, placeholder, onChange, items }: {
  label: string;
  value: string;
  selectedLabel: string;
  placeholder: string;
  onChange: (value: string) => void;
  items: Array<{ value: string | number; label: string }>;
}) {
  const [query, setQuery] = useState(selectedLabel);
  const [focused, setFocused] = useState(false);
  useEffect(() => { setQuery(selectedLabel); }, [selectedLabel]);
  const matches = query.trim()
    ? items.filter((item) => item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 8)
    : [];
  return <label className="city-search-filter">
    {label}
    <input
      type="search"
      placeholder={placeholder}
      value={query}
      onChange={(event) => {
        const next = event.target.value;
        setQuery(next);
        const match = items.find((item) => item.label.toLocaleLowerCase() === next.trim().toLocaleLowerCase());
        onChange(match ? String(match.value) : '');
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); if (value && selectedLabel) setQuery(selectedLabel); }}
    />
    {focused && query.trim() && <div className="city-search-results">
      {matches.map((item) => <button type="button" key={item.value} onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(item.label); onChange(String(item.value)); setFocused(false); }}>{item.label}</button>)}
    </div>}
  </label>;
}

function PriceRangeFilter({ label, minLabel, maxLabel, availableMinimum, availableMaximum, minValue, maxValue, onChange }: {
  label: string;
  minLabel: string;
  maxLabel: string;
  availableMinimum: number;
  availableMaximum: number;
  minValue: number;
  maxValue: number;
  onChange: (minimum: number, maximum: number) => void;
}) {
  const minimum = Math.max(availableMinimum, Math.min(minValue, availableMaximum));
  const maximum = Math.max(minimum, Math.min(maxValue, availableMaximum));
  const span = Math.max(1, availableMaximum - availableMinimum);
  const left = ((minimum - availableMinimum) / span) * 100;
  const right = 100 - ((maximum - availableMinimum) / span) * 100;
  return <fieldset className="price-range-filter">
    <legend>{label}</legend>
    <div><span>{minimum.toLocaleString()} MAD</span><span>{maximum.toLocaleString()} MAD</span></div>
    <div className="price-range-track" style={{ '--price-left': `${left}%`, '--price-right': `${right}%` } as CSSProperties}>
      <input aria-label={minLabel} type="range" min={availableMinimum} max={availableMaximum} step="1" value={minimum} onChange={(event) => onChange(Math.min(Number(event.target.value), maximum), maximum)} />
      <input aria-label={maxLabel} type="range" min={availableMinimum} max={availableMaximum} step="1" value={maximum} onChange={(event) => onChange(minimum, Math.max(Number(event.target.value), minimum))} />
    </div>
  </fieldset>;
}
