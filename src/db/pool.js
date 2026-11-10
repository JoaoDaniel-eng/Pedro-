import pg from 'pg';
const { Pool } = pg;
let pool;
const isLocalUrl = url => url.includes('localhost') || url.includes('127.0.0.1');
// O SSL é configurado abaixo, no objeto `ssl` (com verificação do certificado). Por isso removemos
// `sslmode` da URL: assim o pg não mostra o aviso "SECURITY WARNING: The SSL modes ..." no log.
// O comportamento de segurança continua o mesmo (conexão remota com certificado verificado).
const stripSslMode = url => url.replace(/([?&])(sslmode|uselibpqcompat)=[^&]*(&|$)/g, (m, sep, _k, end) => (end === '&' ? sep : '')).replace(/[?&]$/, '');
export function getBunkerDatabaseUrl() {
  const url = process.env.BUNKER_DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'BUNKER_DATABASE_URL não configurada. Defina a URL exclusiva do PostgreSQL do Bunker Rebellados; não reutilize a URL do Açaí da Roça.'
    );
  }
  return url;
}

export function getPool() {
  const databaseUrl = getBunkerDatabaseUrl();
  if (!pool) {
    // Conexões remotas (Neon etc.) usam SSL COM verificação do certificado.
    // Só se o provedor usar certificado próprio é que se define DATABASE_SSL_INSECURE=true (não recomendado).
    const ssl = isLocalUrl(databaseUrl)
      ? false
      : { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== 'true' };
    pool = new Pool({
      connectionString: stripSslMode(databaseUrl),
      ssl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    // Provedores como o Neon derrubam conexões ociosas. Sem este listener, o Node trata o evento como
    // exceção não tratada e derruba o servidor inteiro. O pool descarta a conexão ruim e abre outra sozinho.
    pool.on('error', err => console.error('Conexão ociosa do banco encerrada (será recriada):', err.message));
  }
  return pool;
}
