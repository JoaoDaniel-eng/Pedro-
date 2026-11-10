const $ = s => document.querySelector(s);
const money = c => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
const STATUSES = ['novo', 'preparando', 'saiu', 'pronto', 'entregue', 'cancelado'];
let token = sessionStorage.getItem('adminToken');
let timer;

async function api(url, method = 'GET', body) {
  const res = await fetch(`/api/admin${url}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

function logout() {
  sessionStorage.removeItem('adminToken'); token = null; clearInterval(timer);
  $('#panel').classList.add('hidden'); $('#logout').classList.add('hidden'); $('#login-form').classList.remove('hidden');
}

async function loadOrders() {
  const { orders } = await api('/orders');
  $('#tab-orders').replaceChildren(...(orders.length ? orders : [null]).map(o => !o ? el('p', { className: 'muted' }, 'Nenhum pedido nos últimos 3 dias.') :
    el('article', { className: 'order' },
      el('header', {}, el('b', {}, `${o.code} · ${o.customer_name}`), el('span', { className: 'badge' }, o.type === 'entrega' ? '🛵 ENTREGA' : '🏪 RETIRADA')),
      el('p', {}, o.items.map(i => `${i.qty}x ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join(' · ')),
      el('p', { className: 'muted' }, `${o.phone}${o.address ? ` · ${o.address}` : ''} · ${o.payment} · ${o.notes || ''}`),
      el('div', { className: 'row' }, el('b', {}, money(o.total_cents)),
        Object.assign(el('select', { onchange: async e => { await api(`/orders/${o.id}/status`, 'PATCH', { status: e.target.value }); } },
          ...STATUSES.map(s => el('option', { value: s, selected: s === o.status }, s))), {})))));
}

async function loadProducts() {
  const { products } = await api('/products');
  $('#tab-products').replaceChildren(...products.map(p => el('div', { className: 'row' },
    el('span', {}, `${p.category} · ${p.name}`),
    el('input', { type: 'number', min: 0, step: 0.5, value: (p.price_cents / 100).toFixed(2), style: 'width:7rem',
      onchange: e => api(`/products/${p.id}`, 'PATCH', { priceCents: Math.round(Number(e.target.value) * 100) }) }),
    el('label', {}, el('input', { type: 'checkbox', checked: p.available, style: 'display:inline;width:auto',
      onchange: e => api(`/products/${p.id}`, 'PATCH', { available: e.target.checked }) }), ' Disponível'))));
}

async function enter() {
  $('#login-form').classList.add('hidden'); $('#panel').classList.remove('hidden'); $('#logout').classList.remove('hidden');
  await Promise.all([loadOrders(), loadProducts()]);
  clearInterval(timer); timer = setInterval(() => loadOrders().catch(() => {}), 15000); // atualiza pedidos sozinho
}

$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    token = (await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; })).token;
    sessionStorage.setItem('adminToken', token);
    await enter();
  } catch (err) { $('#login-message').textContent = err.message; }
});
$('#logout').addEventListener('click', logout);
$('#store-open').addEventListener('change', e => api('/settings', 'PATCH', { storeOpen: e.target.checked }));
$('#fee-save').addEventListener('click', () => api('/settings', 'PATCH', { deliveryFeeCents: Math.round(Number($('#fee-input').value) * 100) }));
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('button-outline', x !== b));
  $('#tab-orders').classList.toggle('hidden', b.dataset.tab !== 'orders');
  $('#tab-products').classList.toggle('hidden', b.dataset.tab !== 'products');
}));
fetch('/api/config').then(r => r.json()).then(c => { $('#store-open').checked = c.open; $('#fee-input').value = (c.deliveryFeeCents / 100).toFixed(2); }).catch(() => {});
if (token) enter().catch(logout);
