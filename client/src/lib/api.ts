import { categories as localCategories, products as localProducts, seedReviews } from '../../../shared/catalog';
import { queryProducts } from '../../../shared/query';
import {
  FREE_SHIPPING_FROM,
  SHIPPING_FEE,
  type CartLine,
  type Category,
  type Customer,
  type Order,
  type Product,
  type ProductPage,
  type ProductQuery,
  type Review,
} from '../../../shared/types';

/** In the single-file preview build there is no server; everything runs from the bundled catalogue. */
export const OFFLINE = import.meta.env.MODE === 'preview';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('We could not reach the store. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? 'Something went wrong', res.status);
  return body as T;
}

function toParams(q: ProductQuery) {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === '' || v === false) return;
    p.set(k, v === true ? '1' : String(v));
  });
  return p.toString();
}

// ─── Offline helpers (preview build) ──────────────────────────

const LS = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep going in memory */
    }
  },
};

const memory = { reviews: [] as Review[], orders: [] as Order[] };
const localReviews = () => [...seedReviews, ...LS.get<Review[]>('sh:reviews', memory.reviews)];
const withRatings = (p: Product): Product => {
  const rs = localReviews().filter((r) => r.productSlug === p.slug);
  if (!rs.length) return p;
  const avg = rs.reduce((a, r) => a + r.rating, 0) / rs.length;
  return { ...p, rating: Math.round(avg * 10) / 10, reviewCount: rs.length };
};
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

// ─── Public API ───────────────────────────────────────────────

export type CategoryWithCount = Category & { count: number };

export const api = {
  categories(): Promise<CategoryWithCount[]> {
    if (OFFLINE)
      return delay(localCategories.map((c) => ({ ...c, count: localProducts.filter((p) => p.category === c.slug).length })));
    return request('/categories');
  },

  products(q: ProductQuery = {}): Promise<ProductPage> {
    if (OFFLINE) {
      const page = queryProducts(localProducts.map(withRatings), q);
      return delay(page);
    }
    return request(`/products?${toParams(q)}`);
  },

  product(slug: string): Promise<{ product: Product; reviews: Review[]; related: Product[] }> {
    if (OFFLINE) {
      const p = localProducts.find((x) => x.slug === slug);
      if (!p) return Promise.reject(new ApiError('Product not found', 404));
      const reviews = localReviews()
        .filter((r) => r.productSlug === slug)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const related = localProducts.filter((x) => x.category === p.category && x.slug !== slug).slice(0, 4).map(withRatings);
      return delay({ product: withRatings(p), reviews, related });
    }
    return request(`/products/${encodeURIComponent(slug)}`);
  },

  addReview(slug: string, r: Pick<Review, 'name' | 'rating' | 'title' | 'body'>): Promise<Review> {
    if (OFFLINE) {
      const review: Review = { ...r, id: Date.now(), productSlug: slug, createdAt: new Date().toISOString() };
      memory.reviews = [...LS.get<Review[]>('sh:reviews', memory.reviews), review];
      LS.set('sh:reviews', memory.reviews);
      return delay(review);
    }
    return request(`/products/${encodeURIComponent(slug)}/reviews`, { method: 'POST', body: JSON.stringify(r) });
  },

  createOrder(customer: Customer, payment: Order['payment'], items: CartLine[]): Promise<Order> {
    if (OFFLINE) {
      const lines = items.map((l) => {
        const p = localProducts.find((x) => x.slug === l.slug)!;
        return { ...l, name: p.name, price: p.price, image: p.images[0] };
      });
      const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
      const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
      const d = new Date();
      const order: Order = {
        number: `SH-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${1000 + Math.floor(Math.random() * 9000)}`,
        customer,
        items: lines,
        subtotal,
        shipping,
        total: subtotal + shipping,
        payment,
        status: 'placed',
        createdAt: d.toISOString(),
      };
      memory.orders = [...LS.get<Order[]>('sh:orders', memory.orders), order];
      LS.set('sh:orders', memory.orders);
      return delay(order);
    }
    return request('/orders', { method: 'POST', body: JSON.stringify({ customer, payment, items }) });
  },

  order(number: string, email: string): Promise<Order> {
    if (OFFLINE) {
      const o = LS.get<Order[]>('sh:orders', memory.orders).find(
        (x) => x.number === number && x.customer.email.toLowerCase() === email.toLowerCase(),
      );
      return o ? delay(o) : Promise.reject(new ApiError('We could not find an order with those details', 404));
    }
    return request(`/orders/${encodeURIComponent(number)}?email=${encodeURIComponent(email)}`);
  },

  subscribe(email: string): Promise<{ message: string }> {
    if (OFFLINE) return delay({ message: 'You are on the list. We will email you about new colours and offers.' });
    return request('/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
  },

  contact(m: { name: string; email: string; subject: string; message: string }): Promise<{ message: string }> {
    if (OFFLINE) return delay({ message: 'Thanks, we will reply within one working day.' });
    return request('/contact', { method: 'POST', body: JSON.stringify(m) });
  },

  admin<T>(path: string, token: string, init?: RequestInit): Promise<T> {
    if (OFFLINE) return Promise.reject(new ApiError('The admin needs the API server. Run the full project locally.', 503));
    return request(`/admin${path}`, { ...init, headers: { authorization: `Bearer ${token}` } });
  },
};

/** Product lookup for the cart (cart lines only store slug/size/colour/qty). */
export const catalogIndex = new Map(localProducts.map((p) => [p.slug, p]));
