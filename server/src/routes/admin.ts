import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAdmin } from '../middleware';

export const admin = Router();
admin.use(requireAdmin);

admin.get('/summary', (_req, res) => {
  const stats = db
    .prepare(`SELECT
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders) AS revenue,
      (SELECT COUNT(*) FROM subscribers) AS subscribers,
      (SELECT COUNT(*) FROM messages) AS messages,
      (SELECT COUNT(*) FROM products WHERE stock < 10) AS lowStock`)
    .get();
  const recentOrders = db
    .prepare(`SELECT o.number, o.email, o.total, o.payment, o.status, o.created_at AS createdAt,
      (SELECT SUM(qty) FROM order_items i WHERE i.order_id = o.id) AS units
      FROM orders o ORDER BY o.id DESC LIMIT 50`)
    .all();
  const messages = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 50').all();
  const subscribers = db.prepare('SELECT * FROM subscribers ORDER BY created_at DESC LIMIT 100').all();
  const lowStock = db.prepare('SELECT slug, name, stock FROM products WHERE stock < 10 ORDER BY stock').all();
  res.json({ stats, recentOrders, messages, subscribers, lowStock });
});

admin.patch('/orders/:number', (req, res) => {
  const parsed = z.object({ status: z.enum(['placed', 'packed', 'shipped', 'delivered']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  const info = db.prepare('UPDATE orders SET status = ? WHERE number = ?').run(parsed.data.status, String(req.params.number));
  if (!info.changes) return res.status(404).json({ error: 'Order not found' });
  res.json({ ok: true });
});
