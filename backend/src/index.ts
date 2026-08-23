import { app } from './app';
if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on port ${port}.....`));
