import pg from 'pg';
let pool;
const isLocal = url => url.includes('localhost') || url.includes('127.0.0.1');

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada.');
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocal(process.env.DATABASE_URL) ? false : { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== 'true' },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    // Provedores como o Neon derrubam conexões ociosas; sem este listener o Node derrubaria o servidor.
    pool.on('error', err => console.error('Conexão ociosa encerrada (será recriada):', err.message));
  }
  return pool;
}
