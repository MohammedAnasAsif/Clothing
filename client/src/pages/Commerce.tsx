import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { catalogIndex } from '../lib/api';
import { img, money } from '../lib/format';
import { lineKey, useStore } from '../lib/store';
import { ProductCard } from '../components/ProductCard';
import { cartMessage, waLink } from '../lib/whatsapp';
import { ShippingBar } from '../components/Overlays';

function Head({ title, crumb }: { title: string; crumb: string }) {
  return (
    <div className="container page-head">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>{crumb}</span></nav>
      <h1>{title}</h1>
    </div>
  );
}

function Totals({ subtotal, shipping }: { subtotal: number; shipping: number }) {
  return (
    <>
      <div className="summary__row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="summary__row"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div>
      <div className="summary__row summary__row--total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
      <p className="muted" style={{ fontSize: 12.5 }}>Prices include GST. Cash on delivery and UPI available.</p>
    </>
  );
}

export function CartPage() {
  const { cart, setQty, removeLine, subtotal, shipping } = useStore();
  if (!cart.length)
    return (
      <>
        <Head title="Your cart" crumb="Cart" />
        <div className="container empty" style={{ paddingBottom: 120 }}>
          <ShoppingBag size={40} strokeWidth={1} />
          <h2>Your cart is empty</h2>
          <p>Nothing here yet. A satin scrunchie or a colour combo is a good place to start.</p>
          <Link to="/shop" className="btn">Continue shopping</Link>
        </div>
      </>
    );
  return (
    <>
      <Head title="Your cart" crumb="Cart" />
      <div className="container two-col">
        <div>
          <ShippingBar subtotal={subtotal} />
          <div style={{ marginTop: 12 }}>
            {cart.map((l) => {
              const key = lineKey(l);
              return (
                <div className="line" key={key} style={{ gridTemplateColumns: '110px 1fr auto' }}>
                  <Link to={`/product/${l.slug}`}><img src={img(l.image, 240, 320)} alt="" style={{ width: 110 }} /></Link>
                  <div>
                    <Link to={`/product/${l.slug}`} className="line__name" style={{ fontSize: 16 }}>{l.name}</Link>
                    <div className="line__meta">Colour: {l.color} · Size: {l.size}</div>
                    <div className="line__meta">{money(l.price)} each</div>
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
            })}
          </div>
          <Link to="/shop" className="link-u" style={{ marginTop: 24 }}>Continue shopping</Link>
        </div>
        <aside className="summary" aria-label="Order summary">
          <h2>Summary</h2>
          <Totals subtotal={subtotal} shipping={shipping} />
          <a className="btn btn--wa btn--block" href={waLink(cartMessage(cart, subtotal, shipping))} target="_blank" rel="noreferrer">
            <MessageCircle size={17} strokeWidth={1.8} /> Order on WhatsApp
          </a>
          <p className="muted" style={{ fontSize: 12.5 }}>Opens WhatsApp with your order typed out. Add your name, address and PIN code, press send, and we will confirm the total and payment.</p>
        </aside>
      </div>
    </>
  );
}

export function WishlistPage() {
  const { wishlist } = useStore();
  const items = wishlist.map((s) => catalogIndex.get(s)).filter(Boolean);
  return (
    <>
      <Head title="Wishlist" crumb="Wishlist" />
      <div className="container" style={{ paddingBottom: 110 }}>
        {items.length === 0 ? (
          <div className="empty">
            <Heart size={40} strokeWidth={1} />
            <h2>Nothing saved yet</h2>
            <p>Tap the heart on any piece to keep it here. Your wishlist stays on this device between visits.</p>
            <Link to="/shop" className="btn">Find something you love</Link>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {items.map((p) => <ProductCard key={p!.slug} p={p!} />)}
          </div>
        )}
      </div>
    </>
  );
}
