import { Router } from 'express';
import { z } from 'zod';
import { db, PRODUCT_SELECT, toProduct, toReview } from '../db';
import { rateLimit } from '../middleware';

export const catalog = Router();

catalog.get('/categories', (_req, res) => {
  const rows = db
    .prepare(`SELECT c.slug, c.name, c.tagline, c.description, c.image,
      (SELECT COUNT(*) FROM products p WHERE p.category = c.slug) AS count
      FROM categories c ORDER BY position`)
    .all();
  res.json(rows);
});

const listQuery = z.object({
  category: z.string().max(40).optional(),
  gender: z.enum(['men', 'women', 'unisex']).optional(),
  type: z.string().max(40).optional(),
  size: z.string().max(20).optional(),
  q: z.string().trim().max(60).optional(),
  sale: z.enum(['1', 'true']).optional(),
  min: z.coerce.number().int().nonnegative().optional(),
  max: z.coerce.number().int().positive().optional(),
  sort: z.enum(['featured', 'newest', 'price-asc', 'price-desc', 'rating']).default('featured'),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

const ORDER_BY: Record<string, string> = {
  featured: 'p.id ASC',
  newest: 'p.id DESC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  rating: 'rating DESC, review_count DESC',
};

catalog.get('/products', (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid filters', issues: parsed.error.issues });
  const q = parsed.data;

  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q.category) { where.push('p.category = ?'); args.push(q.category); }
  if (q.gender) { where.push("(p.gender = ? OR p.gender = 'unisex')"); args.push(q.gender); }
  if (q.type) { where.push('p.type = ?'); args.push(q.type); }
  if (q.size) { where.push('EXISTS (SELECT 1 FROM json_each(p.sizes) WHERE value = ?)'); args.push(q.size); }
  if (q.sale) where.push('p.compare_at IS NOT NULL');
  if (q.min != null) { where.push('p.price >= ?'); args.push(q.min); }
  if (q.max != null) { where.push('p.price <= ?'); args.push(q.max); }
  if (q.q) {
    where.push("(p.name || ' ' || p.type || ' ' || p.category || ' ' || p.fabric) LIKE ? ESCAPE '\\'");
    args.push(`%${q.q.replace(/[\\%_]/g, (m) => '\\' + m)}%`);
  }
  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM products p${whereSql}`).get(...args) as { total: number };
  const rows = db
    .prepare(`${PRODUCT_SELECT}${whereSql} ORDER BY ${ORDER_BY[q.sort]} LIMIT ?`)
    .all(...args, q.page * q.limit);

  res.json({
    items: rows.map(toProduct),
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
});

catalog.get('/products/:slug', (req, res) => {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(String(req.params.slug));
  if (!row) return res.status(404).json({ error: 'Product not found' });
  const product = toProduct(row);
  const reviews = db
    .prepare('SELECT * FROM reviews WHERE product_slug = ? ORDER BY created_at DESC LIMIT 50')
    .all(product.slug)
    .map(toReview);
  const related = db
    .prepare(`${PRODUCT_SELECT} WHERE p.category = ? AND p.slug != ? ORDER BY RANDOM() LIMIT 4`)
    .all(product.category, product.slug)
    .map(toProduct);
  res.json({ product, reviews, related });
});

const reviewBody = z.object({
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(80),
  body: z.string().trim().min(10).max(1000),
});

catalog.post('/products/:slug/reviews', rateLimit(5, 60_000), (req, res) => {
  const exists = db.prepare('SELECT 1 FROM products WHERE slug = ?').get(String(req.params.slug));
  if (!exists) return res.status(404).json({ error: 'Product not found' });
  const parsed = reviewBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the review fields', issues: parsed.error.issues });
  const r = parsed.data;
  const info = db
    .prepare('INSERT INTO reviews (product_slug, name, rating, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(String(req.params.slug), r.name, r.rating, r.title, r.body, new Date().toISOString());
  const row = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(toReview(row));
});
