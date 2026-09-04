import { type FormEvent, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { Booking } from '../../types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { useAdminCopy } from '../../adminI18n';
import { useAdminExtraCopy } from '../../adminExtraI18n';

const emptyBooking = {
  listingId: '',
  userId: '',
  startDate: '',
  endDate: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
};
export function BookingsView({
  bookings,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
  onSearch,
}: {
  bookings: Booking[];
  onCreate: (data: Record<string, number | string>) => void;
  onUpdate: (id: number, data: Record<string, number | string>) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
  onSearch: (search: string, status?: string) => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const [form, setForm] = useState(emptyBooking);
  const [editing, setEditing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const data = {
      listingId: Number(form.listingId),
      userId: Number(form.userId),
      startDate: form.startDate,
      endDate: form.endDate,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
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
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
    });
  };
  return (
    <section className="admin-content">
      <form className="admin-inline-form booking-create-form" onSubmit={submit}>
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
        <input
          required
          placeholder={extra.firstName}
          value={form.firstName}
          onChange={(event) => setForm({ ...form, firstName: event.target.value })}
        />
        <input
          required
          placeholder={extra.lastName}
          value={form.lastName}
          onChange={(event) => setForm({ ...form, lastName: event.target.value })}
        />
        <input
          required
          type="email"
          placeholder={copy.email}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          required
          type="tel"
          placeholder={extra.ownerPhone}
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <button>{editing ? copy.save : copy.create}</button>
      </form>
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{copy.bookings}</h2>
          </div>
          <div className="booking-table-tools">
            <select
              className="booking-status-filter"
              value={statusFilter}
              aria-label={extra.filterBookingStatus}
              onChange={(event) => {
                const status = event.target.value;
                setStatusFilter(status);
                onSearch(search, status);
              }}
            >
              <option value="">{extra.allBookingStatuses}</option>
              <option value="pending">{copy.pendingStatus}</option>
              <option value="processing">{extra.processing}</option>
              <option value="confirmed">{extra.confirmed}</option>
              <option value="completed">{extra.completed}</option>
              <option value="cancelled">{extra.cancelledStatus}</option>
              <option value="rejected">{copy.rejected}</option>
              <option value="refunded">{extra.refunded}</option>
            </select>
            <form
              className="admin-search"
              onSubmit={(event) => {
                event.preventDefault();
                onSearch(search, statusFilter);
              }}
            >
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={extra.searchBookings}
                aria-label={extra.searchBookings}
              />
              <button aria-label={extra.searchBookings}>
                <Search size={15} />
              </button>
            </form>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                onRefresh();
              }}
            >
              {copy.refresh}
            </button>
          </div>
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
                {item.listing?.title
                  ? decodeText(item.listing.title)
                  : `${copy.listing} #${item.listingId}`}
              </span>
              <span>
                {[item.firstName, item.lastName]
                  .filter(Boolean)
                  .map((value) => decodeText(value))
                  .join(' ') || `${copy.user} #${item.userId}`}
              </span>
              <span>
                {formatDate(item.startDate)} → {formatDate(item.endDate)}
              </span>
              <span className="actions">
                <select
                  value={item.status || 'pending'}
                  onChange={(event) => onUpdate(item.bookingId, { status: event.target.value })}
                >
                  <option value="pending">{copy.pendingStatus}</option>
                  <option value="processing">{extra.processing}</option>
                  <option value="confirmed">{extra.confirmed}</option>
                  <option value="completed">{extra.completed}</option>
                  <option value="cancelled">{extra.cancelledStatus}</option>
                  <option value="rejected">{copy.rejected}</option>
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
