import { useState } from 'react';
import { Building2, CalendarDays, FileText, Mail, MapPin, Phone, Search, X } from 'lucide-react';
import type { Owner, OwnerDetail, Pagination } from '../../types';
import { api } from '../../api';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { useAdminExtraCopy } from '../../adminExtraI18n';

export function OwnersView({
  owners,
  pagination,
  onSearch,
}: {
  owners: Owner[];
  pagination: Pagination | null;
  onSearch: (search: string, page?: number) => void;
}) {
  const extra = useAdminExtraCopy();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OwnerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const open = async (id: number) => {
    setLoading(true);
    try {
      const response = await api<{ item: OwnerDetail }>(`/owners/${id}`);
      setSelected(response.item);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="admin-content">
      <div className="table-card">
        <div className="panel-heading">
          <div>
            <h2>{extra.owners}</h2>
            <p>
              {pagination?.total || owners.length} {extra.propertiesOwned}
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={extra.searchOwners}
            />
            <button>
              <Search size={15} />
            </button>
          </form>
        </div>
        <div className="owner-grid">
          {owners.map((owner) => (
            <button key={owner.ownerId} onClick={() => void open(owner.ownerId)}>
              <span className="owner-list-avatar">
                {owner.photoUrl ? (
                  <img src={owner.photoUrl} alt="" />
                ) : (
                  `${owner.firstName[0]}${owner.lastName[0]}`
                )}
              </span>
              <span>
                <b>
                  {decodeText(owner.firstName)} {decodeText(owner.lastName)}
                </b>
                <small>{owner.nationalIdCode}</small>
                <small>
                  {owner.propertyCount} {extra.propertiesOwned}
                </small>
              </span>
              <Building2 />
            </button>
          ))}
        </div>
        {!owners.length && <p className="admin-user-empty">{extra.noOwners}</p>}
        {pagination && pagination.totalPages > 1 && (
          <nav className="admin-pagination">
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
      {(selected || loading) && (
        <div className="admin-user-modal-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="admin-user-modal owner-detail-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="admin-user-modal-close" onClick={() => setSelected(null)}>
              <X />
            </button>
            {loading ? (
              <p className="admin-user-modal-state">{extra.loadingUser}</p>
            ) : (
              selected && (
                <>
                  <header className="admin-user-profile-head">
                    <div className="admin-user-avatar">
                      {selected.photoUrl ? (
                        <img src={selected.photoUrl} alt="" />
                      ) : (
                        <span>
                          {selected.firstName[0]}
                          {selected.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <small>{selected.nationalIdCode}</small>
                      <h2>
                        {decodeText(selected.firstName)} {decodeText(selected.lastName)}
                      </h2>
                      <span>
                        {selected.propertyCount} {extra.propertiesOwned}
                      </span>
                    </div>
                  </header>
                  <div className="admin-user-contact-grid">
                    <p>
                      <Phone />
                      <span>
                        <small>{extra.phone}</small>
                        <b>{selected.phone}</b>
                      </span>
                    </p>
                    <p>
                      <Mail />
                      <span>
                        <small>Email</small>
                        <b>{selected.email || '—'}</b>
                      </span>
                    </p>
                    <p>
                      <CalendarDays />
                      <span>
                        <small>{extra.ownerSince}</small>
                        <b>{formatDate(selected.createdAt)}</b>
                      </span>
                    </p>
                  </div>
                  <section className="owner-properties">
                    <h3>{extra.propertiesOwned}</h3>
                    {selected.properties.map((property) => (
                      <article key={property.listingId}>
                        <div className="owner-property-image">
                          {property.coverImageUrl ? (
                            <img src={property.coverImageUrl} alt="" />
                          ) : (
                            <Building2 />
                          )}
                        </div>
                        <div>
                          <small>
                            #{property.listingId} · {property.propertyType}
                          </small>
                          <h4>{property.title}</h4>
                          <p>{property.locationText}</p>
                          <b>{property.basePrice} MAD</b>
                          <div>
                            {property.contractDocumentUrl && (
                              <a
                                href={property.contractDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <FileText />
                                {extra.viewContract}
                              </a>
                            )}
                            {property.mapUrl && (
                              <a href={property.mapUrl} target="_blank" rel="noreferrer">
                                <MapPin />
                                {extra.openMap}
                              </a>
                            )}
                          </div>
                          {property.latitude != null && property.longitude != null && (
                            <small>
                              {extra.exactCoordinates}: {property.latitude}, {property.longitude}
                            </small>
                          )}
                        </div>
                      </article>
                    ))}
                  </section>
                </>
              )
            )}
          </section>
        </div>
      )}
    </section>
  );
}
