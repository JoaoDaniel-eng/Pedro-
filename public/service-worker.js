const CACHE_NAME = 'bunker-rebellados-v20261110-parte8-revisao';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/styles.css?v=20261110-parte8-revisao',
  '/js/diagnostics.js?v=20261105-ignora-externos',
  '/js/site/core.js?v=20261110-parte8-revisao',
  '/js/site/checkout.js?v=20261110-parte8-revisao',
  '/js/site/reviews.js?v=20261110-parte8-revisao',
  '/js/site/account.js?v=20261110-parte8-revisao',
  '/js/site/tracking.js?v=20261110-parte8-revisao',
  '/js/site/saved-details.js?v=20261110-parte8-revisao',
  '/js/site/pwa.js?v=20261110-parte8-revisao',
  '/js/site/theme.js?v=20261110-parte8-revisao',
  '/js/site/sidemenu.js?v=20261110-parte8-revisao',
  '/js/site/settings.js?v=20261110-parte8-revisao',
  '/js/site/cart-storage.js?v=20261110-parte8-revisao',
  '/js/site/favorites.js?v=20261110-parte8-revisao',
  '/js/site/forgot-password.js?v=20261110-parte8-revisao',
  '/js/site/live.js?v=20261110-parte8-revisao',
  '/js/site/store-banner.js?v=20261110-parte8-revisao',
  '/js/site/builder-steps.js?v=20261110-parte8-revisao',
  '/js/site/main.js?v=20261110-parte8-revisao',
  '/manifest.webmanifest',
  '/images/hero-combo-hamburguer.webp',
  '/images/destaque-hamburguer-combo.webp',
  '/images/destaque-pizza-suco.webp',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/icon-maskable-512.png',
  '/images/apple-touch-icon.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('bunker-rebellados-') && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  // Nunca armazenar respostas de API, dados de clientes, pedidos ou conteúdo administrativo.
  if (url.pathname.startsWith('/api/') || url.pathname === '/admin' || url.pathname.startsWith('/admin/') || url.pathname === '/dev' || url.pathname.startsWith('/dev/')) return;
  if (request.mode === 'navigate') {
    if (url.pathname !== '/' && url.pathname !== '/index.html') {
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('/', response.clone()));
      return response;
    }).catch(() => caches.match('/')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok && !response.headers.has('Set-Cookie')) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  })));
});
