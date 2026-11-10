import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AtSign, Star, Truck, Wallet, X } from 'lucide-react';
import { BRAND, categories } from '../../../shared/catalog';
import type { Review } from '../../../shared/types';
import { discountPct } from '../../../shared/query';
import { api } from '../lib/api';
import { fmtDate, img, srcSet } from '../lib/format';
import { useAsync } from '../lib/store';
import { BuyOptions } from '../components/BuyOptions';
import { ProductCard } from '../components/ProductCard';
import { Price, Stars } from '../components/ui';
import NotFound from './NotFound';

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => setI(0), [images]);
  return (
    <div className="gallery">
      <div className="gallery__thumbs" role="tablist" aria-label="Product images">
        {images.map((id, n) => (
          <button key={id + n} role="tab" aria-current={n === i} aria-label={`Image ${n + 1}`} onClick={() => setI(n)}>
            <img src={img(id, 160, 213)} alt="" />
          </button>
        ))}
      </div>
      <div
        className={`gallery__main${zoom ? ' is-zoom' : ''}`}
        onMouseMove={(e) => {
          if (!zoom) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onClick={(e) => {
          if (zoom) return setZoom(null);
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={images[i]}
            src={img(images[i], 1200, 1500)}
            srcSet={srcSet(images[i], [600, 900, 1300, 1600], 1.25)}
            sizes="(max-width: 960px) 100vw, 52vw"
            alt={`${name}, image ${i + 1} of ${images.length}`}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

const GUIDES: Record<string, { note: string; head: string[]; rows: string[][] }> = {
  scrunchies: {
    note: 'Approximate diameter when relaxed.',
    head: ['Size', 'Diameter', 'Best for'],
    rows: [['Mini', '2.5 in', 'Fine hair, braids, half-ups'], ['Regular', '3.5 in', 'Everyday ponytails and buns'], ['XL', '5 in', 'Thick hair and a fuller look']],
  },
  'eye-masks': {
    note: 'Approximate mask size, band not included.',
    head: ['Size', 'Width × height', 'Best for'],
    rows: [['Regular', '8 × 3.5 in', 'Most faces'], ['Large', '9 × 4 in', 'More coverage and blackout']],
  },
  'pillow-covers': {
    note: 'Choose the size of your pillow.',
    head: ['Size', 'Fits pillow', ''],
    rows: [['Standard', '18 × 28 in', ''], ['Queen', '20 × 30 in', ''], ['King', '20 × 36 in', '']],
  },
  'gift-sets': {
    note: 'The size refers to the pillow cover in the set.',
    head: ['Size', 'Fits pillow', ''],
    rows: [['Standard', '18 × 28 in', ''], ['Queen', '20 × 30 in', '']],
  },
  pajamas: {
    note: 'Body measurements in inches. Between sizes? Size up for a relaxed fit.',
    head: ['Size', 'Bust', 'Waist'],
    rows: [['S', '34', '28'], ['M', '36', '30'], ['L', '38', '32'], ['XL', '40', '34']],
  },
};

function SizeGuide({ open, onClose, category }: { open: boolean; onClose: () => void; category: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  const guide = GUIDES[category];
  if (!guide) return null;
  const cols = guide.head.filter(Boolean).length;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <div className="modal">
            <motion.div className="modal__card" role="dialog" aria-modal="true" aria-label="Size guide" style={{ width: 'min(620px, 100%)', padding: 32 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button className="icon-btn modal__close" onClick={onClose} aria-label="Close size guide"><X size={20} strokeWidth={1.5} /></button>
              <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 6 }}>Size guide</h2>
              <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>{guide.note}</p>
              <table className="table">
                <thead><tr>{guide.head.slice(0, cols).map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{guide.rows.map((r) => <tr key={r[0]}>{r.slice(0, cols).map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
              </table>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ReviewForm({ slug, onAdded }: { slug: string; onAdded: (r: Review) => void }) {
  const [form, setForm] = useState({ name: '', title: '', body: '', rating: 0 });
  const [state, setState] = useState<{ busy?: boolean; error?: string; ok?: boolean }>({});
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.rating) return setState({ error: 'Please choose a star rating.' });
    if (form.body.trim().length < 10) return setState({ error: 'Tell us a little more — at least 10 characters.' });
    setState({ busy: true });
    try {
      const r = await api.addReview(slug, form);
      onAdded(r);
      setForm({ name: '', title: '', body: '', rating: 0 });
      setState({ ok: true });
    } catch (err) {
      setState({ error: (err as Error).message });
    }
  };
  return (
    <form className="form" onSubmit={submit} style={{ marginTop: 36 }}>
      <h3 className="serif" style={{ fontSize: 26, fontWeight: 400 }}>Write a review</h3>
      <div className="field">
        <span id="rating-label">Your rating</span>
        <div className="rating-input" role="radiogroup" aria-labelledby="rating-label">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} className={n <= form.rating ? 'on' : ''} onClick={() => setForm({ ...form, rating: n })}>
              <Star size={24} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label className="field"><span>Name</span><input required minLength={2} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="field"><span>Review title</span><input required minLength={2} maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      </div>
      <label className="field"><span>Your review</span><textarea required maxLength={1000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
      {state.error && <p className="notice notice--error" role="alert">{state.error}</p>}
      {state.ok && <p className="notice notice--ok" role="status">Thank you — your review is live.</p>}
      <button className="btn" style={{ justifySelf: 'start' }} disabled={state.busy}>{state.busy ? 'Posting…' : 'Post review'}</button>
    </form>
  );
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { data, error, loading } = useAsync(() => api.product(slug), [slug]);
  const [tab, setTab] = useState<'details' | 'reviews'>('details');
  const [guide, setGuide] = useState(false);
  const [extra, setExtra] = useState<Review[]>([]);
  useEffect(() => { setExtra([]); setTab('details'); }, [slug]);
  useEffect(() => {
    if (data) document.title = `${data.product.name} — Style Heaven`;
    return () => { document.title = 'Style Heaven — Satin Scrunchies, Eye Masks & Pillow Covers'; };
  }, [data]);

  if (error && (error as { status?: number }).status === 404) return <NotFound />;
  if (error) return <div className="container" style={{ padding: '80px 0' }}><div className="notice notice--error">{error.message}</div></div>;
  if (loading || !data) {
    return (
      <div className="container pdp" style={{ paddingTop: 40 }} aria-busy="true">
        <div className="skeleton" style={{ aspectRatio: '4/5' }} />
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {[60, 80, 30, 90, 50].map((w, i) => <div key={i} className="skeleton" style={{ height: i === 1 ? 44 : 16, width: `${w}%` }} />)}
        </div>
      </div>
    );
  }

  const { product: p, related } = data;
  const reviews = [...extra, ...data.reviews];
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const off = discountPct(p);
  const catName = categories.find((c) => c.slug === p.category)?.name ?? p.category;

  return (
    <>
      <div className="container" style={{ padding: '22px var(--gutter) 26px' }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to={`/category/${p.category}`}>{catName}</Link> / <span>{p.name}</span>
        </nav>
      </div>
      <div className="container pdp">
        <Gallery images={p.images} name={p.name} />
        <div className="buy">
          <div style={{ display: 'grid', gap: 12 }}>
            {(p.badge || off > 0) && (
              <div style={{ display: 'flex', gap: 12 }}>
                {p.badge && <span className="eyebrow">{p.badge}</span>}
                {off > 0 && <span className="buy__save">Save {off}%</span>}
              </div>
            )}
            <h1>{p.name}</h1>
            <button className="link-u" style={{ justifySelf: 'start', paddingBottom: 2, fontSize: 12.5 }} onClick={() => { setTab('reviews'); document.getElementById('ptabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {count ? <Stars rating={Math.round(avg * 10) / 10} count={count} /> : 'No reviews yet. Write the first one'}
            </button>
            <Price p={p} large />
            <span className="muted" style={{ fontSize: 12.5 }}>Inclusive of all taxes</span>
          </div>
          <p className="buy__desc">{p.description}</p>
          <BuyOptions key={p.slug} p={p} onSizeGuide={GUIDES[p.category] && p.sizes.length > 1 ? () => setGuide(true) : undefined} />
          <span className={`buy__stock${p.stock < 12 ? ' is-low' : ''}`}>
            {p.stock === 0 ? 'Out of stock' : p.stock < 12 ? `Only ${p.stock} left — order soon` : 'In stock, ready to ship'}
          </span>
          <div className="perks">
            <div><Truck size={18} strokeWidth={1.4} /> Free shipping on orders over ₹999</div>
            <div><Wallet size={18} strokeWidth={1.4} /> Cash on delivery and UPI available</div>
            <div>
              <AtSign size={18} strokeWidth={1.4} />
              <span>
                Prefer Instagram? <a className="link-u" href={BRAND.instagramUrl} target="_blank" rel="noreferrer">DM @{BRAND.instagram}</a> with “{p.name}”
              </span>
            </div>
          </div>
          <div className="meta">
            <span>SKU: <b>{p.sku}</b></span>
            <span>Category: <Link to={`/category/${p.category}`}><b>{catName}</b></Link></span>
            <span>Fabric: <b>{p.fabric}</b></span>
          </div>
        </div>
      </div>

      <section className="container ptabs" id="ptabs">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'details'} onClick={() => setTab('details')}>Description</button>
          <button role="tab" aria-selected={tab === 'reviews'} onClick={() => setTab('reviews')}>Reviews ({count})</button>
        </div>
        <div className="ptab-panel" role="tabpanel">
          {tab === 'details' ? (
            <div className="details-grid">
              <div style={{ display: 'grid', gap: 16 }}>
                <h3 className="serif" style={{ fontSize: 28, fontWeight: 400 }}>About this piece</h3>
                <p style={{ color: 'var(--ink-2)' }}>{p.description}</p>
                <p className="muted" style={{ fontSize: 14 }}><b style={{ color: "var(--ink)" }}>Size & fit:</b> {p.fit}. <b style={{ color: 'var(--ink)' }}>Fabric:</b> {p.fabric}.</p>
              </div>
              <ul>
                {p.details.map((d) => <li key={d}>{d}</li>)}
                <li>Care: hand wash or gentle cycle cold, dry in shade</li>
              </ul>
            </div>
          ) : (
            <div className="reviews">
              <div className="reviews__summary">
                <div className="reviews__score">{avg.toFixed(1)}</div>
                <Stars rating={avg} size={16} />
                <span className="muted" style={{ fontSize: 13 }}>Based on {count} reviews</span>
                <div className="bars">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = reviews.filter((r) => r.rating === n).length;
                    return (
                      <div key={n}>
                        <span>{n}★</span>
                        <i><span style={{ width: `${count ? (c / count) * 100 : 0}%` }} /></i>
                        <span className="muted">{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                {reviews.length === 0 && <p className="muted">No reviews yet. Be the first to share how it fits.</p>}
                {reviews.map((r) => (
                  <article className="review" key={r.id}>
                    <Stars rating={r.rating} size={12} />
                    <h4>{r.title}</h4>
                    <p>{r.body}</p>
                    <small>{r.name} · {fmtDate(r.createdAt)} · Verified buyer</small>
                  </article>
                ))}
                <ReviewForm slug={p.slug} onAdded={(r) => setExtra((x) => [r, ...x])} />
              </div>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="section container" aria-labelledby="related-title">
          <div className="section-head"><h2 id="related-title">You may also like</h2><Link to={`/category/${p.category}`} className="link-u">View all</Link></div>
          <div className="grid grid--4">
            {related.map((r) => <ProductCard key={r.slug} p={r} />)}
          </div>
        </section>
      )}
      <SizeGuide open={guide} onClose={() => setGuide(false)} category={p.category} />
    </>
  );
}
