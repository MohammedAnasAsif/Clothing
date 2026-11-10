import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, IMAGES, categories, products } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img } from '../lib/format';
import { FadeUp, Marquee, Rise } from '../components/ui';

export function About() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero__img"><img src={img(IMAGES.pastels, 1400, 1600)} alt="Pastel satin scrunchies" /></div>
        <div className="about-hero__text">
          <span className="eyebrow muted">About Style Heaven</span>
          <Rise as="h1" lines={['Little luxuries,', 'every day']} immediate />
          <p>
            Style Heaven makes satin accessories for hair and sleep: scrunchies, eye masks, pillow covers, bows and
            pajamas, in a palette of soft colours you can mix and match.
          </p>
          <p>
            Every piece is chosen to feel a little special without being precious. Wear the scrunchie to work, sleep on
            the pillow cover tonight, and gift the combo to someone who deserves softer nights.
          </p>
          <a className="link-u" href={BRAND.instagramUrl} target="_blank" rel="noreferrer" style={{ alignSelf: 'start' }}>
            Follow @{BRAND.instagram} on Instagram
          </a>
        </div>
      </section>
      <section className="section container">
        <div className="values">
          {[
            ['Smooth satin', 'Every piece is cut from soft satin that glides over hair and skin instead of gripping it.'],
            ['Colours that match', 'Scrunchies, masks and pillow covers come in the same colour stories, so a set always matches.'],
            ['Made to gift', 'Combos and gift boxes arrive ready to give, and we take bulk and wholesale orders too.'],
          ].map(([h, p], i) => (
            <FadeUp key={h} delay={i * 0.1}><div><h3>{h}</h3><p>{p}</p></div></FadeUp>
          ))}
        </div>
      </section>
      <section className="section--tight container" style={{ background: 'var(--bone)', paddingInline: 'var(--gutter)', maxWidth: 'none' }}>
        <div className="stats container">
          {[[String(products.length), 'Styles'], [String(categories.length), 'Collections'], ['COD', 'Cash on delivery'], ['₹999', 'Free shipping from']].map(([b, s]) => (
            <div key={s}><b>{b}</b><span>{s}</span></div>
          ))}
        </div>
      </section>
      <Marquee text="Sleep pretty · Wake up smooth" plain />
      <div className="container" style={{ textAlign: 'center', paddingBottom: 110 }}>
        <Link to="/shop" className="btn">Shop the collection</Link>
      </div>
    </>
  );
}

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState<{ busy?: boolean; ok?: string; error?: string }>({});
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    try {
      const r = await api.contact(form);
      setState({ ok: r.message });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setState({ error: (err as Error).message });
    }
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  return (
    <>
      <div className="container page-head">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>Contact</span></nav>
        <Rise as="h1" lines={['Get in touch']} immediate />
        <p>Questions about an order, colours or a wholesale enquiry? Message us on Instagram or give us a call.</p>
      </div>
      <div className="container contact">
        <div className="contact__info">
          <div>
            <h3>Instagram</h3>
            <p><a className="link-u" href={BRAND.instagramUrl} target="_blank" rel="noreferrer">@{BRAND.instagram}</a></p>
            <p className="muted">You can place orders by DM too. Send us the product name, colour and size.</p>
          </div>
          <div>
            <h3>Phone</h3>
            <p style={{ userSelect: 'all' }}>{BRAND.phone}</p>
          </div>
          <div>
            <h3>Wholesale & bulk</h3>
            <p>Boutiques, salons, return gifts and corporate gifting: choose “Wholesale” as the subject below, or DM us with quantities and colours.</p>
          </div>
          <div>
            <h3>Orders</h3>
            <p>Track an order on the <Link to="/track" className="link-u">order tracking page</Link>.</p>
          </div>
        </div>
        <form className="form" onSubmit={submit}>
          <div className="form-row">
            <label className="field"><span>Name</span><input required minLength={2} value={form.name} onChange={set('name')} autoComplete="name" /></label>
            <label className="field"><span>Email</span><input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
          </div>
          <label className="field"><span>Subject</span><input required minLength={2} value={form.subject} onChange={set('subject')} /></label>
          <label className="field"><span>Message</span><textarea required minLength={10} value={form.message} onChange={set('message')} /></label>
          {state.ok && <p className="notice notice--ok" role="status">{state.ok}</p>}
          {state.error && <p className="notice notice--error" role="alert">{state.error}</p>}
          <button className="btn" style={{ justifySelf: 'start' }} disabled={state.busy}>{state.busy ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </>
  );
}

export function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const terms = kind === 'terms';
  return (
    <>
      <div className="container page-head">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span>{terms ? 'Terms & Conditions' : 'Privacy Policy'}</span></nav>
        <h1>{terms ? 'Terms & Conditions' : 'Privacy Policy'}</h1>
        <p>Placeholder text — replace with your reviewed legal copy before launch.</p>
      </div>
      <div className="container prose">
        {terms ? (
          <>
            <h2>Orders</h2>
            <p>An order is confirmed once you receive an order number. We may cancel an order if an item becomes unavailable, in which case you will not be charged.</p>
            <h2>Pricing</h2>
            <p>All prices are in Indian Rupees. Shipping is free on orders of ₹999 or more; a ₹60 fee applies below that.</p>
            <h2>Returns & exchanges</h2>
            <p>Add Style Heaven's returns and exchange policy here. Hair accessories are often non-returnable for hygiene reasons, so say clearly what can and cannot be returned.</p>
          </>
        ) : (
          <>
            <h2>What we collect</h2>
            <p>When you order, we collect your name, contact details and delivery address so we can fulfil it. If you subscribe, we store your email address.</p>
            <h2>How we use it</h2>
            <p>Only to process orders, answer messages and, if you opted in, send our newsletter. We never sell your data.</p>
            <h2>Your cart and wishlist</h2>
            <p>Your cart and wishlist are stored in your own browser so they persist between visits. Clearing your site data removes them.</p>
          </>
        )}
      </div>
    </>
  );
}
