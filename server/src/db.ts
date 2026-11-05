import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { categories, products, seedReviews } from '../../shared/catalog';
import type { Product, Review } from '../../shared/types';

const DB_PATH =
  process.env.DB_PATH === ':memory:'
    ? ':memory:'
    : resolve(process.env.DB_PATH ?? resolve(import.meta.dirname, '../data/st-clothings.db'));
if (DB_PATH !== ':memory:') mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(slug),
  type TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('men','women','unisex')),
  price INTEGER NOT NULL CHECK (price > 0),
  compare_at INTEGER,
  images TEXT NOT NULL,
  colors TEXT NOT NULL,
  sizes TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  fabric TEXT NOT NULL,
  fit TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT NOT NULL,
  badge TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_slug);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT UNIQUE NOT NULL,
  customer TEXT NOT NULL,
  email TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'placed',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

/** Seeds the catalogue the first time the database is created. */
export function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get() as { n: number };
  if (n > 0) return false;

  db.exec('BEGIN');
  try {
    const cat = db.prepare(
      'INSERT INTO categories (slug, name, tagline, description, image, position) VALUES (?, ?, ?, ?, ?, ?)',
    );
    categories.forEach((c, i) => cat.run(c.slug, c.name, c.tagline, c.description, c.image, i));

    const prod = db.prepare(`INSERT INTO products
      (id, slug, name, category, type, gender, price, compare_at, images, colors, sizes, sku, stock, fabric, fit, description, details, badge, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const p of products) {
      prod.run(
        p.id, p.slug, p.name, p.category, p.type, p.gender, p.price, p.compareAt,
        JSON.stringify(p.images), JSON.stringify(p.colors), JSON.stringify(p.sizes),
        p.sku, p.stock, p.fabric, p.fit, p.description, JSON.stringify(p.details), p.badge ?? null,
        new Date(Date.UTC(2026, 9, 1) + p.id * 3600_000).toISOString(),
      );
    }

    const rev = db.prepare(
      'INSERT INTO reviews (product_slug, name, rating, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const r of seedReviews) rev.run(r.productSlug, r.name, r.rating, r.title, r.body, r.createdAt);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return true;
}

// ─── Row mappers ──────────────────────────────────────────────

export const PRODUCT_SELECT = `
  SELECT p.*,
    COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.product_slug = p.slug), 0) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.product_slug = p.slug) AS review_count
  FROM products p`;

export function toProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    type: row.type,
    gender: row.gender,
    price: row.price,
    compareAt: row.compare_at ?? null,
    images: JSON.parse(row.images),
    colors: JSON.parse(row.colors),
    sizes: JSON.parse(row.sizes),
    sku: row.sku,
    stock: row.stock,
    fabric: row.fabric,
    fit: row.fit,
    description: row.description,
    details: JSON.parse(row.details),
    badge: row.badge ?? undefined,
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
  };
}

export function toReview(row: any): Review {
  return {
    id: row.id,
    productSlug: row.product_slug,
    name: row.name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
  };
}
