import { attachDatabasePool } from '@vercel/functions';
import {
  Pool,
  type PoolClient,
  type PoolConfig,
  type QueryResultRow,
} from 'pg';

/** Compose maps container 5432 → host 5433. Do not change this default. */
export const LOCAL_COMPOSE_DATABASE_URL =
  'postgres://mechanic:mechanic@localhost:5433/mechanic_rag';

/** Unchanged local Compose path (single long-lived Next process). */
export const LOCAL_POOL_LIMITS = {
  max: 10,
  idleTimeoutMillis: 30_000,
} as const;

/**
 * Hosted Vercel + Supabase Free limits.
 *
 * max=2: Supabase serverless guidance starts at 1 and raises only if a warm
 * instance queues concurrent invocations
 * (https://supabase.com/docs/guides/database/connecting-to-postgres).
 * Vercel Fluid says avoid max=1 because concurrent asks on one instance
 * serialize (https://vercel.com/kb/guide/connection-pooling-with-functions).
 * node-pg's default 10 is the isolate-multiplier antipattern on Free.
 *
 * idle 5s: Vercel Fluid recommendation so unused sockets close quickly.
 */
export const HOSTED_POOL_LIMITS = {
  max: 2,
  idleTimeoutMillis: 5_000,
} as const;

export type PoolProfile = 'local_compose' | 'hosted_serverless';

export type ResolvedPoolConfig = {
  profile: PoolProfile;
  connectionString: string;
  connectionTimeoutMillis: number;
  max: number;
  idleTimeoutMillis: number;
  ssl?: PoolConfig['ssl'];
  attachToVercelLifecycle: boolean;
};

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function connectionHostname(connectionString: string): string | null {
  try {
    return new URL(connectionString).hostname;
  } catch {
    return null;
  }
}

/**
 * Pure config selection — hosted vs local Compose. Never logs the URL/host.
 *
 * Hosted URLs on 6543 (Supavisor transaction) and 5432 (session / direct)
 * get the same small pool + SSL. Prefer transaction-mode 6543 in Vercel
 * `DATABASE_URL`; the client does not rewrite ports.
 */
export function resolvePoolConfig(
  env: NodeJS.ProcessEnv = process.env,
): ResolvedPoolConfig {
  const connectionString = env.DATABASE_URL || LOCAL_COMPOSE_DATABASE_URL;
  const connectionTimeoutMillis = Number(env.DB_TIMEOUT_MS || 5000);
  const hostname = connectionHostname(connectionString);
  const local =
    hostname === null ? !env.DATABASE_URL : isLoopbackHost(hostname);

  if (local) {
    return {
      profile: 'local_compose',
      connectionString,
      connectionTimeoutMillis,
      ...LOCAL_POOL_LIMITS,
      attachToVercelLifecycle: false,
    };
  }

  return {
    profile: 'hosted_serverless',
    connectionString,
    connectionTimeoutMillis,
    ...HOSTED_POOL_LIMITS,
    // node-pg equivalent of sslmode=require (encrypt; no CA file in the function).
    ssl: { rejectUnauthorized: false },
    attachToVercelLifecycle: Boolean(env.VERCEL),
  };
}

function toPoolOptions(cfg: ResolvedPoolConfig): PoolConfig {
  return {
    connectionString: cfg.connectionString,
    connectionTimeoutMillis: cfg.connectionTimeoutMillis,
    max: cfg.max,
    idleTimeoutMillis: cfg.idleTimeoutMillis,
    ...(cfg.ssl ? { ssl: cfg.ssl } : {}),
  };
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const cfg = resolvePoolConfig();
    pool = new Pool(toPoolOptions(cfg));
    pool.on('error', (err) => {
      console.error(
        '[db] idle client error',
        err instanceof Error ? err.message : err,
      );
    });
    // Fluid: close idle clients before the isolate suspends.
    // https://vercel.com/kb/guide/connection-pooling-with-functions
    if (cfg.attachToVercelLifecycle) {
      attachDatabasePool(pool);
    }
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

/**
 * Parameterized `text` + `values` only. Do not pass `{ name }` — named
 * prepared statements break Supavisor transaction mode (port 6543).
 * https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL
 */
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
