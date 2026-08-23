import type { BookingStatus, ListingStatus } from "../../types";
import { bookingStatusLabel, listingStatusLabel } from "../../utils/format";

export function StatusBadge({
  status,
  kind = "booking",
}: {
  status: BookingStatus | ListingStatus;
  kind?: "booking" | "listing";
}) {
  const label = kind === "listing" ? listingStatusLabel(status as ListingStatus) : bookingStatusLabel(status as BookingStatus);
  return <span className={`badge badge-${status}`}>{label}</span>;
}
