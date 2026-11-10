import { Router } from 'express';
import { getPool } from '../db/pool.js';
import { priceOrder, PricingError } from '../services/pricing.js';
import { generateOrderCode } from '../services/orderCode.js';

const router = Router();
const PAYMENTS = ['pix', 'dinheiro', 'cartao'];
const hits = new Map(); // limite simples anti-spam: 10 pedidos por IP por hora (memória do processo)

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 3600_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 10;
}

router.post('/orders', async (req, res) => {
  if (tooMany(req.ip)) return res.status(429).json({ error: 'Muitos pedidos em pouco tempo. Tente mais tarde.' });
  const b = req.body;
  const name = String(b.customerName || '').trim();
  const phone = String(b.phone || '').replace(/\D/g, '');
  const type = b.type === 'retirada' ? 'retirada' : 'entrega';
  const address = String(b.address || '').trim().slice(0, 400);
  if (name.length < 2 || name.length > 120) throw new PricingError('Informe seu nome.');
  if (phone.length < 10 || phone.length > 13) throw new PricingError('Informe um celular com DDD.');
  if (type === 'entrega' && address.length < 5) throw new PricingError('Informe o endereço de entrega.');
  if (!PAYMENTS.includes(b.payment)) throw new PricingError('Escolha a forma de pagamento.');

  const db = getPool();
  const settings = await db.query("SELECT key, value FROM settings WHERE key IN ('delivery_fee_cents','store_open')");
  const s = Object.fromEntries(settings.rows.map(r => [r.key, r.value]));
  if (s.store_open === 'false') throw new PricingError('A loja está fechada no momento.');

  const ids = [...new Set((b.items || []).map(i => Number(i.productId)).filter(Number.isInteger))];
  const prods = await db.query('SELECT id, name, price_cents, available FROM products WHERE id = ANY($1::int[])', [ids]);
  const price = priceOrder(b.items, new Map(prods.rows.map(p => [p.id, p])), { type, deliveryFeeCents: Number(s.delivery_fee_cents || 0) });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const o = await client.query(
      `INSERT INTO orders (code, customer_name, phone, type, address, payment, notes, subtotal_cents, delivery_fee_cents, total_cents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, code, total_cents`,
      [generateOrderCode(), name, phone, type, type === 'entrega' ? address : null, b.payment, String(b.notes || '').slice(0, 300), price.subtotalCents, price.deliveryFeeCents, price.totalCents]);
    for (const l of price.lines)
      await client.query('INSERT INTO order_items (order_id, product_id, name, qty, unit_price_cents, notes) VALUES ($1,$2,$3,$4,$5,$6)', [o.rows[0].id, l.productId, l.name, l.qty, l.unitPriceCents, l.notes]);
    await client.query('COMMIT');
    res.status(201).json({ code: o.rows[0].code, totalCents: o.rows[0].total_cents, deliveryFeeCents: price.deliveryFeeCents, lines: price.lines });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Acompanhamento: exige código + telefone para não expor pedidos de outras pessoas.
router.get('/orders/:code', async (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  const { rows } = await getPool().query('SELECT code, status, type, total_cents, created_at FROM orders WHERE code = $1 AND phone = $2', [String(req.params.code).toUpperCase(), phone]);
  if (!rows.length) return res.status(404).json({ error: 'Pedido não encontrado. Confira o código e o telefone.' });
  res.json(rows[0]);
});

export default router;
