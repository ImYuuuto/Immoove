import { type FormEvent, useState } from 'react';
import { CalendarDays, Check, Mail, Phone, Search, Star, Trash2, UserRound, X } from 'lucide-react';
import type {
  AdminOverview,
  Announcement,
  ApprovalCase,
  AuditEntry,
  Booking,
  Listing,
  Pagination,
  User,
  UserDetail,
} from '../types';
import { api } from '../api';
import { formatDate } from '../utils';
import { decodeText } from '../../utils/decodeText';
import { roleLabel, serviceTypeLabel } from '../../i18n/labels';
import { useLanguage } from '../../i18n/language';
import { Status } from './Status';
import { useAdminCopy } from '../adminI18n';
import { useAdminExtraCopy } from '../adminExtraI18n';

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
        <article>
          <small>{copy.listings.toUpperCase()}</small>
          <strong>{listings.length}</strong>
          <span>{copy.totalRecorded}</span>
        </article>
        <article>
          <small>{extra.grossBookingValue}</small>
          <strong>{Math.round(kpis?.grossBookingValue || 0).toLocaleString()}</strong>
          <span>
            MAD · {overview?.period.days || 30} {extra.days}
          </span>
        </article>
        <article>
          <small>{copy.bookings.toUpperCase()}</small>
          <strong>{kpis?.bookings ?? bookings.length}</strong>
          <span>
            {((kpis?.cancellationRate || 0) * 100).toFixed(1)}% {extra.cancelled}
          </span>
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

export function AdminAnalyticsView({
  overview,
  days,
  onDays,
}: {
  overview: AdminOverview | null;
  days: number;
  onDays: (days: number) => void;
}) {
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const maxValue = Math.max(1, ...(overview?.trend.map((item) => item.grossBookingValue) || [1]));
  return (
    <section className="admin-content">
      <div className="analytics-toolbar">
        <div>
          <h2>{extra.businessAnalytics}</h2>
          <p>{extra.analyticsText}</p>
        </div>
        <select value={days} onChange={(event) => onDays(Number(event.target.value))}>
          <option value="7">{extra.last7}</option>
          <option value="30">{extra.last30}</option>
          <option value="90">{extra.last90}</option>
        </select>
      </div>
      <div className="analytics-grid">
        <section className="admin-panel analytics-chart">
          <div className="panel-heading">
            <h2>{extra.grossBookingValue}</h2>
            <span>MAD</span>
          </div>
          <div className="bar-chart" role="img" aria-label={extra.grossBookingValue}>
            {overview?.trend.map((item) => (
              <div
                className="bar-column"
                key={item.date}
                title={`${formatDate(item.date)}: ${item.grossBookingValue} MAD`}
              >
                <i
                  style={{ height: `${Math.max(3, (item.grossBookingValue / maxValue) * 100)}%` }}
                />
                <small>{new Date(item.date).getDate()}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>{extra.categoryPerformance}</h2>
          </div>
          <div className="metric-list">
            {overview?.categories.map((item) => (
              <div key={item.slug}>
                <span>
                  <b>{decodeText(item.name)}</b>
                  <small>
                    {item.listings} {extra.listings} · {item.bookings} {extra.bookings}
                  </small>
                </span>
                <strong>{Math.round(item.grossBookingValue).toLocaleString()} MAD</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export function AuditView({ items }: { items: AuditEntry[] }) {
  const extra = useAdminExtraCopy();
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{extra.adminActivity}</h2>
            <p>{extra.auditText}</p>
          </div>
        </div>
        <div className="admin-table audit-table">
          <div className="table-row table-head">
            <span>{extra.action}</span>
            <span>{extra.actor}</span>
            <span>{extra.entity}</span>
            <span>{extra.reason}</span>
            <span>{extra.date}</span>
          </div>
          {items.map((item) => (
            <div className="table-row" key={item.id}>
              <span>
                <b>{item.action}</b>
                <small>
                  {extra.event} #{item.id}
                </small>
              </span>
              <span>
                {[item.actor?.firstName, item.actor?.lastName].filter(Boolean).join(' ') ||
                  item.actor?.email ||
                  extra.system}
              </span>
              <span>
                {item.entityType} {item.entityId ? `#${item.entityId}` : ''}
              </span>
              <span>{item.reason || '—'}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ListingsView({
  listings,
  onUpdate,
  onDelete,
  onRefresh,
}: {
  listings: Listing[];
  onUpdate: (id: number, data: { title: string; basePrice: number }) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const copy = useAdminCopy();
  const { language } = useLanguage();
  const [editing, setEditing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const edit = (item: Listing) => {
    setEditing(item);
    setTitle(decodeText(item.title));
    setBasePrice(String(item.basePrice || 0));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    onUpdate(editing.listingId, { title, basePrice: Number(basePrice) });
    setEditing(null);
  };
  return (
    <section className="admin-content">
      {editing && (
        <form className="admin-inline-form" onSubmit={submit}>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={copy.title}
          />
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            placeholder={copy.price}
          />
          <button>{copy.save}</button>
          <button type="button" onClick={() => setEditing(null)}>
            {copy.cancel}
          </button>
        </form>
      )}
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{copy.manageListings}</h2>
            <p>{copy.manageListingsText}</p>
          </div>
          <button onClick={onRefresh}>{copy.refresh}</button>
        </div>
        <div className="admin-table">
          <div className="table-row table-head">
            <span>{copy.address}</span>
            <span>{copy.service}</span>
            <span>{copy.created}</span>
            <span>{copy.status}</span>
            <span>{copy.actions}</span>
          </div>
          {listings.map((item) => (
            <div className="table-row" key={item.listingId}>
              <span>
                <b>{decodeText(item.title)}</b>
                <small>
                  ID #{item.listingId} · {item.basePrice} MAD
                </small>
              </span>
              <span>{serviceTypeLabel(item.serviceType, language, copy.unspecified)}</span>
              <span>{formatDate(item.createdAt)}</span>
              <span>
                <Status value={item.status} />
              </span>
              <span className="actions">
                <button onClick={() => edit(item)}>{copy.edit}</button>
                <button
                  className="reject"
                  onClick={() => onDelete(item.listingId)}
                  aria-label={copy.reject}
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ApprovalsView({
  items,
  onDecision,
  onBookingDecision,
  onFinalPublication,
}: {
  items: ApprovalCase[];
  onDecision: (id: number, decision: 'approved' | 'rejected' | 'changes_requested') => void;
  onBookingDecision: (id: number, status: 'processing' | 'confirmed' | 'rejected') => void;
  onFinalPublication: (id: number) => void;
}) {
  const copy = useAdminCopy();
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{copy.approvals}</h2>
            <p>{copy.approvalsText}</p>
          </div>
        </div>
        <div className="request-grid">
          {items.map((item) => {
            const finalPublication =
              item.entityType === 'announcement' && item.status === 'escalated';
            return (
              <article className="request-card" key={item.caseId}>
                <div className="request-top">
                  <Status value={item.status} />
                  <small>
                    {item.entityType} #{item.entityId}
                  </small>
                </div>
                <h2>{decodeText(item.title)}</h2>
                {item.description && <p>{decodeText(item.description)}</p>}
                <small className="request-date">
                  {copy.receivedOn} {formatDate(item.createdAt)}
                </small>
                <div className="request-actions">
                  {item.entityType === 'booking' ? (
                    <>
                      <button
                        className="approve"
                        onClick={() => onBookingDecision(item.entityId, 'confirmed')}
                      >
                        <Check size={15} /> {copy.approve}
                      </button>
                      <button
                        className="reject"
                        onClick={() => onBookingDecision(item.entityId, 'rejected')}
                      >
                        <X size={15} /> {copy.reject}
                      </button>
                    </>
                  ) : finalPublication ? (
                    <button className="approve" onClick={() => onFinalPublication(item.entityId)}>
                      <Check size={15} /> {copy.finalApproval}
                    </button>
                  ) : (
                    <>
                      <button
                        className="approve"
                        onClick={() => onDecision(item.caseId, 'approved')}
                      >
                        <Check size={15} /> {copy.approve}
                      </button>
                      <button
                        className="reject"
                        onClick={() => onDecision(item.caseId, 'rejected')}
                      >
                        <X size={15} /> {copy.reject}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
          {!items.length && <p>{copy.noApprovals}</p>}
        </div>
      </div>
    </section>
  );
}

export function AnnouncementsView({
  items,
  onApprove,
}: {
  items: Announcement[];
  onApprove: (id: number) => void;
}) {
  const copy = useAdminCopy();
  return (
    <section className="admin-content">
      <div className="request-grid">
        {items.map((item) => (
          <article className="request-card" key={item.request_id}>
            <div className="request-top">
              <Status value={item.status} />
              <small>#{item.request_id}</small>
            </div>
            <h2>{decodeText(item.title)}</h2>
            <p>{decodeText(item.description) || copy.noDescription}</p>
            <address>{decodeText(item.address)}</address>
            <small className="request-date">
              {copy.receivedOn} {formatDate(item.created_at)}
            </small>
            {item.status === 'ESCALATED' && (
              <div className="request-actions">
                <button className="approve" onClick={() => onApprove(item.request_id)}>
                  <Check size={15} />
                  {copy.approve}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

const emptyBooking = { listingId: '', userId: '', startDate: '', endDate: '' };
export function BookingsView({
  bookings,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: {
  bookings: Booking[];
  onCreate: (data: Record<string, number | string>) => void;
  onUpdate: (id: number, data: Record<string, number | string>) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const [form, setForm] = useState(emptyBooking);
  const [editing, setEditing] = useState<number | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const data = {
      listingId: Number(form.listingId),
      userId: Number(form.userId),
      startDate: form.startDate,
      endDate: form.endDate,
    };
    editing ? onUpdate(editing, data) : onCreate(data);
    setForm(emptyBooking);
    setEditing(null);
  };
  const edit = (item: Booking) => {
    setEditing(item.bookingId);
    setForm({
      listingId: String(item.listingId),
      userId: String(item.userId),
      startDate: item.startDate?.slice(0, 10) || '',
      endDate: item.endDate?.slice(0, 10) || '',
    });
  };
  return (
    <section className="admin-content">
      <form className="admin-inline-form" onSubmit={submit}>
        <input
          required
          type="number"
          min="1"
          placeholder={copy.listingId}
          value={form.listingId}
          onChange={(event) => setForm({ ...form, listingId: event.target.value })}
        />
        <input
          required
          type="number"
          min="1"
          placeholder={copy.userId}
          value={form.userId}
          onChange={(event) => setForm({ ...form, userId: event.target.value })}
        />
        <input
          required
          type="date"
          value={form.startDate}
          onChange={(event) => setForm({ ...form, startDate: event.target.value })}
        />
        <input
          required
          type="date"
          value={form.endDate}
          onChange={(event) => setForm({ ...form, endDate: event.target.value })}
        />
        <button>{editing ? copy.save : copy.create}</button>
      </form>
      <div className="table-card">
        <div className="panel-heading">
          <h2>{copy.bookings}</h2>
          <button onClick={onRefresh}>{copy.refresh}</button>
        </div>
        <div className="admin-table">
          <div className="table-row table-head">
            <span>{copy.booking}</span>
            <span>{copy.listing}</span>
            <span>{copy.traveler}</span>
            <span>{copy.period}</span>
            <span>{copy.actions}</span>
          </div>
          {bookings.map((item) => (
            <div className="table-row" key={item.bookingId}>
              <span>
                <b>#{item.bookingId}</b>
                <small>
                  {item.total || 0} {item.currency || 'MAD'}
                </small>
              </span>
              <span>
                {copy.listing} #{item.listingId}
              </span>
              <span>
                {copy.user} #{item.userId}
              </span>
              <span>
                {formatDate(item.startDate)} → {formatDate(item.endDate)}
              </span>
              <span className="actions">
                <select
                  value={item.status || 'confirmed'}
                  onChange={(event) => onUpdate(item.bookingId, { status: event.target.value })}
                >
                  <option value="confirmed">{extra.confirmed}</option>
                  <option value="completed">{extra.completed}</option>
                  <option value="cancelled">{extra.cancelledStatus}</option>
                  <option value="refunded">{extra.refunded}</option>
                </select>
                <button onClick={() => edit(item)}>{copy.edit}</button>
                <button
                  className="reject"
                  onClick={() => onDelete(item.bookingId)}
                  aria-label={copy.reject}
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UsersView({
  users,
  pagination,
  currentUserId,
  onSearch,
  onStatus,
}: {
  users: User[];
  pagination: Pagination | null;
  currentUserId?: number;
  onSearch: (search: string, page?: number) => void;
  onStatus: (id: number, status: 'active' | 'suspended') => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const openUser = async (id: number) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const result = await api<{ item: UserDetail }>(`/users/${id}`);
      setSelected(result.item);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : extra.userDetailsFailed);
    } finally {
      setDetailLoading(false);
    }
  };
  const initials = `${selected?.firstName?.[0] || ''}${selected?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const currentBookings = selected?.bookings.filter((item) => !item.isPrevious) || [];
  const previousTrips = selected?.bookings.filter((item) => item.isPrevious) || [];
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{copy.users}</h2>
            <p>
              {pagination?.total || users.length} {copy.accounts}
            </p>
          </div>
          <form
            className="admin-search"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(search);
            }}
          >
            <input
              placeholder={copy.searchName}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button aria-label={copy.searchName}>
              <Search size={15} />
            </button>
          </form>
        </div>
        <div className="admin-table">
          <div className="table-row table-head">
            <span>{copy.user}</span>
            <span>{copy.email}</span>
            <span>{copy.registered}</span>
            <span>{copy.role}</span>
            <span>{copy.action}</span>
          </div>
          {users.map((item) => (
            <div className="table-row user-table-row" key={item.userId} role="button" tabIndex={0} onClick={() => void openUser(item.userId)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') void openUser(item.userId); }}>
              <span>
                <b>
                  {decodeText(item.firstName)} {decodeText(item.lastName)}
                </b>
                <small>
                  ID #{item.userId} ·{' '}
                  {item.accountStatus === 'suspended' ? extra.suspended : extra.active}
                </small>
              </span>
              <span>{decodeText(item.email) || '—'}</span>
              <span>{formatDate(item.createdAt)}</span>
              <span>
                <Status value={item.role} />
              </span>
              <span className="actions">
                {item.userId !== currentUserId && item.role !== 'ADMIN' && (
                  <>
                    <button
                      className={item.accountStatus === 'suspended' ? 'approve' : 'reject'}
                      onClick={(event) => {
                        event.stopPropagation();
                        onStatus(
                          item.userId,
                          item.accountStatus === 'suspended' ? 'active' : 'suspended',
                        );
                      }}
                    >
                      {item.accountStatus === 'suspended' ? extra.activate : extra.suspend}
                    </button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        {pagination && pagination.totalPages > 1 && <nav className="admin-pagination" aria-label={extra.userPages}>
          <button disabled={pagination.page <= 1} onClick={() => onSearch(search, pagination.page - 1)}>{extra.previous}</button>
          <span>{extra.page} {pagination.page} / {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => onSearch(search, pagination.page + 1)}>{extra.next}</button>
        </nav>}
      </div>
      {(selected || detailLoading || detailError) && <div className="admin-user-modal-backdrop" role="presentation" onMouseDown={() => { setSelected(null); setDetailError(''); }}>
        <section className="admin-user-modal" role="dialog" aria-modal="true" aria-label={extra.userDetails} onMouseDown={(event) => event.stopPropagation()}>
          <button className="admin-user-modal-close" onClick={() => { setSelected(null); setDetailError(''); }} aria-label={extra.close}><X /></button>
          {detailLoading ? <p className="admin-user-modal-state">{extra.loadingUser}</p> : detailError ? <p className="admin-user-modal-state">{detailError}</p> : selected && <>
            <header className="admin-user-profile-head">
              <div className="admin-user-avatar">{selected.avatarUrl ? <img src={selected.avatarUrl} alt="" /> : <span>{initials}</span>}</div>
              <div><small>ID #{selected.userId}</small><h2>{decodeText(selected.firstName)} {decodeText(selected.lastName)}</h2><Status value={selected.role} /></div>
            </header>
            <div className="admin-user-contact-grid">
              <p><Mail /><span><small>{copy.email}</small><b>{decodeText(selected.email) || '—'}</b></span></p>
              <p><Phone /><span><small>{extra.phone}</small><b>{decodeText(selected.phone) || '—'}</b></span></p>
              <p><CalendarDays /><span><small>{copy.registered}</small><b>{formatDate(selected.createdAt)}</b></span></p>
              <p><Star /><span><small>{extra.ratings}</small><b>{selected.averageRating === null ? '—' : `${selected.averageRating.toFixed(1)} / 5`} · {selected.reviewCount}</b></span></p>
            </div>
            <UserBookingSection title={extra.currentBookings} items={currentBookings} empty={extra.noCurrentBookings} />
            <UserBookingSection title={extra.previousTrips} items={previousTrips} empty={extra.noPreviousTrips} />
          </>}
        </section>
      </div>}
    </section>
  );
}

function UserBookingSection({ title, items, empty }: { title: string; items: UserDetail['bookings']; empty: string }) {
  const extra = useAdminExtraCopy();
  return <section className="admin-user-trips"><h3>{title} <span>{items.length}</span></h3>
    {items.length ? items.map((item) => <article key={item.bookingId}>
      <div className="admin-user-trip-image">{item.coverImageUrl ? <img src={item.coverImageUrl} alt="" /> : <UserRound />}</div>
      <div><small>#{item.bookingId} · {item.status}</small><h4>{decodeText(item.listingTitle)}</h4><p>{formatDate(item.startDate)} → {formatDate(item.endDate)} · {item.total} {item.currency}</p>
        {item.review && <blockquote><span>{'★'.repeat(item.review.rating)}{'☆'.repeat(5 - item.review.rating)}</span><p>{decodeText(item.review.comment) || extra.noComment}</p></blockquote>}
      </div>
    </article>) : <p className="admin-user-empty">{empty}</p>}
  </section>;
}
