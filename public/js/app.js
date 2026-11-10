const $ = s => document.querySelector(s);
const money = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const el = (tag, props = {}, ...kids) => { // monta DOM com textContent (sem innerHTML => sem XSS)
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};
const cart = new Map(); // productId -> { product, qty }
let config = { deliveryFeeCents: 0, open: true, whatsapp: '' };

async function api(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

function say(sel, text, kind) { const m = $(sel); m.textContent = text; m.className = `form-message ${kind || ''}`; }

function renderMenu(categories) {
  const root = $('#menu');
  root.replaceChildren(...categories.map(c => el('div', { className: 'category' },
    el('h3', {}, c.name),
    el('div', { className: 'products' }, ...c.products.map(p => el('article', { className: 'product' },
      el('h4', {}, p.name), el('p', {}, p.description),
      el('div', { className: 'product-foot' }, el('span', { className: 'price' }, money(p.priceCents)),
        el('button', { className: 'button', type: 'button', onclick: () => add(p) }, 'Adicionar'))))))));
}

function add(product) {
  const line = cart.get(product.id) || { product, qty: 0 };
  line.qty = Math.min(20, line.qty + 1);
  cart.set(product.id, line);
  renderCart();
}

function change(id, delta) {
  const line = cart.get(id);
  line.qty += delta;
  if (line.qty <= 0) cart.delete(id);
  line.qty = Math.min(20, line.qty);
  renderCart();
}

function totals() {
  const sub = [...cart.values()].reduce((s, l) => s + l.product.priceCents * l.qty, 0);
  const delivery = document.querySelector('[name=type]:checked').value === 'entrega';
  const fee = delivery ? config.deliveryFeeCents : 0;
  return { sub, fee, total: sub + fee, delivery };
}

function renderCart() {
  const lines = [...cart.values()];
  $('#cart-count').textContent = lines.reduce((s, l) => s + l.qty, 0);
  $('#cart-empty').classList.toggle('hidden', lines.length > 0);
  $('#order-form').classList.toggle('hidden', lines.length === 0);
  $('#cart-list').replaceChildren(...lines.map(l => el('li', {},
    el('span', {}, `${l.product.name} · ${money(l.product.priceCents * l.qty)}`),
    el('span', { className: 'qty' },
      el('button', { type: 'button', ariaLabel: 'Diminuir', onclick: () => change(l.product.id, -1) }, '−'),
      ` ${l.qty} `,
      el('button', { type: 'button', ariaLabel: 'Aumentar', onclick: () => change(l.product.id, 1) }, '+')))));
  const t = totals();
  $('#subtotal').textContent = money(t.sub);
  $('#fee').textContent = t.delivery ? money(t.fee) : 'grátis (retirada)';
  $('#total').textContent = money(t.total);
  $('#address-label').classList.toggle('hidden', !t.delivery);
}

function whatsappUrl(order, form) {
  const items = order.lines.map(l => `${l.qty}x ${l.name}`).join('\n');
  const where = form.type === 'entrega' ? `Entrega: ${form.address}` : 'Retirada na loja';
  const text = `Olá! Fiz o pedido ${order.code}\n${items}\n${where}\nPagamento: ${form.payment}\nTotal: ${money(order.totalCents)}`;
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(text)}`;
}

$('#order-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target));
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  try {
    const order = await api('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items: [...cart.values()].map(l => ({ productId: l.product.id, qty: l.qty })) })
    });
    say('#order-message', `Pedido ${order.code} enviado! Guarde o código para acompanhar.`, 'ok');
    cart.clear(); renderCart();
    if (config.whatsapp) window.open(whatsappUrl(order, form), '_blank', 'noopener');
  } catch (err) { say('#order-message', err.message, 'error'); }
  finally { btn.disabled = false; }
});

document.querySelectorAll('[name=type]').forEach(r => r.addEventListener('change', renderCart));

$('#track-form').addEventListener('submit', async e => {
  e.preventDefault();
  const { code, phone } = Object.fromEntries(new FormData(e.target));
  try {
    const o = await api(`/api/orders/${encodeURIComponent(code.trim())}?phone=${encodeURIComponent(phone)}`);
    say('#track-message', `Pedido ${o.code}: ${o.status.toUpperCase()}`, 'ok');
  } catch (err) { say('#track-message', err.message, 'error'); }
});

(async function init() {
  try {
    [config] = await Promise.all([api('/api/config'), api('/api/menu').then(m => renderMenu(m.categories))]);
    $('#brand-name').textContent = config.storeName;
    document.title = `${config.storeName} | Faça seu pedido`;
    $('#store-banner').classList.toggle('hidden', config.open);
  } catch (err) { $('#menu').textContent = err.message; }
  renderCart();
})();
