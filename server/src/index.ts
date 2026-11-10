import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envFile = resolve(import.meta.dirname, '../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { seedIfEmpty } = await import('./db');
const { createApp } = await import('./app');

if (seedIfEmpty()) console.log('Seeded the Style Heaven catalogue');

const port = Number(process.env.PORT ?? 4000);
createApp().listen(port, () => {
  console.log(`Style Heaven API on http://localhost:${port}`);
});
