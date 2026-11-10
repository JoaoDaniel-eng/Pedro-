import test from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder, PricingError } from './pricing.js';

const products = new Map([
  [1, { id: 1, name: 'X-Burger', price_cents: 1800, available: true }],
  [2, { id: 2, name: 'Batata', price_cents: 2200, available: false }]
]);

test('soma itens e taxa de entrega', () => {
  const r = priceOrder([{ productId: 1, qty: 2 }], products, { type: 'entrega', deliveryFeeCents: 500 });
  assert.equal(r.totalCents, 4100);
});
test('retirada não cobra frete', () => {
  const r = priceOrder([{ productId: 1, qty: 1 }], products, { type: 'retirada', deliveryFeeCents: 500 });
  assert.equal(r.totalCents, 1800);
});
test('recusa item indisponível e quantidade inválida', () => {
  assert.throws(() => priceOrder([{ productId: 2, qty: 1 }], products, { type: 'retirada', deliveryFeeCents: 0 }), PricingError);
  assert.throws(() => priceOrder([{ productId: 1, qty: 99 }], products, { type: 'retirada', deliveryFeeCents: 0 }), PricingError);
});
