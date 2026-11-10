import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import publicRoutes from './routes/public.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { PricingError } from './services/pricing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Monta o app sem abrir porta nem conectar ao banco (o server.js liga tudo; testes de rota usam direto).
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'");
    if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use((req, _res, next) => { if (req.body === undefined) req.body = {}; next(); });

  app.use('/api', publicRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/admin', (_req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
  app.use(express.static(publicDir, { extensions: ['html'] }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use((_req, res) => res.status(404).sendFile(path.join(publicDir, '404.html')));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof PricingError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  });
  return app;
}
