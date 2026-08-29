import type { AvailabilityInterval, BookingMode, ListingDetail } from './types';

export const SESSION_TIMES = ['09:00', '12:00', '15:00', '18:00'];

export function bookingMode(listing: ListingDetail): BookingMode {
  const unit = (listing.pricingUnit || '').toLowerCase();
  if (unit.includes('hour') || unit.includes('heure')) return 'hourly';
  if (unit.includes('fixed') || unit.includes('service') || unit.includes('session'))
    return 'fixed';
  if (!unit && ['RESTAURANT_CAFE', 'ACTIVITY'].includes(listing.serviceType || '')) return 'fixed';
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
  copy: { night: string; day: string; hour: string; service: string },
  serviceType?: string,
) {
  const normalized = (unit || '').toLowerCase();
  if (normalized.includes('hour') || normalized.includes('heure')) return copy.hour;
  if (normalized.includes('day') || normalized.includes('jour')) return copy.day;
  if (
    normalized.includes('fixed') ||
    normalized.includes('service') ||
    normalized.includes('session')
  )
    return copy.service;
  if (!normalized && ['RESTAURANT_CAFE', 'ACTIVITY'].includes(serviceType || ''))
    return copy.service;
  return copy.night;
}
