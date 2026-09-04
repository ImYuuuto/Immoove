import { useState } from 'react';
import { CalendarDays, Mail, Phone, Search, Star, UserRound, X } from 'lucide-react';
import type { Pagination, User, UserDetail } from '../../types';
import { api } from '../../api';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { useLanguage } from '../../../i18n/language';
import { Status } from '../Status';
import { useAdminCopy } from '../../adminI18n';
import { useAdminExtraCopy } from '../../adminExtraI18n';

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
  const initials =
    `${selected?.firstName?.[0] || ''}${selected?.lastName?.[0] || ''}`.toUpperCase() || 'U';
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
            <div
              className="table-row user-table-row"
              key={item.userId}
              role="button"
              tabIndex={0}
              onClick={() => void openUser(item.userId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') void openUser(item.userId);
              }}
            >
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
        {pagination && pagination.totalPages > 1 && (
          <nav className="admin-pagination" aria-label={extra.userPages}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => onSearch(search, pagination.page - 1)}
            >
              {extra.previous}
            </button>
            <span>
              {extra.page} {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onSearch(search, pagination.page + 1)}
            >
              {extra.next}
            </button>
          </nav>
        )}
      </div>
      {(selected || detailLoading || detailError) && (
        <div
          className="admin-user-modal-backdrop"
          role="presentation"
          onMouseDown={() => {
            setSelected(null);
            setDetailError('');
          }}
        >
          <section
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-label={extra.userDetails}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="admin-user-modal-close"
              onClick={() => {
                setSelected(null);
                setDetailError('');
              }}
              aria-label={extra.close}
            >
              <X />
            </button>
            {detailLoading ? (
              <p className="admin-user-modal-state">{extra.loadingUser}</p>
            ) : detailError ? (
              <p className="admin-user-modal-state">{detailError}</p>
            ) : (
              selected && (
                <>
                  <header className="admin-user-profile-head">
                    <div className="admin-user-avatar">
                      {selected.avatarUrl ? (
                        <img src={selected.avatarUrl} alt="" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div>
                      <small>ID #{selected.userId}</small>
                      <h2>
                        {decodeText(selected.firstName)} {decodeText(selected.lastName)}
                      </h2>
                      <Status value={selected.role} />
                    </div>
                  </header>
                  <div className="admin-user-contact-grid">
                    <p>
                      <Mail />
                      <span>
                        <small>{copy.email}</small>
                        <b>{decodeText(selected.email) || '—'}</b>
                      </span>
                    </p>
                    <p>
                      <Phone />
                      <span>
                        <small>{extra.phone}</small>
                        <b>{decodeText(selected.phone) || '—'}</b>
                      </span>
                    </p>
                    <p>
                      <CalendarDays />
                      <span>
                        <small>{copy.registered}</small>
                        <b>{formatDate(selected.createdAt)}</b>
                      </span>
                    </p>
                    <p>
                      <Star />
                      <span>
                        <small>{extra.ratings}</small>
                        <b>
                          {selected.averageRating === null
                            ? '—'
                            : `${selected.averageRating.toFixed(1)} / 5`}{' '}
                          · {selected.reviewCount}
                        </b>
                      </span>
                    </p>
                  </div>
                  <UserBookingSection
                    title={extra.currentBookings}
                    items={currentBookings}
                    empty={extra.noCurrentBookings}
                  />
                  <UserBookingSection
                    title={extra.previousTrips}
                    items={previousTrips}
                    empty={extra.noPreviousTrips}
                  />
                </>
              )
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function UserBookingSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: UserDetail['bookings'];
  empty: string;
}) {
  const extra = useAdminExtraCopy();
  return (
    <section className="admin-user-trips">
      <h3>
        {title} <span>{items.length}</span>
      </h3>
      {items.length ? (
        items.map((item) => (
          <article key={item.bookingId}>
            <div className="admin-user-trip-image">
              {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" /> : <UserRound />}
            </div>
            <div>
              <small>
                #{item.bookingId} · {item.status}
              </small>
              <h4>{decodeText(item.listingTitle)}</h4>
              <p>
                {formatDate(item.startDate)} → {formatDate(item.endDate)} · {item.total}{' '}
                {item.currency}
              </p>
              {item.review && (
                <blockquote>
                  <span>
                    {'★'.repeat(item.review.rating)}
                    {'☆'.repeat(5 - item.review.rating)}
                  </span>
                  <p>{decodeText(item.review.comment) || extra.noComment}</p>
                </blockquote>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="admin-user-empty">{empty}</p>
      )}
    </section>
  );
}
