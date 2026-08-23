import type { BookingStatus, ListingStatus, PricingUnit } from "../types";

export function formatDh(value: string | number) {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "— DH";
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(n)} DH`;
}

export function pricingLabel(unit: PricingUnit) {
  const map: Record<PricingUnit, string> = {
    per_night: "/ nuit",
    per_day: "/ jour",
    per_hour: "/ heure",
    per_service: "",
  };
  return map[unit];
}

export function listingStatusLabel(status: ListingStatus) {
  const map: Record<ListingStatus, string> = {
    pending: "En attente",
    approved: "Approuvée",
    rejected: "Refusée",
    archived: "Archivée",
  };
  return map[status];
}

export function bookingStatusLabel(status: BookingStatus) {
  const map: Record<BookingStatus, string> = {
    pending: "En attente",
    confirmed: "Approuvée",
    declined: "Refusée",
    cancelled: "Annulée",
    completed: "Terminée",
  };
  return map[status];
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";
