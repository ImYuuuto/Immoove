import mysql, {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import 'dotenv/config';

export type DatabaseRow = Record<string, unknown>;

export interface DatabaseQueryResult<T = DatabaseRow> {
  rows: T[];
  rowCount: number;
  insertId?: number;
}

export interface DatabaseClient {
  query<T = DatabaseRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<DatabaseQueryResult<T>>;
}

type QueryExecutor = Pick<Pool | PoolConnection, 'execute'>;

function databaseConfig() {
  const connectionString =
    process.env.DATABASE_URL ||
    'mysql://immoove-admin:Immoove_dev_root_password@localhost:3306/ImmooveDB';
  const url = new URL(connectionString);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://');
  const connectionLimit = Number.parseInt(process.env.DB_POOL_SIZE || '10', 10);

  return {
    host: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    waitForConnections: true,
    connectionLimit:
      Number.isInteger(connectionLimit) && connectionLimit > 0
        ? connectionLimit
        : 10,
    queueLimit: 0,
    timezone: 'Z',
    charset: 'utf8mb4',
    namedPlaceholders: false,
    multipleStatements: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    decimalNumbers: false,
  } as const;
}

export const pool = mysql.createPool(databaseConfig());
const initializedConnections = new WeakSet<object>();

async function initializeConnection(connection: PoolConnection) {
  const physicalConnection =
    (connection as PoolConnection & { connection?: object }).connection ||
    connection;
  if (initializedConnections.has(physicalConnection)) return;
  await connection.query('SET time_zone = \'+00:00\'');
  initializedConnections.add(physicalConnection);
}

async function execute<T>(
  executor: QueryExecutor,
  text: string,
  params: readonly unknown[] = [],
): Promise<DatabaseQueryResult<T>> {
  const [result] = await executor.execute(text, [...params] as any[]);

  if (Array.isArray(result)) {
    const rows = result as RowDataPacket[];
    const booleanColumns = new Set(['is_active', 'is_featured', 'is_current', 'requires_review', 'requires_reacceptance', 'is_published', 'requires_terms_acceptance', 'blocked', 'has_review']);
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (booleanColumns.has(key) && row[key] !== null) row[key] = Number(row[key]) !== 0;
      }
    }
    return { rows: rows as T[], rowCount: rows.length };
  }

  const metadata = result as ResultSetHeader;
  return {
    rows: [],
    rowCount: metadata.affectedRows,
    ...(metadata.insertId ? { insertId: metadata.insertId } : {}),
  };
}

export async function query<T = DatabaseRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<DatabaseQueryResult<T>> {
  const connection = await pool.getConnection();
  try {
    await initializeConnection(connection);
    return await execute<T>(connection, text, params);
  } finally {
    connection.release();
  }
}

export async function transaction<T>(
  fn: (client: DatabaseClient) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  const client: DatabaseClient = {
    query: <R = DatabaseRow>(text: string, params: readonly unknown[] = []) =>
      execute<R>(connection, text, params),
  };

  try {
    await initializeConnection(connection);
    await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    const result = await fn(client);
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); } catch { connection.destroy(); }
    throw error;
  } finally {
    connection.release();
  }
}
