import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Building2, CalendarClock, Star } from 'lucide-react';
import { request } from '../utils/request';
import ResponsiveImage from '../components/ResponsiveImage';
import './owner.css';

type OwnerData = {
  statistics: {
    totalProperties: number;
    pending: number;
    approved: number;
    rejected: number;
    changesRequested: number;
    active: number;
    totalBookings: number;
    awaitingBookings: number;
    grossBookingValue: number;
  };
  properties: Array<{
    listingId: number;
    title: string;
    status: string;
    isActive: boolean;
    basePrice: number;
    pricingUnit?: string;
    coverImageUrl?: string | null;
    propertyType?: string | null;
    bookings: number;
    awaitingBookings: number;
    averageRating: number;
    reviewCount: number;
    adminNote?: string | null;
    updatedAt: string;
  }>;
};

const statusLabels: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
};

export default function OwnerDashboard() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try {
      setData(await request<OwnerData>('/owner/dashboard'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard unavailable');
    }
  };
  useEffect(() => {
    void load();
  }, []);
  if (!data)
    return (
      <main className="owner-state">
        <Building2 size={34} />
        <h1>{error || 'Loading your properties…'}</h1>
        {error && <a href="/">Return home</a>}
      </main>
    );
  const stats = [
    ['Properties', data.statistics.totalProperties],
    ['Approved', data.statistics.approved],
    ['Pending', data.statistics.pending],
    ['Changes requested', data.statistics.changesRequested],
    ['Rejected', data.statistics.rejected],
    ['Awaiting bookings', data.statistics.awaitingBookings],
  ];
  return (
    <main className="owner-dashboard">
      <header className="owner-topbar">
        <a className="brand" href="/">
          <b>I</b>immoove<span>.</span>
        </a>
        <a href="/profile">
          <ArrowLeft size={17} />
          Profile
        </a>
      </header>
      <section className="owner-hero">
        <small>OWNER DASHBOARD</small>
        <h1>Your properties at a glance</h1>
        <p>
          This dashboard is read-only. Immoove Admin controls property details, availability,
          bookings, and final publication.
        </p>
      </section>
      <section className="owner-stats">
        {stats.map(([label, value]) => (
          <article key={label}>
            <BarChart3 size={19} />
            <span>{label}</span>
            <b>{Number(value).toLocaleString()}</b>
          </article>
        ))}
      </section>
      <section className="owner-summary">
        <span>
          <CalendarClock size={18} />
          {data.statistics.totalBookings} total bookings
        </span>
        <b>{data.statistics.grossBookingValue.toLocaleString()} MAD confirmed value</b>
      </section>
      <section className="owner-properties">
        <div>
          <small>PORTFOLIO</small>
          <h2>Your properties</h2>
        </div>
        {data.properties.length ? (
          <div className="owner-property-grid">
            {data.properties.map((property) => (
              <article key={property.listingId}>
                <div className="owner-property-image">
                  {property.coverImageUrl ? (
                    <ResponsiveImage
                      src={property.coverImageUrl}
                      alt={property.title}
                      width={640}
                      height={420}
                      sizes="320px"
                    />
                  ) : (
                    <Building2 />
                  )}
                </div>
                <div className="owner-property-body">
                  <span className={`owner-status status-${property.status}`}>
                    {statusLabels[property.status] || property.status}
                  </span>
                  <small>{property.propertyType || 'Property'}</small>
                  <h3>
                    <a href={`/listings/${property.listingId}`}>{property.title}</a>
                  </h3>
                  <p>
                    {property.basePrice.toLocaleString()} MAD / {property.pricingUnit || 'night'}
                  </p>
                  <div className="owner-property-metrics">
                    <span>
                      <CalendarClock size={15} />
                      {property.bookings} bookings
                    </span>
                    <span>
                      <Star size={15} />
                      {property.reviewCount ? property.averageRating.toFixed(1) : '—'} (
                      {property.reviewCount})
                    </span>
                  </div>
                  {property.adminNote && (
                    <aside>
                      <b>Admin note</b>
                      {property.adminNote}
                    </aside>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="owner-empty">No properties are assigned to this account.</div>
        )}
      </section>
    </main>
  );
}
