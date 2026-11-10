import { Router } from 'express';
import { getPool } from '../db/pool.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/config', async (_req, res) => {
  const { rows } = await getPool().query("SELECT key, value FROM settings WHERE key IN ('delivery_fee_cents','store_open')");
  const s = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({
    storeName: process.env.STORE_NAME || 'Lanchonete',
    whatsapp: process.env.WHATSAPP_NUMBER || '',
    deliveryFeeCents: Number(s.delivery_fee_cents || 0),
    open: s.store_open !== 'false'
  });
});

router.get('/menu', async (_req, res) => {
  const { rows } = await getPool().query(`
    SELECT c.id AS cid, c.name AS category, p.id, p.name, p.description, p.price_cents, p.image
    FROM categories c JOIN products p ON p.category_id = c.id
    WHERE p.available ORDER BY c.sort, p.sort, p.id`);
  const byCat = new Map();
  for (const r of rows) {
    if (!byCat.has(r.cid)) byCat.set(r.cid, { id: r.cid, name: r.category, products: [] });
    byCat.get(r.cid).products.push({ id: r.id, name: r.name, description: r.description, priceCents: r.price_cents, image: r.image });
  }
  res.json({ categories: [...byCat.values()] });
});

export default router;
