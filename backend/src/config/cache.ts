import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;
const defaultTtlSeconds = Number(process.env.CACHE_TTL_SECONDS || 60);

if (!Number.isSafeInteger(defaultTtlSeconds) || defaultTtlSeconds <= 0) {
  throw new Error('CACHE_TTL_SECONDS must be a positive integer');
}

let client: RedisClientType | null = null;
let connection: Promise<RedisClientType | null> | null = null;
const reportedWarnings = new Set<string>();
const pendingLoads = new Map<string, Promise<unknown>>();

function warnOnce(type: string, message: string) {
  if (reportedWarnings.has(type)) return;
  reportedWarnings.add(type);
  console.warn(`[cache] ${message}`);
}

async function getClient(): Promise<RedisClientType | null> {
  if (!redisUrl) return null;
  if (client?.isReady) return client;
  if (connection) return connection;

  const candidate = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 1000),
      reconnectStrategy: false,
    },
  });
  candidate.on('error', (error) => {
    warnOnce(
      'connection',
      `Redis unavailable; using MySQL directly (${error.message})`,
    );
  });
  connection = candidate
    .connect()
    .then(() => {
      client = candidate as RedisClientType;
      return client;
    })
    .catch(() => null)
    .finally(() => {
      connection = null;
    });
  return connection;
}

async function namespaceVersion(namespace: string) {
  const redis = await getClient();
  if (!redis) return null;
  return (await redis.get(`cache-version:${namespace}`)) || '1';
}

export async function cached<T>(
  namespace: string,
  key: string,
  load: () => Promise<T>,
  ttlSeconds = defaultTtlSeconds,
): Promise<T> {
  let redis: RedisClientType | null = null;
  let cacheKey: string | null = null;
  try {
    redis = await getClient();
    const version = redis ? await namespaceVersion(namespace) : null;
    if (redis && version) {
      cacheKey = `cache:${namespace}:${version}:${key}`;
      const hit = await redis.get(cacheKey);
      if (hit !== null) return JSON.parse(hit) as T;
    }
  } catch (error) {
    warnOnce(
      'read',
      `Redis read failed; using MySQL directly (${(error as Error).message})`,
    );
  }

  const pendingKey = cacheKey || `direct:${namespace}:${key}`;
  const pending = pendingLoads.get(pendingKey);
  if (pending) return pending as Promise<T>;

  const loading = (async () => {
    const value = await load();
    if (redis && cacheKey) {
      try {
        await redis.set(cacheKey, JSON.stringify(value), { EX: ttlSeconds });
      } catch (error) {
        warnOnce(
          'write',
          `Redis write failed; response was still served (${(error as Error).message})`,
        );
      }
    }
    return value;
  })();
  pendingLoads.set(pendingKey, loading);
  try {
    return await loading;
  } finally {
    if (pendingLoads.get(pendingKey) === loading) pendingLoads.delete(pendingKey);
  }
}

export async function invalidateCache(...namespaces: string[]) {
  try {
    const redis = await getClient();
    if (!redis) return;
    await Promise.all(
      namespaces.map((namespace) => redis.incr(`cache-version:${namespace}`)),
    );
  } catch (error) {
    warnOnce(
      'invalidation',
      `Redis invalidation failed; cached entries will expire normally (${(error as Error).message})`,
    );
  }
}

export async function closeCache() {
  if (client?.isOpen) await client.quit();
}
