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
