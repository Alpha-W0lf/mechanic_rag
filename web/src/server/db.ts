import { Pool, type PoolClient, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgres://mechanic:mechanic@localhost:5433/mechanic_rag';
    const connectionTimeoutMillis = Number(process.env.DB_TIMEOUT_MS || 5000);
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return getPool().query<T>(text, params);
}

type PostgresPoolLike = {
  connect: () => Promise<PoolClient>;
};

/**
 * Bounded SELECT 1. Connect/query/timeout failures return false — never throw.
 * Optional `pool` is for tests; production uses getPool().
 */
export async function checkPostgres(
  timeoutMs = 3000,
  pool: PostgresPoolLike = getPool(),
): Promise<boolean> {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    const timer = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('db timeout')), timeoutMs),
    );
    await Promise.race([client.query('SELECT 1'), timer]);
    return true;
  } catch (err) {
    console.error(
      '[checkPostgres] probe failed',
      err instanceof Error ? err.message : err,
    );
    return false;
  } finally {
    client?.release();
  }
}
