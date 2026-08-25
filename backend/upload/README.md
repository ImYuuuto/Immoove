# Upload storage

Images are grouped by ownership and purpose:

- `site/`: application-owned images shipped with the project.
- `listings/`: runtime listing uploads, grouped by listing ID.
- `avatars/`: runtime profile images, grouped by user ID.
- `tmp/`: short-lived files awaiting validation and processing.

Public image paths start with `/uploads/`; the physical directory remains
`backend/upload`. Keep executable files and unvalidated uploads out of `site/`.
