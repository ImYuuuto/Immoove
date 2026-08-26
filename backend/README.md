# Sidi Bouzid Listings API

## Docker setup

Requires Docker Desktop. The compose stack runs PostgreSQL and Redis, applies migrations once, then starts two API replicas behind an Nginx load balancer. Database, cache, and uploaded media are shared by every replica.

```sh
docker compose up --build
```

The load-balanced API is available at `http://localhost:4000` and the health endpoint is `http://localhost:4000/health`. The frontend remains available at `http://localhost:5173`. Stop the stack with `docker compose down`; remove all persistent database, Redis, and upload volumes with `docker compose down -v`.

The load balancer uses least-connections routing, keeps upstream connections open, retries another healthy replica after network and gateway errors, and refreshes Docker DNS as replicas change. Set `API_REPLICAS` in `.env` to change the default of two instances.

The defaults are development-only credentials. To override them, copy `.env.example` to `.env`, set a random `JWT_SECRET` of at least 32 characters, and edit the `POSTGRES_*` values before starting Docker. The database is private to the Compose network; connect to it from the API using the service hostname `db`. Authentication uses short-lived JWTs in an HttpOnly, SameSite cookie. The `x-user-id`/`x-user-role` shortcut works only when `ALLOW_DEV_AUTH=true` outside production.

## Local setup

For a non-Docker setup, requires Node 18+ and PostgreSQL. Create a database, copy `.env.example` to `.env`, and change `DATABASE_URL` to use `localhost`.

```sh
npm install
npm run migrate
npm run dev
```

Public listing and category reads use Redis when `REDIS_URL` is set. Cached entries expire after `CACHE_TTL_SECONDS` (60 seconds by default) and are invalidated after listing or booking changes. If Redis is unavailable, the API falls back to PostgreSQL. Remove `REDIS_URL` to disable caching locally.

The API listens on `http://localhost:4000` by default. Run `npm test`, `npm run build`, and `npm run lint` for verification. `npm run migrate` applies both plain SQL files through `psql`; alternatively, `npm run migrate:node` runs them through the Node PostgreSQL client.

Request, authentication, and password-attempt rate limits are enforced only when `NODE_ENV=production`; development and test environments skip them. Local Docker development can also set `DISABLE_RATE_LIMITS=true`; production deployments should leave it false.

JSON request bodies are limited to 102,400 bytes by default and oversized requests return `413`. Set `REQUEST_BODY_LIMIT_BYTES` to a positive integer to use a different limit.

Feature endpoints are available under `/api/v1` (the legacy `/api` prefix remains supported): `GET /listings/search`, `GET /listings/featured`, `POST /announcements/request`, `PATCH /announcements/:id` for admins, `GET /blog/posts`, `GET /favorites`, and `POST /favorites/:listingId/toggle`. Migration `003-platform-features.sql` adds listing service metadata, the `listing_categories` many-to-many table, host announcement requests, blog posts, and favorites.

Authentication endpoints are `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `PATCH /api/v1/auth/password`, `GET /api/v1/auth/session`, and `GET /api/v1/auth/csrf-token`. Password changes accept `{ "currentPassword": string, "newPassword": string }`, invalidate every JWT issued to the user, clear the current browser's cookies, and return `204`. The frontend must use credentialed requests and the backend `CORS_ORIGIN` must allow its origin. Login and registration responses include a CSRF token and also set it in the readable `sidibouzid_csrf` cookie. Cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests must send that value in the `X-CSRF-Token` header. A fresh token can be requested from the CSRF endpoint. Bearer-authenticated API clients do not need the CSRF header.

Failed login attempts always return `401` with `Invalid email or password`, whether the email is unknown or the password is incorrect. The unknown-email path still performs password hashing to reduce timing-based account enumeration. There is currently no forgot/reset-password endpoint.

Password-change failures are independently limited by source IP and authenticated account. The defaults allow five failed attempts per 15 minutes; configure them with `PASSWORD_RATE_LIMIT_MAX` and `PASSWORD_RATE_LIMIT_WINDOW_MS`. Successful changes do not consume the limit. A future forgot/reset-password endpoint must apply equivalent IP and normalized-account throttling before being exposed.

Booking creation and update requests never accept a `total`. The server locks the listing, reads its current `base_price`, and calculates the booking total as `base_price × billable days`; any started 24-hour period counts as one billable day.

User-controlled plain-text fields are sanitized at the service boundary before database writes. Unsafe HTML tags and attributes are stripped, dangerous script/style content is discarded, and remaining HTML-sensitive entities are encoded. SQL values continue to use PostgreSQL parameters rather than string escaping. Passwords, validated emails, validated URLs, enums, and search-only values are not passed through the HTML sanitizer.

Authenticated profile endpoints are `GET`, `PATCH`, and `DELETE /api/v1/profile`. Profile updates accept `{ "firstName": string, "lastName": string }`. Profile deletion is transactional, clears authentication cookies, and cascades through user-owned listings, bookings, reviews, favorites, announcements, blog posts, and listing dependencies; retained audit/reviewer references are set to null. `GET /api/v1/listings/mine` returns every listing owned by the authenticated user. Regular-owner listing edits reset the listing to `pending` and inactive until staff approves it again. Favorite listing responses use the same camelCase mapping as the listing API.

`GET /api/v1/listings/:id` returns the listing gallery, owner name, amenities, location, pricing unit, blocked availability intervals, reviews, and rating summary. Public availability never exposes booking users or contact details. Authenticated booking creation uses `POST /api/v1/bookings` with `listingId`, `startDate`, `endDate`, `firstName`, `lastName`, `email`, and `phone`; the server calculates the authoritative total from the listing price and its night/day, hour, or fixed-service pricing unit. `GET /api/v1/profile` includes the user's phone when available so checkout forms can be prefilled. Guests receive `401` when attempting to book.

Category navigation uses `GET /api/v1/categories` and `GET /api/v1/categories/:slug/listings?page=1&limit=20`. Stable category slugs are `housing`, `services`, `hobbies-and-activities`, and `renting-cars`. Category listing results contain camelCase card data, rating summaries, and `listingId`; clients should navigate a selected card to `/listings/:listingId`.

Migration `011-category-sample-listings.sql` adds two approved sample listings per public category, with gallery images and amenities. It is idempotent and can be reapplied safely.

Development admin sample: `amina@example.com` / `BouzidAdmin2026!`. Change or remove this credential before using a non-development environment.
