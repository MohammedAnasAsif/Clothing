import type { Product, ProductPage, ProductQuery } from './types';

/** In-memory version of the server's product query, used by the static preview. */
export function queryProducts(all: Product[], q: ProductQuery): ProductPage {
  let items = all.filter((p) => {
    if (q.category && p.category !== q.category) return false;
    if (q.gender && !(p.gender === q.gender || p.gender === 'unisex')) return false;
    if (q.type && p.type !== q.type) return false;
    if (q.size && !p.sizes.includes(q.size)) return false;
    if (q.sale && !p.compareAt) return false;
    if (q.min != null && p.price < q.min) return false;
    if (q.max != null && p.price > q.max) return false;
    if (q.q) {
      const needle = q.q.toLowerCase();
      const hay = `${p.name} ${p.type} ${p.category} ${p.fabric}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  switch (q.sort) {
    case 'price-asc':
      items = [...items].sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items = [...items].sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      items = [...items].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'newest':
      items = [...items].sort((a, b) => b.id - a.id);
      break;
    default:
      break;
  }

  const limit = q.limit ?? 12;
  const page = Math.max(1, q.page ?? 1);
  const total = items.length;
  return {
    items: items.slice(0, page * limit), // "load more" returns everything up to this page
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function discountPct(p: Pick<Product, 'price' | 'compareAt'>) {
  return p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
}
