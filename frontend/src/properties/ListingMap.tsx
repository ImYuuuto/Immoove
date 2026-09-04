import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Listing } from '../types';

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];

function coordinates(listing: Listing): [number, number] | null {
  const latitude = Number(listing.latitude ?? listing.location?.lat);
  const longitude = Number(listing.longitude ?? listing.location?.lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
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
  onActive,
  onSelect,
  emptyLabel,
  ariaLabel,
}: {
  listings: Listing[];
  activeId?: number | null;
  onActive: (id: number | null) => void;
  onSelect: (listing: Listing) => void;
  emptyLabel: string;
  ariaLabel: string;
}) {
  const mappedListings = listings.filter((listing) => coordinates(listing));

  return (
    <div className="property-map" aria-label={ariaLabel}>
      <MapContainer center={MOROCCO_CENTER} zoom={5} scrollWheelZoom className="property-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitListings listings={mappedListings} />
        {mappedListings.map((listing) => {
          const point = coordinates(listing)!;
          const isActive = listing.listingId === activeId;
          const price = `${Math.round(Number(listing.basePrice || 0)).toLocaleString()} MAD`;
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
                click: () => onSelect(listing),
                mouseover: () => onActive(listing.listingId ?? null),
                mouseout: () => onActive(null),
              }}
            />
          );
        })}
      </MapContainer>
      {!mappedListings.length && <div className="property-map-empty">{emptyLabel}</div>}
    </div>
  );
}
