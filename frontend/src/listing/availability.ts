import type { AvailabilityInterval, BookingMode, ListingDetail } from './types';

export const SESSION_TIMES = ['09:00', '12:00', '15:00', '18:00'];

export function bookingMode(listing: ListingDetail): BookingMode {
  void listing;
  return 'range';
}

export function dateAtNoonUtc(value: string) {
  return value ? `${value}T12:00:00.000Z` : '';
}

export function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : '';
}

export function fixedSession(date: string, time: string) {
  if (!date || !time) return { startDate: '', endDate: '' };
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function overlapsAvailability(
  startDate: string,
  endDate: string,
  availability: AvailabilityInterval[],
) {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return availability.some(
    (interval) =>
      start < new Date(interval.endDate).getTime() && end > new Date(interval.startDate).getTime(),
  );
}

export function pricingUnitLabel(
  unit: string | undefined,
  copy: { night: string; month: string; day: string; hour: string; service: string },
  _serviceType?: string,
) {
  const normalized = (unit || '').toLowerCase();
  if (normalized.includes('month') || normalized.includes('mois') || normalized.includes('شهر'))
    return copy.month;
  if (normalized.includes('hour') || normalized.includes('heure')) return copy.hour;
  if (normalized.includes('day') || normalized.includes('jour')) return copy.day;
  if (
    normalized.includes('fixed') ||
    normalized.includes('service') ||
    normalized.includes('session')
  )
    return copy.service;
  return copy.night;
}
