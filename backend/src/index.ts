import { app } from './app';

//Catching an early error if the server configurations are invalid
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

/**
 * When the application is publicly accessible over HTTPS, cookies must
 * use the Secure flag so browsers only send them over HTTPS connections.
 */

if (
  process.env.NODE_ENV === 'production' &&
  process.env.PUBLIC_HTTPS === 'true' &&
  process.env.COOKIE_SECURE !== 'true'
) {
  throw new Error('COOKIE_SECURE must be true when PUBLIC_HTTPS=true');
}

const port = Number(process.env.PORT || 4000);

//Server starting point to listen for incoming requests
app.listen(port, () => console.log(`API listening on port ${port}...`));
