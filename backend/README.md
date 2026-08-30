# Immoove Morocco Listings API

## Docker setup

Requires Docker Desktop. The compose stack runs PostgreSQL and Redis, applies migrations once, then starts two API replicas behind an Nginx load balancer. Database, cache, and uploaded media are shared by every replica.

```sh
docker compose up --build
```

The load-balanced API is available at `http://localhost:4000` and the health endpoint is `http://localhost:4000/health`. The frontend remains available at `http://localhost:5173`. Stop the stack with `docker compose down`; remove all persistent database, Redis, and upload volumes with `docker compose down -v`.

The load balancer uses least-connections routing, keeps upstream connections open, retries another healthy replica after network and gateway errors, and refreshes Docker DNS as replicas change. Set `API_REPLICAS` in `.env` to change the default of two instances.

The database schema is consolidated in `001-immoove-baseline.sql`. Fresh databases apply that single baseline; databases created from the former 20-file history are validated and their migration ledger is safely collapsed to the baseline without replaying schema changes.

The defaults are development-only credentials. Copy `.env.example` to `.env`, set a random `JWT_SECRET` of at least 32 characters, and replace all database credentials before deployment. Persistent database identifiers are retained for compatibility with existing Docker volumes. The database is private to the Compose network; the API connects through `db`. Authentication uses short-lived JWTs in an HttpOnly, SameSite cookie.

### LAN HTTP development security note

Browsers do not accept `Secure` cookies from a plain-HTTP LAN address such as `http://192.168.1.20:5173`. For trusted local-network testing only, add the LAN frontend origin to `CORS_ORIGIN` and set `COOKIE_SECURE=false` in `.env`. Before any public, production, or untrusted-network deployment, serve the site over HTTPS, remove LAN origins from `CORS_ORIGIN`, set `PUBLIC_HTTPS=true`, and restore `COOKIE_SECURE=true`. The API refuses to start if public HTTPS is declared while secure cookies are disabled.

## Local setup

For a non-Docker setup, requires Node 18+ and PostgreSQL. Create a database, copy `.env.example` to `.env`, and change `DATABASE_URL` to use `localhost`.

```sh
npm install
npm run migrate
npm run dev
```

Public property reads use Redis when `REDIS_URL` is set. Cached entries expire after `CACHE_TTL_SECONDS` and are invalidated after property or booking changes. If Redis is unavailable, the API falls back to PostgreSQL.

The API listens on `http://localhost:4000` by default. Run `npm test`, `npm run build`, and `npm run lint` for verification. `npm run migrate` or `npm run migrate:node` applies the consolidated baseline through the Node PostgreSQL client.

Request, authentication, and password-attempt rate limits are enforced only when `NODE_ENV=production`; development and test environments skip them. Local Docker development can also set `DISABLE_RATE_LIMITS=true`; production deployments should leave it false.

JSON request bodies are limited to 102,400 bytes by default and oversized requests return `413`. Set `REQUEST_BODY_LIMIT_BYTES` to a positive integer to use a different limit.

Core endpoints are available under `/api/v1`: property discovery, property search, featured properties, Owner submissions, Admin approvals, bookings, reviews, favorites, profiles, authentication, and legal consent.

Authentication endpoints are `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `PATCH /api/v1/auth/password`, `GET /api/v1/auth/session`, and `GET /api/v1/auth/csrf-token`. Password changes accept `{ "currentPassword": string, "newPassword": string }`, invalidate every JWT issued to the user, clear the current browser's cookies, and return `204`. The frontend must use credentialed requests and the backend `CORS_ORIGIN` must allow its origin. Login and registration set `immoove_access` and return a CSRF token that is also stored in the readable `immoove_csrf` cookie. Cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests must send that value in the `X-CSRF-Token` header. Legacy `sidibouzid_access` and `sidibouzid_csrf` cookies are cleared during the authentication flow. The issuer/audience rename invalidates existing sessions, so users sign in once after deployment. Bearer-authenticated API clients do not need the CSRF header.

Failed login attempts always return `401` with `Invalid email or password`, whether the email is unknown or the password is incorrect. The unknown-email path still performs password hashing to reduce timing-based account enumeration. There is currently no forgot/reset-password endpoint.

Password-change failures are independently limited by source IP and authenticated account. The defaults allow five failed attempts per 15 minutes; configure them with `PASSWORD_RATE_LIMIT_MAX` and `PASSWORD_RATE_LIMIT_WINDOW_MS`. Successful changes do not consume the limit. A future forgot/reset-password endpoint must apply equivalent IP and normalized-account throttling before being exposed.

Booking requests never accept a client-calculated total. The server locks the property and calculates totals by billable night or commenced 30-day month.

User-controlled plain-text fields are sanitized at the service boundary before database writes. Unsafe HTML tags and attributes are stripped, dangerous script/style content is discarded, and remaining HTML-sensitive entities are encoded. SQL values continue to use PostgreSQL parameters rather than string escaping. Passwords, validated emails, validated URLs, enums, and search-only values are not passed through the HTML sanitizer.

Authenticated profile endpoints are `GET`, `PATCH`, and `DELETE /api/v1/profile`. Owner property edits return to `pending` until an Admin approves them. Roles are exactly `CLIENT`, `OWNER`, and `ADMIN`; a Client becomes an Owner after the first property submission is approved.

`GET /api/v1/listings/:id` returns a property gallery, owner, amenities, Morocco location hierarchy, rental term, availability, reviews, and ratings. Supported active property types are `apartment`, `studio`, and `villa`; rental terms are `short_term`, `long_term`, or `both`.

Property discovery uses `GET /api/v1/property-discovery/options` and `GET /api/v1/listings/search`. Initial active locations are Casablanca, El Jadida, Sidi Bouzid, and Marrakech, stored in expandable region/city/area tables.

Development admin sample: `amina@example.com` / `ImmooveAdmin2026!`. Change or remove this credential before using a non-development environment.
