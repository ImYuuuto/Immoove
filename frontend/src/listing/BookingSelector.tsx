import { useEffect, useMemo, useState } from 'react';
import { dateAtNoonUtc, fixedSession, localDateTimeToIso, overlapsAvailability, SESSION_TIMES } from './availability';
import { useListingCopy } from './listingI18n';
import { useLanguage } from '../i18n/language';
import type { BookingMode, ListingDetail } from './types';

export type BookingSelection = { startDate: string; endDate: string; valid: boolean };

export default function BookingSelector({ listing, mode, onChange }: { listing: ListingDetail; mode: BookingMode; onChange: (selection: BookingSelection) => void }) {
  const copy = useListingCopy();
  const { language } = useLanguage();
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [blockedAttempt, setBlockedAttempt] = useState(false);

  const selection = useMemo(() => {
    if (mode === 'range') return { startDate: dateAtNoonUtc(start), endDate: dateAtNoonUtc(end) };
    if (mode === 'hourly') return { startDate: localDateTimeToIso(start), endDate: localDateTimeToIso(end) };
    return fixedSession(sessionDate, sessionTime);
  }, [end, mode, sessionDate, sessionTime, start]);

  const ordered = !selection.startDate || !selection.endDate || new Date(selection.endDate) > new Date(selection.startDate);
  const conflict = overlapsAvailability(selection.startDate, selection.endDate, listing.availability);
  const valid = Boolean(selection.startDate && selection.endDate && ordered && !conflict);

  useEffect(() => { onChange({ ...selection, valid }); }, [onChange, selection.endDate, selection.startDate, valid]);

  const sessionUnavailable = (time: string) => {
    const candidate = fixedSession(sessionDate, time);
    return overlapsAvailability(candidate.startDate, candidate.endDate, listing.availability);
  };

  const selectStart = (value: string) => {
    const candidateStart = mode === 'range' ? dateAtNoonUtc(value) : localDateTimeToIso(value);
    const minimumEnd = candidateStart ? new Date(new Date(candidateStart).getTime() + (mode === 'range' ? 24 : 1) * 60 * 60 * 1000).toISOString() : '';
    if (overlapsAvailability(candidateStart, minimumEnd, listing.availability)) { setBlockedAttempt(true); setStart(''); return; }
    const candidateEnd = mode === 'range' ? dateAtNoonUtc(end) : localDateTimeToIso(end);
    setStart(value);
    if (candidateEnd && overlapsAvailability(candidateStart, candidateEnd, listing.availability)) setEnd('');
    setBlockedAttempt(false);
  };

  const selectEnd = (value: string) => {
    const candidateStart = mode === 'range' ? dateAtNoonUtc(start) : localDateTimeToIso(start);
    const candidateEnd = mode === 'range' ? dateAtNoonUtc(value) : localDateTimeToIso(value);
    if (overlapsAvailability(candidateStart, candidateEnd, listing.availability)) { setBlockedAttempt(true); setEnd(''); return; }
    setEnd(value); setBlockedAttempt(false);
  };

  return <section className="checkout-section">
    <h2>{mode === 'range' ? copy.stayDates : mode === 'hourly' ? copy.hourlySlot : copy.serviceSession}</h2>
    {mode === 'range' && <div className="checkout-fields two"><label>{copy.startDate}<input required type="date" min={today} value={start} onChange={(event) => selectStart(event.target.value)} /></label><label>{copy.endDate}<input required type="date" min={start || today} value={end} onChange={(event) => selectEnd(event.target.value)} /></label></div>}
    {mode === 'hourly' && <div className="checkout-fields two"><label>{copy.startTime}<input required type="datetime-local" min={`${today}T00:00`} value={start} onChange={(event) => selectStart(event.target.value)} /></label><label>{copy.endTime}<input required type="datetime-local" min={start || `${today}T00:00`} value={end} onChange={(event) => selectEnd(event.target.value)} /></label></div>}
    {mode === 'fixed' && <div className="checkout-fields two"><label>{copy.sessionDate}<input required type="date" min={today} value={sessionDate} onChange={(event) => { setSessionDate(event.target.value); setSessionTime(''); }} /></label><label>{copy.sessionTime}<select required value={sessionTime} onChange={(event) => setSessionTime(event.target.value)}><option value="">{copy.chooseTime}</option>{SESSION_TIMES.map((time) => <option key={time} value={time} disabled={!sessionDate || sessionUnavailable(time)}>{time}{sessionDate && sessionUnavailable(time) ? ` — ${copy.blockedPeriods}` : ''}</option>)}</select></label></div>}
    {!ordered && <p className="checkout-conflict" role="alert">{copy.endAfterStart}</p>}
    {(conflict || blockedAttempt) && <p className="checkout-conflict" role="alert">{copy.unavailableSelection}</p>}
    {!!listing.availability.length && <div className="blocked-periods"><small>{copy.blockedPeriods}</small>{listing.availability.map((interval, index) => <span key={`${interval.startDate}-${index}`}>{new Date(interval.startDate).toLocaleString(locale)} → {new Date(interval.endDate).toLocaleString(locale)}</span>)}</div>}
  </section>;
}
