# Sidi Bouzid Listings API

## Docker setup

Requires Docker Desktop. The compose stack runs PostgreSQL, persists its data in a named volume, waits for the database healthcheck, applies both migrations, and starts the API.

```sh
docker compose up --build
```

The API is available at `http://localhost:4000` and the health endpoint is `http://localhost:4000/health`. Stop the stack with `docker compose down`; remove the database volume too with `docker compose down -v`.

The defaults are development-only credentials. To override them, copy `.env.example` to `.env`, set a random `JWT_SECRET` of at least 32 characters, and edit the `POSTGRES_*` values before starting Docker. The database is private to the Compose network; connect to it from the API using the service hostname `db`. Authentication uses short-lived JWTs in an HttpOnly, SameSite cookie. The `x-user-id`/`x-user-role` shortcut works only when `ALLOW_DEV_AUTH=true` outside production.

## Local setup

For a non-Docker setup, requires Node 18+ and PostgreSQL. Create a database, copy `.env.example` to `.env`, and change `DATABASE_URL` to use `localhost`.

```sh
npm install
npm run migrate
npm run dev
```

The API listens on `http://localhost:4000` by default. Run `npm test`, `npm run build`, and `npm run lint` for verification. `npm run migrate` applies both plain SQL files through `psql`; alternatively, `npm run migrate:node` runs them through the Node PostgreSQL client.

Feature endpoints are available under `/api/v1` (the legacy `/api` prefix remains supported): `GET /listings/search`, `GET /listings/featured`, `POST /announcements/request`, `PATCH /announcements/:id` for admins, `GET /blog/posts`, `GET /favorites`, and `POST /favorites/:listingId/toggle`. Migration `003-platform-features.sql` adds listing service metadata, the `listing_categories` many-to-many table, host announcement requests, blog posts, and favorites.

Authentication endpoints are `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/session`. The frontend must use credentialed requests and the backend `CORS_ORIGIN` must allow its origin. State-changing browser requests are checked against the allowlisted Origin.

Development admin sample: `amina@example.com` / `BouzidAdmin2026!`. Change or remove this credential before using a non-development environment.
