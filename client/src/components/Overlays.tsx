import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { FREE_SHIPPING_FROM } from '../../../shared/types';
import { discountPct } from '../../../shared/query';
import { api, type CategoryWithCount } from '../lib/api';
import { img, money } from '../lib/format';
import { lineKey, useStore } from '../lib/store';
import { BuyOptions } from './BuyOptions';
import { Price, Stars } from './ui';

const ease = [0.22, 1, 0.36, 1] as const;

/** Locks page scroll and closes on Escape while an overlay is open. */
function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
}

function Scrim({ onClick }: { onClick: () => void }) {
  return (
    <motion.div className="scrim" onClick={onClick} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
  );
}

export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useOverlay(open, onClose);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) setTimeout(() => panel.current?.querySelector<HTMLElement>('button, a, input')?.focus(), 60);
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <Scrim onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            className={`drawer drawer--${side}`}
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="drawer__head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="drawer__body">{children}</div>
            {footer && <div className="drawer__foot">{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ShippingBar({ subtotal }: { subtotal: number }) {
  const left = FREE_SHIPPING_FROM - subtotal;
  return (
    <div className="ship-bar">
      {left > 0 ? (
        <>
          You are <b>{money(left)}</b> away from free shipping
        </>
      ) : (
        <>You have unlocked free shipping</>
      )}
      <div className="ship-bar__track">
        <div className="ship-bar__fill" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100)}%` }} />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeLine, subtotal, cartCount } = useStore();
  const close = () => setCartOpen(false);
  const navigate = useNavigate();
  return (
    <Drawer
      open={cartOpen}
      onClose={close}
      title={`Your cart (${cartCount})`}
      footer={
        cart.length > 0 && (
          <>
            <ShippingBar subtotal={subtotal} />
            <div className="summary__row" style={{ fontWeight: 600 }}>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5 }}>Taxes included. Shipping calculated at checkout.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="btn btn--ghost" onClick={() => { close(); navigate('/cart'); }}>View cart</button>
              <button className="btn" onClick={() => { close(); navigate('/checkout'); }}>Checkout</button>
            </div>
          </>
        )
      }
    >
      {cart.length === 0 ? (
        <div className="empty" style={{ padding: '60px 0' }}>
          <ShoppingBag size={34} strokeWidth={1} />
          <h2 style={{ fontSize: 28 }}>Your cart is empty</h2>
          <p>Start with a satin scrunchie or a colour combo.</p>
          <button className="btn" onClick={() => { close(); navigate('/shop'); }}>Shop all</button>
        </div>
      ) : (
        cart.map((l) => {
          const key = lineKey(l);
          return (
            <div className="line" key={key}>
              <Link to={`/product/${l.slug}`} onClick={close}>
                <img src={img(l.image, 200, 266)} alt="" />
              </Link>
              <div>
                <Link to={`/product/${l.slug}`} onClick={close} className="line__name">{l.name}</Link>
                <div className="line__meta">{l.color} · {l.size}</div>
                <div className="qty">
                  <button aria-label="Decrease quantity" onClick={() => (l.qty > 1 ? setQty(key, l.qty - 1) : removeLine(key))}><Minus size={13} /></button>
                  <span>{l.qty}</span>
                  <button aria-label="Increase quantity" onClick={() => setQty(key, l.qty + 1)}><Plus size={13} /></button>
                </div>
              </div>
              <div>
                <div className="line__price">{money(l.price * l.qty)}</div>
                <button className="line__remove" onClick={() => removeLine(key)}>Remove</button>
              </div>
            </div>
          );
        })
      )}
    </Drawer>
  );
}

export function QuickView() {
  const { quickView: p, setQuickView } = useStore();
  const close = () => setQuickView(null);
  useOverlay(!!p, close);
  const off = p ? discountPct(p) : 0;
  return (
    <AnimatePresence>
      {p && (
        <>
          <Scrim onClick={close} />
          <div className="modal">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Quick view: ${p.name}`}
              className="modal__card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease }}
            >
              <button className="icon-btn modal__close" onClick={close} aria-label="Close quick view">
                <X size={20} strokeWidth={1.5} />
              </button>
              <div className="qv">
                <div className="qv__img">
                  <img src={img(p.images[0], 900, 1125)} alt={p.name} />
                </div>
                <div className="qv__body">
                  {off > 0 && <span className="buy__save">Save {off}%</span>}
                  <h2 className="serif" style={{ fontSize: 34, fontWeight: 400, lineHeight: 1.05 }}>{p.name}</h2>
                  <Price p={p} large />
                  {p.reviewCount > 0 && <Stars rating={p.rating} count={p.reviewCount} />}
                  <p className="muted" style={{ fontSize: 14.5 }}>{p.description}</p>
                  <BuyOptions key={p.slug} p={p} compact />
                  <Link to={`/product/${p.slug}`} className="link-u" onClick={close} style={{ justifySelf: 'start' }}>
                    View full details
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useOverlay(open, onClose);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Awaited<ReturnType<typeof api.products>>['items']>([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return setQ('');
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return setResults([]);
    setBusy(true);
    const t = setTimeout(() => {
      api.products({ q: term, limit: 8 }).then(
        (r) => { setResults(r.items); setBusy(false); },
        () => setBusy(false),
      );
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (to: string) => { onClose(); navigate(to); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <Scrim onClick={onClose} />
          <motion.div
            className="search"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.5, ease }}
          >
            <div className="container">
              <form
                className="search__field"
                onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`); }}
              >
                <Search size={24} strokeWidth={1.3} />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search scrunchies, eye masks, combos…" aria-label="Search products" />
                <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search"><X size={22} strokeWidth={1.4} /></button>
              </form>
              {q.trim().length < 2 ? (
                <div style={{ marginTop: 22 }}>
                  <p className="eyebrow muted" style={{ marginBottom: 12 }}>Popular searches</p>
                  <div className="chips">
                    {['Scrunchie', 'Eye mask', 'Pillow', 'Bow', 'Combo', 'Pajama'].map((s) => (
                      <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : results.length ? (
                <div className="search__results">
                  {results.map((p) => (
                    <a key={p.slug} href={`/product/${p.slug}`} onClick={(e) => { e.preventDefault(); go(`/product/${p.slug}`); }}>
                      <img src={img(p.images[0], 300, 400)} alt="" loading="lazy" />
                      <div>{p.name}</div>
                      <div className="muted">{money(p.price)}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 26 }}>{busy ? 'Searching…' : `Nothing matches “${q}”. Try a broader word, like “shirt”.`}</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function MobileMenu({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: CategoryWithCount[] }) {
  const [catsOpen, setCatsOpen] = useState(true);
  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <nav className="mobile-nav" aria-label="Mobile">
        <button onClick={() => setCatsOpen((v) => !v)} aria-expanded={catsOpen}>
          Categories <ChevronRight size={16} style={{ transform: catsOpen ? 'rotate(90deg)' : undefined, transition: 'transform .3s' }} />
        </button>
        {catsOpen && (
          <div className="sub">
            {categories.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} onClick={onClose}>{c.name}</Link>
            ))}
          </div>
        )}
        <Link to="/shop" onClick={onClose}>Shop all</Link>
        <Link to="/shop?sale=1" onClick={onClose}>Sale</Link>
        <Link to="/wishlist" onClick={onClose}>Wishlist</Link>
        <Link to="/about" onClick={onClose}>About us</Link>
        <Link to="/contact" onClick={onClose}>Contact</Link>
      </nav>
      <p className="muted" style={{ fontSize: 12, marginTop: 26 }}>© {new Date().getFullYear()} Style Heaven. All rights reserved.</p>
    </Drawer>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div className="toast" role="status" initial={{ opacity: 0, y: 16, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 10, x: '-50%' }}>
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
