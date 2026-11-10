export class PricingError extends Error {}

// O preço é sempre calculado no servidor: o navegador só informa produto e quantidade.
export function priceOrder(items, productsById, { type, deliveryFeeCents }) {
  if (!Array.isArray(items) || !items.length) throw new PricingError('Adicione ao menos um item ao pedido.');
  if (items.length > 30) throw new PricingError('Pedido com itens demais.');
  const lines = items.map(({ productId, qty, notes }) => {
    const p = productsById.get(Number(productId));
    const q = Number(qty);
    if (!p) throw new PricingError('Um dos itens não existe mais no cardápio.');
    if (!p.available) throw new PricingError(`${p.name} está indisponível no momento.`);
    if (!Number.isInteger(q) || q < 1 || q > 20) throw new PricingError('Quantidade inválida (de 1 a 20).');
    return { productId: p.id, name: p.name, qty: q, unitPriceCents: p.price_cents, notes: String(notes || '').slice(0, 200) };
  });
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);
  const feeCents = type === 'entrega' ? deliveryFeeCents : 0;
  return { lines, subtotalCents, deliveryFeeCents: feeCents, totalCents: subtotalCents + feeCents };
}
