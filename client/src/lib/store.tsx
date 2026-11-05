import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartLine, Product } from '../../../shared/types';
import { FREE_SHIPPING_FROM, SHIPPING_FEE } from '../../../shared/types';

type CartItem = CartLine & { name: string; price: number; compareAt: number | null; image: string };

interface StoreValue {
  cart: CartItem[];
  wishlist: string[];
  cartCount: number;
  subtotal: number;
  shipping: number;
  addToCart: (p: Product, opts?: { size?: string; color?: string; qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  inWishlist: (slug: string) => boolean;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  quickView: Product | null;
  setQuickView: (p: Product | null) => void;
  toast: string | null;
  notify: (msg: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export const lineKey = (l: Pick<CartLine, 'slug' | 'size' | 'color'>) => `${l.slug}|${l.size}|${l.color}`;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode or storage blocked: the cart still works for this visit */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('st:cart', []));
  const [wishlist, setWishlist] = useState<string[]>(() => load('st:wishlist', []));
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => save('st:cart', cart), [cart]);
  useEffect(() => save('st:wishlist', wishlist), [wishlist]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const addToCart: StoreValue['addToCart'] = useCallback((p, opts = {}) => {
    const line: CartItem = {
      slug: p.slug,
      size: opts.size ?? p.sizes[Math.min(2, p.sizes.length - 1)],
      color: opts.color ?? p.colors[0].name,
      qty: opts.qty ?? 1,
      name: p.name,
      price: p.price,
      compareAt: p.compareAt,
      image: p.images[0],
    };
    setCart((prev) => {
      const key = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === key);
      if (existing) return prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(10, l.qty + line.qty) } : l));
      return [...prev, line];
    });
    setQuickView(null);
    setCartOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)));
  }, []);
  const removeLine = useCallback((key: string) => setCart((prev) => prev.filter((l) => lineKey(l) !== key)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const has = prev.includes(slug);
        notify(has ? 'Removed from your wishlist' : 'Saved to your wishlist');
        return has ? prev.filter((s) => s !== slug) : [...prev, slug];
      });
    },
    [notify],
  );

  const value = useMemo<StoreValue>(() => {
    const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
    return {
      cart,
      wishlist,
      cartCount: cart.reduce((s, l) => s + l.qty, 0),
      subtotal,
      shipping: subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE,
      addToCart,
      setQty,
      removeLine,
      clearCart,
      toggleWishlist,
      inWishlist: (slug) => wishlist.includes(slug),
      cartOpen,
      setCartOpen,
      quickView,
      setQuickView,
      toast,
      notify,
    };
  }, [cart, wishlist, cartOpen, quickView, toast, addToCart, setQty, removeLine, clearCart, toggleWishlist, notify]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Small data-loading hook with loading / error / reload. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => alive && setState({ data, error: null, loading: false }),
      (error) => alive && setState((s) => ({ data: s.data, error, loading: false })),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
