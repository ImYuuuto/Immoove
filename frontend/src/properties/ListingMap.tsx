import { useEffect, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from '../types';
import { useLanguage } from '../i18n/language';
import { decodeText } from '../utils/decodeText';
import ResponsiveImage from '../components/ResponsiveImage';

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];

function coordinates(listing: Listing): [number, number] | null {
  const latitude = Number(listing.latitude ?? listing.location?.lat);
  const longitude = Number(listing.longitude ?? listing.location?.lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function FocusListing({ listing }: { listing?: Listing }) {
  const map = useMap();
  useEffect(() => {
    const point = listing && coordinates(listing);
    if (point) map.flyTo(point, Math.max(map.getZoom(), 13), { duration: .55 });
  }, [listing, map]);
  return null;
}

function FitListings({ listings }: { listings: Listing[] }) {
  const map = useMap();

  useEffect(() => {
    const points = listings.map(coordinates).filter((point): point is [number, number] => Boolean(point));
    if (!points.length) {
      map.setView(MOROCCO_CENTER, 5);
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [54, 54], maxZoom: 13 });
    }
  }, [listings, map]);

  return null;
}

export default function ListingMap({
  listings,
  activeId,
  focusId,
  onActive,
  onSelect,
  emptyLabel,
  ariaLabel,
}: {
  listings: Listing[];
  activeId?: number | null;
  focusId?: number | null;
  onActive: (id: number | null) => void;
  onSelect: (listing: Listing) => void;
  emptyLabel: string;
  ariaLabel: string;
}) {
  const { language, text } = useLanguage();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mappedListings = listings.filter((listing) => coordinates(listing));
  const focusedListing = mappedListings.find((listing) => listing.listingId === focusId);
  const locale = language === 'ar' ? 'ar-MA' : language === 'en' ? 'en-GB' : 'fr-FR';

  return (
    <div className="property-map" aria-label={ariaLabel}>
      <MapContainer center={MOROCCO_CENTER} zoom={5} scrollWheelZoom className="property-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitListings listings={mappedListings} />
        <FocusListing listing={focusedListing} />
        {mappedListings.map((listing) => {
          const point = coordinates(listing)!;
          const isSelected = listing.listingId === selectedId;
          const isActive = listing.listingId === activeId || isSelected;
          const price = `${Math.round(Number(listing.basePrice || 0)).toLocaleString(locale)} MAD`;
          const icon = L.divIcon({
            className: 'property-price-marker-shell',
            html: `<span class="property-price-marker${isActive ? ' is-active' : ''}">${price}</span>`,
            iconSize: [92, 38],
            iconAnchor: [46, 19],
          });
          return (
            <Marker
              key={listing.listingId ?? listing.title}
              position={point}
              icon={icon}
              zIndexOffset={isActive ? 1000 : 0}
              eventHandlers={{
                click: () => {
                  setSelectedId(listing.listingId ?? null);
                  onActive(listing.listingId ?? null);
                },
                mouseover: () => onActive(listing.listingId ?? null),
                mouseout: () => onActive(null),
              }}
            >
              <Popup
                className="property-preview-popup"
                closeButton
                eventHandlers={{ remove: () => setSelectedId(null) }}
              >
                <article className="map-property-preview" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {(listing.coverImageUrl || listing.images?.[0]?.url) && (
                    <ResponsiveImage src={listing.coverImageUrl || listing.images?.[0]?.url || ''} alt={decodeText(listing.title)} width={520} height={300} sizes="260px" />
                  )}
                  <div>
                    <h3>{decodeText(listing.title)}</h3>
                    {(listing.locationText || listing.location?.name) && <p>{listing.locationText || listing.location?.name}</p>}
                    <div className="map-preview-meta">
                      {listing.rating?.average != null && <span>★ {listing.rating.average.toFixed(1)}</span>}
                      <strong>{price}</strong>
                    </div>
                    <button type="button" onClick={() => onSelect(listing)}>{text.viewStay}</button>
                  </div>
                </article>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {!mappedListings.length && <div className="property-map-empty">{emptyLabel}</div>}
    </div>
  );
}
