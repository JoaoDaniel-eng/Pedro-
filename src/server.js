import 'dotenv/config';
import { createApp } from './app.js';
import { initializeDatabase } from './db/init.js';
import { getBunkerDatabaseUrl, getPool } from './db/pool.js';
const PORT = Number(process.env.PORT || 3000);
const app = createApp();
async function start() {
  try {
    // O Bunker usa uma variável exclusiva para evitar conexão acidental ao banco do Açaí da Roça.
    getBunkerDatabaseUrl();
    await initializeDatabase();
    // Registra apenas a identidade lógica do banco (nunca a URL ou senha), para facilitar
    // a conferência no log do provedor e detectar serviço apontando para a base errada.
    const { rows } = await getPool().query(
      'SELECT current_database() AS database_name, current_user AS database_user'
    );
    console.info(
      `[Bunker] PostgreSQL ativo: database=${rows[0].database_name}; user=${rows[0].database_user}`
    );
  }
  catch (error) {
    console.error('Falha ao inicializar o banco do Bunker Rebellados:', error.message);
    // Sem banco, não iniciar o serviço: evita operar ou alterar dados no banco errado.
    process.exit(1);
    return;
  }
  app.listen(PORT, () => console.log(`Bunker Rebellados disponível na porta ${PORT}`));
}
start();
