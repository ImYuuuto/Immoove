import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { useLanguage } from '../i18n/language';
import { request } from '../utils/request';
import { getPropertyDiscoveryOptions, searchProperties } from './api';
import type { PropertyDiscoveryOptions, PropertySearchResponse } from './types';
import './category.css';

const propertyPaths: Record<string, string> = {
  apartments: 'apartment',
  villas: 'villa',
  houses: 'house',
  riads: 'riad',
  'other-stays': 'other',
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
    houses: 'Maisons',
    riads: 'Riads',
    other: 'Autres séjours',
    region: 'Région',
    city: 'Ville',
    area: 'Quartier / zone',
    checkIn: 'Arrivée',
    checkOut: 'Départ',
    guests: 'Voyageurs',
    type: 'Type de logement',
    min: 'Prix minimum',
    max: 'Prix maximum',
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
  },
  en: {
    title: 'Find your next property',
    subtitle: 'Explore verified stays across Morocco.',
    all: 'All properties',
    apartments: 'Apartments',
    villas: 'Villas',
    houses: 'Houses',
    riads: 'Riads',
    other: 'Other stays',
    region: 'Region',
    city: 'City',
    area: 'Area',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    type: 'Property type',
    min: 'Minimum price',
    max: 'Maximum price',
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
  },
  ar: {
    title: 'اعثروا على إقامتكم القادمة',
    subtitle: 'استكشفوا إقامات موثوقة في جميع أنحاء المغرب.',
    all: 'كل الإقامات',
    apartments: 'شقق',
    villas: 'فيلات',
    houses: 'منازل',
    riads: 'رياض',
    other: 'إقامات أخرى',
    region: 'الجهة',
    city: 'المدينة',
    area: 'المنطقة',
    checkIn: 'الوصول',
    checkOut: 'المغادرة',
    guests: 'الضيوف',
    type: 'نوع العقار',
    min: 'أدنى سعر',
    max: 'أعلى سعر',
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
  },
};

function initialFilters(propertyPath?: string) {
  const query = new URLSearchParams(window.location.search);
  if (propertyPath && propertyPaths[propertyPath])
    query.set('property_type', propertyPaths[propertyPath]);
  return query;
}

export default function CategoriesPage({ propertyPath }: { propertyPath?: string }) {
  const { language } = useLanguage();
  const text = copy[language];
  const [filters, setFilters] = useState(() => initialFilters(propertyPath));
  const [options, setOptions] = useState<PropertyDiscoveryOptions | null>(null);
  const [data, setData] = useState<PropertySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const cities = useMemo(
    () =>
      options?.cities.filter(
        (item) => !filters.get('region_id') || item.regionId === Number(filters.get('region_id')),
      ) || [],
    [options, filters],
  );
  const areas = useMemo(
    () =>
      options?.areas.filter(
        (item) => !filters.get('city_id') || item.cityId === Number(filters.get('city_id')),
      ) || [],
    [options, filters],
  );

  const load = async (next = filters) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(next);
      query.set('service_type', 'VACATION_RENTAL');
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
    if (name === 'region_id') {
      next.delete('city_id');
      next.delete('area_id');
    }
    if (name === 'city_id') next.delete('area_id');
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
        {(['apartments', 'villas', 'houses', 'riads', 'other-stays'] as const).map((key) => (
          <a
            className={activePropertyPath === key ? 'active' : ''}
            href={`/properties/${key}`}
            key={key}
          >
            {key === 'other-stays' ? text.other : text[key]}
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
        <SelectFilter
          label={text.region}
          value={filters.get('region_id') || ''}
          onChange={(value) => set('region_id', value)}
          any={text.any}
          items={options?.regions.map((item) => ({ value: item.regionId, label: item.name })) || []}
        />
        <SelectFilter
          label={text.city}
          value={filters.get('city_id') || ''}
          onChange={(value) => set('city_id', value)}
          any={text.any}
          items={cities.map((item) => ({ value: item.cityId, label: item.name }))}
        />
        <SelectFilter
          label={text.area}
          value={filters.get('area_id') || ''}
          onChange={(value) => set('area_id', value)}
          any={text.any}
          items={areas.map((item) => ({ value: item.areaId, label: item.name }))}
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
        <SelectFilter
          label={text.type}
          value={filters.get('property_type') || ''}
          onChange={(value) => set('property_type', value)}
          any={text.any}
          items={
            options?.propertyTypes.map((item) => ({ value: item.slug, label: item.name })) || []
          }
        />
        <InputFilter
          label={text.min}
          type="number"
          min="0"
          value={filters.get('min_price') || ''}
          onChange={(value) => set('min_price', value)}
        />
        <InputFilter
          label={text.max}
          type="number"
          min="0"
          value={filters.get('max_price') || ''}
          onChange={(value) => set('max_price', value)}
        />
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
        <button type="submit">
          <Search size={17} />
          {text.search}
        </button>
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
