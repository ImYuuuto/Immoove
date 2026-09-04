import { type FormEvent, useEffect, useState } from 'react';
import { Camera, Images, Plus, Trash2, X } from 'lucide-react';
import type { Listing } from '../../types';
import { getPropertyDiscoveryOptions } from '../../../properties/api';
import type { PropertyDiscoveryOptions } from '../../../properties/types';
import { formatDate } from '../../utils';
import { decodeText } from '../../../utils/decodeText';
import { serviceTypeLabel } from '../../../i18n/labels';
import { useLanguage } from '../../../i18n/language';
import { Status } from '../Status';
import { useAdminCopy } from '../../adminI18n';
import { useAdminExtraCopy } from '../../adminExtraI18n';

export function ListingsView({
  listings,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: {
  listings: Listing[];
  onCreate: (data: FormData) => void;
  onUpdate: (id: number, data: { title: string; basePrice: number }) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}) {
  const copy = useAdminCopy();
  const extra = useAdminExtraCopy();
  const { language } = useLanguage();
  const [editing, setEditing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [creating, setCreating] = useState(false);
  const [options, setOptions] = useState<PropertyDiscoveryOptions | null>(null);
  useEffect(() => {
    if (creating && !options) void getPropertyDiscoveryOptions().then(setOptions);
  }, [creating, options]);
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
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate(new FormData(event.currentTarget));
    setCreating(false);
  };
  return (
    <section className="admin-content">
      <div className="admin-create-toolbar">
        <button onClick={() => setCreating(true)}>
          <Plus size={16} />
          {extra.addProperty}
        </button>
      </div>
      {creating && (
        <div className="admin-form-backdrop" onMouseDown={() => setCreating(false)}>
          <form
            className="owner-property-form"
            onSubmit={create}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>IMMOOVE</small>
                <h2>{extra.ownerPropertyIntake}</h2>
              </div>
              <button type="button" onClick={() => setCreating(false)}>
                <X />
              </button>
            </header>
            <fieldset>
              <legend>{extra.owners}</legend>
              <label className="upload-card wide">
                <span className="upload-card-heading">
                  <span className="upload-card-icon">
                    <Camera />
                  </span>
                  <span>
                    <b>{extra.ownerPhoto}</b>
                    <small>{extra.ownerPhotoHelp}</small>
                  </span>
                </span>
                <input
                  name="ownerPhoto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                />
              </label>
              <label>
                {extra.firstName}
                <input required name="firstName" />
              </label>
              <label>
                {extra.lastName}
                <input required name="lastName" />
              </label>
              <label>
                {extra.nationalId}
                <input required name="nationalIdCode" />
              </label>
              <label>
                {extra.ownerPhone}
                <input required name="phone" type="tel" />
              </label>
              <label>
                {extra.ownerEmail}
                <input name="email" type="email" />
              </label>
            </fieldset>
            <fieldset>
              <legend>{copy.listing}</legend>
              <label>
                {extra.propertyName}
                <input required name="title" />
              </label>
              <label>
                {extra.propertyType}
                <select required name="propertyTypeId">
                  <option value="">—</option>
                  {options?.propertyTypes.map((item) => (
                    <option key={item.propertyTypeId} value={item.propertyTypeId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {extra.cityArea}
                <select required name="areaId">
                  <option value="">—</option>
                  {options?.areas.map((area) => {
                    const city = options.cities.find((item) => item.cityId === area.cityId);
                    return (
                      <option key={area.areaId} value={area.areaId}>
                        {city?.name} · {area.name}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                {extra.nightlyPrice}
                <input required name="nightlyPrice" type="number" min="1" step="0.01" />
              </label>
              <label className="upload-card wide">
                <span className="upload-card-heading">
                  <span className="upload-card-icon">
                    <Images />
                  </span>
                  <span>
                    <b>{extra.listingPhotos}</b>
                    <small>{extra.listingPhotosHelp}</small>
                  </span>
                </span>
                <input
                  required
                  multiple
                  name="listingPhotos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                />
              </label>
              <label>
                {extra.contractNumber}
                <input required name="contractNumber" />
              </label>
              <label className="file-field">
                {extra.contractDocument}
                <input
                  required
                  name="contractDocument"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                />
              </label>
              <label className="wide">
                {extra.locationText}
                <input required name="locationText" />
              </label>
              <label className="wide">
                {extra.mapUrl}
                <input name="mapUrl" type="url" />
              </label>
              <label>
                {extra.latitude}
                <input name="latitude" type="number" min="-90" max="90" step="any" />
              </label>
              <label>
                {extra.longitude}
                <input name="longitude" type="number" min="-180" max="180" step="any" />
              </label>
            </fieldset>
            <footer>
              <button type="button" onClick={() => setCreating(false)}>
                {copy.cancel}
              </button>
              <button>{extra.createProperty}</button>
            </footer>
          </form>
        </div>
      )}
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
