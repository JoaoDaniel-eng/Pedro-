import { getPool } from './pool.js';

const MENU = [
  ['Lanches', [
    ['X-Burger', 'Pão, hambúrguer 120g, queijo e molho da casa', 1800],
    ['X-Salada', 'Hambúrguer, queijo, alface, tomate e maionese', 2000],
    ['X-Bacon', 'Hambúrguer, queijo, bacon crocante e cheddar', 2600],
    ['Hot Dog Completo', 'Duas salsichas, purê, batata palha, milho e molho', 1700]
  ]],
  ['Porções', [
    ['Batata Frita', 'Porção para dividir, com sal na medida', 2200],
    ['Calabresa Acebolada', 'Calabresa fatiada com cebola e pão', 3000]
  ]],
  ['Salgados', [
    ['Coxinha', 'Frango com catupiry, grande', 700],
    ['Pastel de Carne', 'Massa fina e crocante', 800]
  ]],
  ['Bebidas', [
    ['Refrigerante Lata', '350 ml, gelada', 600],
    ['Suco Natural', 'Laranja, 400 ml', 900],
    ['Água', '500 ml', 400]
  ]]
];

export async function initializeDatabase() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL, sort INT NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, category_id INT NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', price_cents INT NOT NULL CHECK (price_cents >= 0),
      image TEXT, available BOOLEAN NOT NULL DEFAULT TRUE, sort INT NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('entrega','retirada')), address TEXT, payment TEXT NOT NULL, notes TEXT,
      subtotal_cents INT NOT NULL, delivery_fee_cents INT NOT NULL, total_cents INT NOT NULL,
      status TEXT NOT NULL DEFAULT 'novo', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY, order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE SET NULL, name TEXT NOT NULL,
      qty INT NOT NULL CHECK (qty BETWEEN 1 AND 20), unit_price_cents INT NOT NULL, notes TEXT);
    CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
    INSERT INTO settings (key, value) VALUES ('delivery_fee_cents', '500'), ('store_open', 'true')
      ON CONFLICT (key) DO NOTHING;
  `);
  const { rows } = await db.query('SELECT 1 FROM products LIMIT 1');
  if (rows.length) return;
  for (const [ci, [category, items]] of MENU.entries()) {
    const cat = await db.query('INSERT INTO categories (name, sort) VALUES ($1,$2) RETURNING id', [category, ci]);
    for (const [pi, [name, description, price]] of items.entries())
      await db.query('INSERT INTO products (category_id, name, description, price_cents, sort) VALUES ($1,$2,$3,$4,$5)', [cat.rows[0].id, name, description, price, pi]);
  }
}
