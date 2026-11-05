import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalog } from './routes/catalog';
import { orders } from './routes/orders';
import { forms } from './routes/forms';
import { admin } from './routes/admin';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
  api.use(catalog);
  api.use(orders);
  api.use(forms);
  api.use('/admin', admin);
  api.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use('/api', api);

  // In production the API also serves the built storefront.
  const dist = resolve(import.meta.dirname, '../../client/dist');
  if (existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '7d', index: false }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(resolve(dist, 'index.html')));
  }

  app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
