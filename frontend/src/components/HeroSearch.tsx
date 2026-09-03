import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, UsersRound } from 'lucide-react';
import type { SearchFilters } from '../types';
import { useLanguage } from '../i18n/language';
import { getPropertyDiscoveryOptions } from '../properties/api';

const copy = {
  fr: { where: 'Où ?', city: 'Rechercher une ville', when: 'Quand ?', checkIn: 'Arrivée', checkOut: 'Départ', chooseDates: 'Choisir les dates', who: 'Qui ?', guests: 'Nombre de voyageurs' },
  en: { where: 'Where?', city: 'Search destinations', when: 'When?', checkIn: 'Check in', checkOut: 'Check out', chooseDates: 'Choose dates', who: 'Who?', guests: 'Number of guests' },
  ar: { where: 'أين؟', city: 'ابحث عن مدينة', when: 'متى؟', checkIn: 'الوصول', checkOut: 'المغادرة', chooseDates: 'اختر التواريخ', who: 'من؟', guests: 'عدد الضيوف' },
};

type City = { cityId: number; name: string };

export default function HeroSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const { text, language } = useLanguage();
  const labels = copy[language];
  const [filters, setFilters] = useState<SearchFilters>({});
  const [cities, setCities] = useState<City[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    getPropertyDiscoveryOptions().then((options) => setCities(options.cities)).catch(() => setCities([]));
  }, []);

  const matchingCities = cityQuery.trim()
    ? cities.filter((city) => city.name.toLocaleLowerCase().includes(cityQuery.trim().toLocaleLowerCase())).slice(0, 8)
    : [];
  const update = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <form className="search-panel" onSubmit={(event) => { event.preventDefault(); onSearch(filters); }}>
      <div className="search-control search-location">
        <MapPin size={18} />
        <label htmlFor="hero-city"><small>{labels.where}</small></label>
        <input id="hero-city" type="search" autoComplete="off" placeholder={labels.city} value={cityQuery}
          onFocus={() => setCityOpen(true)} onBlur={() => window.setTimeout(() => setCityOpen(false), 120)}
          onChange={(event) => {
            const value = event.target.value;
            setCityQuery(value);
            const exact = cities.find((city) => city.name.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
            update('city_id', exact ? String(exact.cityId) : '');
          }} />
        {cityOpen && cityQuery.trim() && <div className="hero-city-results">
          {matchingCities.map((city) => <button type="button" key={city.cityId} onMouseDown={(event) => event.preventDefault()} onClick={() => { setCityQuery(city.name); update('city_id', String(city.cityId)); setCityOpen(false); }}><MapPin size={15} />{city.name}</button>)}
        </div>}
      </div>

      <div className="search-control search-dates" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCalendarOpen(false); }}>
        <CalendarDays size={18} />
        <small>{labels.when}</small>
        <button type="button" className="date-range-trigger" onClick={() => setCalendarOpen((open) => !open)}>
          {filters.check_in ? <><span><small>{labels.checkIn}</small>{formatDateLabel(filters.check_in, language)}</span><i>→</i><span><small>{labels.checkOut}</small>{filters.check_out ? formatDateLabel(filters.check_out, language) : labels.chooseDates}</span></> : <b>{labels.chooseDates}</b>}
        </button>
        {calendarOpen && <DateRangeCalendar language={language} labels={labels} checkIn={filters.check_in} checkOut={filters.check_out} onChange={(checkIn, checkOut) => { setFilters((current) => ({ ...current, check_in: checkIn, check_out: checkOut })); if (checkOut) setCalendarOpen(false); }} />}
      </div>

      <div className="search-control search-guests">
        <UsersRound size={18} />
        <label htmlFor="hero-guests"><small>{labels.who}</small></label>
        <input id="hero-guests" type="number" inputMode="numeric" min="1" placeholder={labels.guests} value={filters.guests || ''} onChange={(event) => update('guests', event.target.value)} />
      </div>

      <button className="search-submit" aria-label={text.search}><Search size={23} /></button>
    </form>
  );
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string, language: 'fr' | 'en' | 'ar') {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language === 'ar' ? 'ar-MA' : 'fr-MA', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`));
}

function DateRangeCalendar({ language, labels, checkIn, checkOut, onChange }: {
  language: 'fr' | 'en' | 'ar';
  labels: typeof copy.en;
  checkIn?: string;
  checkOut?: string;
  onChange: (checkIn: string, checkOut: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(() => {
    const initial = checkIn ? new Date(`${checkIn}T00:00:00`) : today;
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const locale = language === 'en' ? 'en-GB' : language === 'ar' ? 'ar-MA' : 'fr-MA';
  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 1, 1 + index)));
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : new Date(month.getFullYear(), month.getMonth(), index - firstDay + 1));
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const select = (date: Date) => {
    const value = toIso(date);
    if (!checkIn || checkOut || value <= checkIn) onChange(value, '');
    else onChange(checkIn, value);
  };
  return <div className="date-range-calendar">
    <header><button type="button" aria-label="Previous month" disabled={month <= currentMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><strong>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></header>
    <p>{checkIn && !checkOut ? labels.checkOut : labels.chooseDates}</p>
    <div className="calendar-weekdays">{weekdays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
    <div className="calendar-days">{cells.map((date, index) => date ? <button type="button" key={toIso(date)} disabled={date < today} className={[toIso(date) === checkIn ? 'range-start' : '', toIso(date) === checkOut ? 'range-end' : '', checkIn && checkOut && toIso(date) > checkIn && toIso(date) < checkOut ? 'in-range' : ''].filter(Boolean).join(' ')} onClick={() => select(date)}>{date.getDate()}</button> : <span key={`empty-${index}`} />)}</div>
  </div>;
}
