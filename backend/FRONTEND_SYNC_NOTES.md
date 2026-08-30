# Phase 5 frontend sync notes

- Display brand: use **Immoove** everywhere. The marketplace scope is all of Morocco, not one city.
- Authentication cookie: the access cookie is now `immoove_access` (HttpOnly).
- CSRF cookie: read `immoove_csrf` and send its value as `X-CSRF-Token` on authenticated mutations.
- Do not read either legacy `sidibouzid_*` cookie. The API clears those cookies during authentication and CSRF refresh.
- Existing cookies and JWT bearer tokens are intentionally invalid after deployment. Show the normal login screen once; this is not an error or an account reset.
- Browser storage keys are now `immoove_authenticated`, `immoove_language`, and `immoove_token`. The current frontend removes the old auth/language markers.
- New sample housing records use Agadir and Marrakech. Continue routing cards by listing ID; no route contract changed.
- Production deployment must use HTTPS with `COOKIE_SECURE=true` and `PUBLIC_HTTPS=true`. Plain HTTP LAN testing may temporarily keep both settings false.
- Database, Compose, volume, and migration-lock names remain unchanged in this phase.

## Property discovery

- Use `/properties` as the canonical discovery page, with `/properties/apartments`, `/properties/villas`, `/properties/houses`, `/properties/riads`, and `/properties/other-stays` for type shortcuts.
- Listing cards should always open `/listings/:listingId`.
- Existing `/categories`, `/categories/:slug`, and `/categories/:slug/listing/:id` links are preserved through HTTP 308 redirects in production and equivalent client-side normalization during development.
- Fetch filter choices from `GET /api/v1/property-discovery/options`; do not hard-code database IDs.
- Search with `GET /api/v1/listings/search`. New query fields are `region_id`, `city_id`, `area_id`, `property_type`, `check_in`, `check_out`, `guests`, `min_price`, `max_price`, `bedrooms`, `bathrooms`, comma-separated `amenities`, `min_rating`, and `instant_available=true`.
- Region selection must clear city and area. City selection must clear area. Cities and areas should be filtered using the parent IDs returned by the options endpoint.
- Migration 017 adds the `riad` property type and nullable bedroom/bathroom data. Deploy the migration before deploying this frontend.
- Owner/admin listing create and update payloads may now include `areaId`, `propertyTypeId`, `bedrooms`, and `bathrooms`. Populate the IDs from the discovery-options response rather than asking users to type IDs.

## Owner dashboard

- Owners now use the read-only `/owner` page backed by `GET /api/v1/owner/dashboard`.
- The response contains `statistics` and the authenticated owner's `properties`; never request or send an owner ID.
- Owners cannot create, edit, delete, upload/reorder images, configure pricing/availability, or process booking requests. Hide those controls for `OWNER` users.
- All property mutations and booking moderation remain Admin-only. The API returns `403` if an Owner attempts them directly.
- Display `pending`, `approved`, `rejected`, and `changes_requested` as distinct publication states. Show `adminNote` when present.
- Migration 018 must run before this dashboard is deployed because it adds the `changes_requested` listing state and the owner-dashboard index.
- Admin property forms may send `beds` alongside `bedrooms`, `bathrooms`, and `guestCapacity`.
- Admin image APIs: `POST /api/v1/listings/:id/images` as multipart `images`, then `PUT /api/v1/listings/:id/images/order` with `{ "imageIds": [...] }`.
- Admin availability APIs: `POST /api/v1/listings/:id/availability` with `startDate`, `endDate`, and optional `note`; remove a block with `DELETE /api/v1/listings/:id/availability/:blockId`.
