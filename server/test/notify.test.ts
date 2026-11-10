import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { notifyNewOrder } from '../src/notify.ts';
import type { Order } from '../../shared/types.ts';

const order: Order = {
  number: 'SH-261110-1234',
  customer: { name: 'Asha', email: 'a@example.com', phone: '9876543210', address: '1 Main Rd', city: 'Trichy', state: 'Tamil Nadu', pincode: '620001' },
  items: [{ slug: 'lemon-satin-combo', name: 'Lemon Satin Combo', size: 'Standard', color: 'Lemon', qty: 1, price: 799, image: 'x' }],
  subtotal: 799,
  shipping: 60,
  total: 859,
  payment: 'cod',
  status: 'placed',
  createdAt: new Date().toISOString(),
};

const realFetch = globalThis.fetch;
const KEYS = ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_NOTIFY_TO', 'WHATSAPP_TEMPLATE'];
afterEach(() => {
  globalThis.fetch = realFetch;
  KEYS.forEach((k) => delete process.env[k]);
});

function spy() {
  const calls: Array<{ url: string; body: any; auth: string }> = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)), auth: (init.headers as Record<string, string>).authorization });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  return calls;
}

test('does nothing when WhatsApp is not configured', async () => {
  const calls = spy();
  await notifyNewOrder(order);
  assert.equal(calls.length, 0);
});

test('sends a template alert with the order details', async () => {
  Object.assign(process.env, { WHATSAPP_TOKEN: 't0k', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_NOTIFY_TO: '918056221231', WHATSAPP_TEMPLATE: 'new_order' });
  const calls = spy();
  await notifyNewOrder(order);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /graph\.facebook\.com\/v[\d.]+\/123\/messages$/);
  assert.equal(calls[0].auth, 'Bearer t0k');
  assert.equal(calls[0].body.to, '918056221231');
  assert.equal(calls[0].body.template.name, 'new_order');
  const params = calls[0].body.template.components[0].parameters.map((p: any) => p.text);
  assert.equal(params[0], 'SH-261110-1234');
  assert.match(params[2], /859.*COD/);
  assert.match(params[3], /Lemon Satin Combo \(Lemon, Standard\) × 1/);
});

test('a failed alert never throws', async () => {
  Object.assign(process.env, { WHATSAPP_TOKEN: 't', WHATSAPP_PHONE_NUMBER_ID: '1', WHATSAPP_NOTIFY_TO: '91' });
  globalThis.fetch = (async () => { throw new Error('network down'); }) as typeof fetch;
  await assert.doesNotReject(notifyNewOrder(order));
});
