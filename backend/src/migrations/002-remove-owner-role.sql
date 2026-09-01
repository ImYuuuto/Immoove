UPDATE users SET role = 'CLIENT', session_version = session_version + 1 WHERE role = 'OWNER';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'ADMIN'));
