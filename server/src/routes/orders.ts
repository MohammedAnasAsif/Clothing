import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '../db';
import { rateLimit } from '../middleware';
import { FREE_SHIPPING_FROM, SHIPPING_FEE, type Order, type OrderItem } from '../../../shared/types';

export const orders = Router();

const orderBody = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(120),
    phone: z.string().trim().regex(/^[+\d][\d\s-]{8,15}$/, 'Enter a valid phone number'),
    address: z.string().trim().min(6).max(200),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be 6 digits'),
  }),
  payment: z.enum(['cod', 'upi']),
  items: z
    .array(
      z.object({
        slug: z.string().max(80),
        size: z.string().max(5),
        color: z.string().max(40),
        qty: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

class OrderError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ST-${ymd}-${randomInt(1000, 9999)}`;
}

orders.post('/orders', rateLimit(10, 60_000), (req, res) => {
  const parsed = orderBody.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return res.status(400).json({ error: first?.message ?? 'Invalid order', issues: parsed.error.issues });
  }
  const { customer, payment, items } = parsed.data;

  try {
    db.exec('BEGIN IMMEDIATE');
    const lines: OrderItem[] = [];
    const getProduct = db.prepare('SELECT slug, name, price, images, sizes, colors, stock FROM products WHERE slug = ?');
    const takeStock = db.prepare('UPDATE products SET stock = stock - ? WHERE slug = ? AND stock >= ?');

    for (const item of items) {
      const p = getProduct.get(item.slug) as any;
      if (!p) throw new OrderError(`"${item.slug}" is no longer available`);
      if (!JSON.parse(p.sizes).includes(item.size)) throw new OrderError(`Size ${item.size} is not offered for ${p.name}`);
      if (!JSON.parse(p.colors).some((c: { name: string }) => c.name === item.color))
        throw new OrderError(`${item.color} is not offered for ${p.name}`);
      // Price always comes from the database, never from the client.
      const updated = takeStock.run(item.qty, item.slug, item.qty);
      if (updated.changes === 0) throw new OrderError(`Only ${p.stock} left of ${p.name}`, 409);
      lines.push({ ...item, name: p.name, price: p.price, image: JSON.parse(p.images)[0] });
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    const total = subtotal + shipping;
    const createdAt = new Date().toISOString();

    let number = orderNumber();
    while (db.prepare('SELECT 1 FROM orders WHERE number = ?').get(number)) number = orderNumber();

    const info = db
      .prepare(`INSERT INTO orders (number, customer, email, subtotal, shipping, total, payment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(number, JSON.stringify(customer), customer.email, subtotal, shipping, total, payment, createdAt);
    const addItem = db.prepare(`INSERT INTO order_items (order_id, product_slug, name, image, size, color, qty, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const l of lines) addItem.run(info.lastInsertRowid, l.slug, l.name, l.image, l.size, l.color, l.qty, l.price);
    db.exec('COMMIT');

    const order: Order = { number, customer, items: lines, subtotal, shipping, total, payment, status: 'placed', createdAt };
    res.status(201).json(order);
  } catch (e) {
    db.exec('ROLLBACK');
    if (e instanceof OrderError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
});

/** Order lookup needs both the number and the email it was placed with. */
orders.get('/orders/:number', rateLimit(20, 60_000), (req, res) => {
  const email = String(req.query.email ?? '').trim().toLowerCase();
  const row = db.prepare('SELECT * FROM orders WHERE number = ? AND email = ?').get(String(req.params.number), email) as any;
  if (!row) return res.status(404).json({ error: 'We could not find an order with those details' });
  const items = db
    .prepare('SELECT product_slug AS slug, name, image, size, color, qty, price FROM order_items WHERE order_id = ?')
    .all(row.id);
  const order: Order = {
    number: row.number,
    customer: JSON.parse(row.customer),
    items: items as unknown as OrderItem[],
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    payment: row.payment,
    status: row.status,
    createdAt: row.created_at,
  };
  res.json(order);
});
