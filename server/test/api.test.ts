process.env.DB_PATH = ':memory:';
process.env.ADMIN_TOKEN = 'test-admin-token';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const { seedIfEmpty } = await import('../src/db.ts');
const { createApp } = await import('../src/app.ts');

let server: Server;
let base = '';

before(() => {
  seedIfEmpty();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(() => server.close());

const json = (path: string, init?: RequestInit) =>
  fetch(base + path, { headers: { 'content-type': 'application/json' }, ...init }).then(async (r) => ({
    status: r.status,
    body: await r.json(),
  }));

const customer = {
  name: 'Test Shopper',
  email: 'shopper@example.com',
  phone: '+91 98765 43210',
  address: '12 MG Road, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
};

test('lists the four categories with counts', async () => {
  const { status, body } = await json('/categories');
  assert.equal(status, 200);
  assert.deepEqual(body.map((c: any) => c.slug), ['scrunchies', 'eye-masks', 'pillow-covers', 'bows', 'gift-sets', 'pajamas']);
  assert.ok(body.every((c: any) => c.count >= 4));
});

test('filters, sorts and paginates products', async () => {
  const { body } = await json('/products?category=scrunchies&sort=price-asc&limit=3');
  assert.equal(body.items.length, 3);
  assert.ok(body.total >= 6);
  assert.ok(body.items[0].price <= body.items[1].price);
  assert.ok(body.items.every((p: any) => p.category === 'scrunchies'));

  const sale = await json('/products?sale=1&limit=60');
  assert.ok(sale.body.items.every((p: any) => p.compareAt));

  const search = await json('/products?q=pillow');
  assert.ok(search.body.items.some((p: any) => p.slug === 'satin-pillow-cover'));

  const bad = await json('/products?sort=drop-table');
  assert.equal(bad.status, 400);
});

test('returns a product with reviews and related items', async () => {
  const { status, body } = await json('/products/satin-pillow-cover');
  assert.equal(status, 200);
  assert.equal(body.product.name, 'Satin Pillow Cover');
  assert.ok(Array.isArray(body.reviews));
  assert.ok(body.related.length > 0);
  assert.ok(body.related.every((p: any) => p.category === 'pillow-covers' && p.slug !== 'satin-pillow-cover'));
  assert.equal((await json('/products/nope')).status, 404);
});

test('accepts a valid review and rejects an invalid one', async () => {
  const ok = await json('/products/satin-sleep-eye-mask/reviews', {
    method: 'POST',
    body: JSON.stringify({ name: 'Asha', rating: 5, title: 'Beautiful', body: 'Drapes perfectly and feels lovely.' }),
  });
  assert.equal(ok.status, 201);
  const bad = await json('/products/satin-sleep-eye-mask/reviews', {
    method: 'POST',
    body: JSON.stringify({ name: 'A', rating: 9, title: '', body: 'x' }),
  });
  assert.equal(bad.status, 400);
});

test('places an order using server-side prices and reduces stock', async () => {
  const before = (await json('/products/lemon-satin-combo')).body.product;
  const { status, body } = await json('/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer,
      payment: 'cod',
      items: [{ slug: 'lemon-satin-combo', size: 'Standard', color: 'Lemon', qty: 2, price: 1 }],
    }),
  });
  assert.equal(status, 201);
  assert.match(body.number, /^SH-\d{6}-\d{4}$/);
  assert.equal(body.subtotal, before.price * 2);
  assert.equal(body.shipping, 0);
  const after = (await json('/products/lemon-satin-combo')).body.product;
  assert.equal(after.stock, before.stock - 2);

  const lookup = await json(`/orders/${body.number}?email=${customer.email}`);
  assert.equal(lookup.status, 200);
  assert.equal(lookup.body.items.length, 1);
  assert.equal((await json(`/orders/${body.number}?email=someone@else.com`)).status, 404);
});

test('rejects orders for unknown sizes or more than the stock', async () => {
  const size = await json('/orders', {
    method: 'POST',
    body: JSON.stringify({ customer, payment: 'upi', items: [{ slug: 'satin-pajama-set', size: 'XXL', color: 'Onion Pink', qty: 1 }] }),
  });
  assert.equal(size.status, 400);

  const tooMany = await json('/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer,
      payment: 'upi',
      items: Array.from({ length: 2 }, () => ({ slug: 'velvet-rhinestone-scrunchie', size: 'Regular', color: 'Classic Black', qty: 10 })),
    }),
  });
  assert.equal(tooMany.status, 409);
  // The failed order must not have taken any stock.
  const p = (await json('/products/velvet-rhinestone-scrunchie')).body.product;
  assert.equal(p.stock, 12);
});

test('newsletter and contact forms', async () => {
  const first = await json('/newsletter', { method: 'POST', body: JSON.stringify({ email: 'New@Example.com' }) });
  assert.equal(first.status, 201);
  const again = await json('/newsletter', { method: 'POST', body: JSON.stringify({ email: 'new@example.com' }) });
  assert.equal(again.status, 200);
  const contact = await json('/contact', {
    method: 'POST',
    body: JSON.stringify({ name: 'Ravi', email: 'ravi@example.com', subject: 'Sizing', message: 'Do the shirts run small?' }),
  });
  assert.equal(contact.status, 201);
});

test('admin requires the token', async () => {
  assert.equal((await json('/admin/summary')).status, 401);
  const ok = await json('/admin/summary', { headers: { authorization: 'Bearer test-admin-token' } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.stats.orders >= 1);
});
