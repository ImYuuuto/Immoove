import type { AdminOverview, Booking, Listing } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { serviceTypeLabel } from '../../../i18n/labels';
import { useLanguage } from '../../../i18n/language';
import { Status } from '../Status';
import { useAdminCopy } from '../../adminI18n';
import { useAdminExtraCopy } from '../../adminExtraI18n';

export function OverviewView({
  listings,
  bookings,
  overview,
  onView,
}: {
  listings: Listing[];
  bookings: Booking[];
  overview: AdminOverview | null;
  onView: (view: 'listings') => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const kpis = overview?.kpis;
  return (
    <section className="admin-content">
      <div className="stat-grid">
        <article>
          <small>{copy.activeListings}</small>
          <strong>
            {kpis?.activeListings ??
              listings.filter((item) => item.status === 'approved' && item.isActive).length}
          </strong>
          <span>{copy.visibleAddresses}</span>
        </article>
        <article className="stat-attention">
          <small>
            {copy.pending} {copy.bookings.toUpperCase()}
          </small>
          <strong>
            {kpis?.pendingBookings ??
              bookings.filter((item) => item.status === 'pending' || item.status === 'processing')
                .length}
          </strong>
          <span>{copy.toProcess}</span>
        </article>
        <article>
          <small>{extra.grossBookingValue}</small>
          <strong>{Math.round(kpis?.grossBookingValue || 0).toLocaleString()}</strong>
          <span>
            MAD · {overview?.period.days || 30} {extra.days}
          </span>
        </article>
        <article>
          <small>{copy.users.toUpperCase()}</small>
          <strong>{kpis?.totalUsers ?? 0}</strong>
          <span>{copy.accounts}</span>
        </article>
      </div>
      <div className="admin-panels admin-panels-single">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>{copy.listings}</h2>
            <button onClick={() => onView('listings')}>{copy.seeListings}</button>
          </div>
          {listings.slice(0, 6).map((item) => (
            <div className="queue-row" key={item.listingId}>
              <div>
                <b>{decodeText(item.title)}</b>
                <small>
                  {serviceTypeLabel(item.serviceType, language, copy.service)} ·{' '}
                  {formatDate(item.createdAt)}
                </small>
              </div>
              <Status value={item.status} />
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
