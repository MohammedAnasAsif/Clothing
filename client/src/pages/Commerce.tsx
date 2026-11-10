import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Heart, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Customer, Order } from '../../../shared/types';
import { api, catalogIndex } from '../lib/api';
import { INDIAN_STATES, fmtDate, img, money } from '../lib/format';
import { lineKey, useAsync, useStore } from '../lib/store';
import { ProductCard } from '../components/ProductCard';
import { cartMessage, orderMessage, waLink } from '../lib/whatsapp';
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
      <p className="muted" style={{ fontSize: 12.5 }}>Prices include GST.</p>
    </>
  );
}

export function CartPage() {
  const { cart, setQty, removeLine, subtotal, shipping } = useStore();
  const navigate = useNavigate();
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
          <button className="btn btn--block" onClick={() => navigate('/checkout')}>Checkout</button>
          <a className="btn btn--wa btn--block" href={waLink(cartMessage(cart, subtotal, shipping))} target="_blank" rel="noreferrer">
            <MessageCircle size={17} strokeWidth={1.8} /> Order on WhatsApp
          </a>
          <p className="muted" style={{ fontSize: 12.5 }}>Opens WhatsApp with your order typed out, ready to send.</p>
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

type Errors = Partial<Record<keyof Customer, string>>;

function validate(c: Customer): Errors {
  const e: Errors = {};
  if (c.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(c.email)) e.email = 'Enter a valid email address';
  if (!/^[+\d][\d\s-]{8,15}$/.test(c.phone.trim())) e.phone = 'Enter a valid mobile number';
  if (c.address.trim().length < 6) e.address = 'Enter your house number and street';
  if (c.city.trim().length < 2) e.city = 'Enter your city';
  if (!c.state) e.state = 'Choose your state';
  if (!/^\d{6}$/.test(c.pincode.trim())) e.pincode = 'PIN code must be 6 digits';
  return e;
}

export function CheckoutPage() {
  const { cart, subtotal, shipping, clearCart } = useStore();
  const navigate = useNavigate();
  const [c, setC] = useState<Customer>({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [payment, setPayment] = useState<Order['payment']>('cod');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!cart.length)
    return (
      <>
        <Head title="Checkout" crumb="Checkout" />
        <div className="container empty" style={{ paddingBottom: 120 }}>
          <h2>Your cart is empty</h2>
          <p>Add a few pieces before checking out.</p>
          <Link to="/shop" className="btn">Go to shop</Link>
        </div>
      </>
    );

  const field = (k: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input
        value={c[k]}
        onChange={(e) => setC({ ...c, [k]: e.target.value })}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `${k}-err` : undefined}
        {...props}
      />
      {errors[k] && <span className="field__err" id={`${k}-err`}>{errors[k]}</span>}
    </label>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(c);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    try {
      const order = await api.createOrder(c, payment, cart.map(({ slug, size, color, qty }) => ({ slug, size, color, qty })));
      clearCart();
      navigate(`/order/${order.number}`, { state: { order } });
    } catch (err) {
      setServerError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <>
      <Head title="Checkout" crumb="Checkout" />
      <form className="container two-col" onSubmit={submit} noValidate>
        <div>
          <fieldset className="fieldset">
            <legend>Contact</legend>
            <div className="form-row">
              {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
              {field('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel', placeholder: '+91' })}
            </div>
          </fieldset>
          <fieldset className="fieldset">
            <legend>Delivery address</legend>
            {field('name', 'Full name', { autoComplete: 'name' })}
            {field('address', 'House no., building, street, area', { autoComplete: 'street-address' })}
            <div className="form-row">
              {field('city', 'City', { autoComplete: 'address-level2' })}
              {field('pincode', 'PIN code', { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
            </div>
            <label className="field">
              <span>State</span>
              <select value={c.state} onChange={(e) => setC({ ...c, state: e.target.value })} aria-invalid={!!errors.state}>
                <option value="">Choose a state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <span className="field__err">{errors.state}</span>}
            </label>
          </fieldset>
          <fieldset className="fieldset">
            <legend>Payment</legend>
            <label className="pay-opt">
              <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
              <span><b>Cash on delivery</b><small>Pay in cash or by card when your order arrives.</small></span>
            </label>
            <label className="pay-opt">
              <input type="radio" name="pay" checked={payment === 'upi'} onChange={() => setPayment('upi')} />
              <span><b>UPI on delivery</b><small>Scan and pay with any UPI app at your door.</small></span>
            </label>
          </fieldset>
        </div>
        <aside className="summary" aria-label="Order summary">
          <h2>Your order</h2>
          {cart.map((l) => (
            <div className="line" key={lineKey(l)}>
              <img src={img(l.image, 140, 186)} alt="" />
              <div>
                <div className="line__name">{l.name}</div>
                <div className="line__meta">{l.color} · {l.size} · ×{l.qty}</div>
              </div>
              <div className="line__price">{money(l.price * l.qty)}</div>
            </div>
          ))}
          <Totals subtotal={subtotal} shipping={shipping} />
          {serverError && <p className="notice notice--error" role="alert">{serverError}</p>}
          <button className="btn btn--block" disabled={busy}>{busy ? 'Placing order…' : `Place order · ${money(subtotal + shipping)}`}</button>
        </aside>
      </form>
    </>
  );
}

function OrderView({ order }: { order: Order }) {
  return (
    <div className="confirm">
      <div className="confirm__tick"><Check size={28} strokeWidth={1.4} /></div>
      <p className="eyebrow muted">Order {order.number}</p>
      <h1>Thank you, {order.customer.name.split(' ')[0]}</h1>
      <p className="muted">
        Your order was placed on {fmtDate(order.createdAt)}. We will send updates to {order.customer.email}. Keep your
        order number to track it later.
      </p>
      <div className="box">
        {order.items.map((l) => (
          <div className="line" key={lineKey(l)} style={{ gridTemplateColumns: '60px 1fr auto' }}>
            <img src={img(l.image, 140, 186)} alt="" style={{ width: 60 }} />
            <div>
              <div className="line__name">{l.name}</div>
              <div className="line__meta">{l.color} · {l.size} · ×{l.qty}</div>
            </div>
            <div className="line__price">{money(l.price * l.qty)}</div>
          </div>
        ))}
        <Totals subtotal={order.subtotal} shipping={order.shipping} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, fontSize: 14, marginTop: 6 }}>
          <div>
            <p className="eyebrow muted" style={{ marginBottom: 6 }}>Delivering to</p>
            {order.customer.name}<br />{order.customer.address}<br />{order.customer.city}, {order.customer.state} {order.customer.pincode}
          </div>
          <div>
            <p className="eyebrow muted" style={{ marginBottom: 6 }}>Payment</p>
            {order.payment === 'cod' ? 'Cash on delivery' : 'UPI on delivery'}
            <p className="eyebrow muted" style={{ margin: '14px 0 6px' }}>Status</p>
            <span style={{ textTransform: 'capitalize' }}>{order.status}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
        <a className="btn btn--wa" href={waLink(orderMessage(order))} target="_blank" rel="noreferrer">
          <MessageCircle size={17} strokeWidth={1.8} /> Confirm on WhatsApp
        </a>
        <Link to="/shop" className="btn btn--ghost">Continue shopping</Link>
      </div>
    </div>
  );
}

export function OrderPage() {
  const { number = '' } = useParams();
  const state = useLocation().state as { order?: Order } | null;
  if (state?.order && state.order.number === number) return <div className="container"><OrderView order={state.order} /></div>;
  return <TrackPage initialNumber={number} />;
}

export function TrackPage({ initialNumber = '' }: { initialNumber?: string }) {
  const [params] = useSearchParams();
  const [number, setNumber] = useState(initialNumber || params.get('number') || '');
  const [email, setEmail] = useState('');
  const [lookup, setLookup] = useState<{ number: string; email: string } | null>(null);
  const { data, error, loading } = useAsync(
    () => (lookup ? api.order(lookup.number, lookup.email) : Promise.resolve(null)),
    [lookup?.number, lookup?.email],
  );
  if (data) return <div className="container"><OrderView order={data} /></div>;
  return (
    <>
      <Head title="Track an order" crumb="Track order" />
      <form
        className="container form"
        style={{ maxWidth: 560, paddingBottom: 120, marginInline: 0 }}
        onSubmit={(e) => { e.preventDefault(); setLookup({ number: number.trim(), email: email.trim() }); }}
      >
        <p className="muted">Enter your order number and the email you used at checkout.</p>
        <label className="field"><span>Order number</span><input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="SH-261110-1234" /></label>
        <label className="field"><span>Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {error && <p className="notice notice--error" role="alert">{error.message}</p>}
        <button className="btn" style={{ justifySelf: 'start' }} disabled={loading && !!lookup}>Find my order</button>
      </form>
    </>
  );
}
