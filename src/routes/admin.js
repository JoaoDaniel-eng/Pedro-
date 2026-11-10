import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getPool } from '../db/pool.js';
import { requireAdmin, signAdminToken } from '../middleware/auth.js';

const router = Router();
const STATUSES = ['novo', 'preparando', 'saiu', 'pronto', 'entregue', 'cancelado'];
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };

const fails = new Map(); // bloqueio simples: 5 erros por IP em 15 min
router.post('/login', (req, res) => {
  const now = Date.now();
  const list = (fails.get(req.ip) || []).filter(t => now - t < 900_000);
  if (list.length >= 5) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });
  const { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !JWT_SECRET) return res.status(503).json({ error: 'Painel não configurado (.env).' });
  const { email = '', password = '' } = req.body;
  if (!same(String(email).toLowerCase(), ADMIN_EMAIL.toLowerCase()) || !same(password, ADMIN_PASSWORD)) {
    list.push(now); fails.set(req.ip, list);
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  res.json({ token: signAdminToken(ADMIN_EMAIL) });
});

router.use(requireAdmin);

router.get('/orders', async (_req, res) => {
  const { rows } = await getPool().query(`
    SELECT o.*, COALESCE(json_agg(json_build_object('name', i.name, 'qty', i.qty, 'notes', i.notes) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
    FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
    WHERE o.created_at > now() - interval '3 days' GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`);
  res.json({ orders: rows });
});

router.patch('/orders/:id/status', async (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Status inválido.' });
  const r = await getPool().query('UPDATE orders SET status = $1 WHERE id = $2', [req.body.status, Number(req.params.id)]);
  res.json({ ok: r.rowCount === 1 });
});

router.get('/products', async (_req, res) => {
  const { rows } = await getPool().query('SELECT p.id, p.name, p.price_cents, p.available, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id ORDER BY c.sort, p.sort, p.id');
  res.json({ products: rows });
});

router.patch('/products/:id', async (req, res) => {
  const { available, priceCents } = req.body;
  if (available !== undefined && typeof available !== 'boolean') return res.status(400).json({ error: 'Valor inválido.' });
  if (priceCents !== undefined && (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100000)) return res.status(400).json({ error: 'Preço inválido.' });
  await getPool().query('UPDATE products SET available = COALESCE($1, available), price_cents = COALESCE($2, price_cents) WHERE id = $3', [available ?? null, priceCents ?? null, Number(req.params.id)]);
  res.json({ ok: true });
});

router.patch('/settings', async (req, res) => {
  const db = getPool();
  if (typeof req.body.storeOpen === 'boolean') await db.query("UPDATE settings SET value = $1 WHERE key = 'store_open'", [String(req.body.storeOpen)]);
  if (Number.isInteger(req.body.deliveryFeeCents) && req.body.deliveryFeeCents >= 0) await db.query("UPDATE settings SET value = $1 WHERE key = 'delivery_fee_cents'", [String(req.body.deliveryFeeCents)]);
  res.json({ ok: true });
});

export default router;
