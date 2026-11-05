import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img } from '../lib/format';
import { FadeUp, Marquee, Rise } from '../components/ui';

export function About() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero__img"><img src={img(IMAGES.studio, 1400, 1600)} alt="Garments hanging in the ST CLOTHINGS store" /></div>
        <div className="about-hero__text">
          <span className="eyebrow muted">About ST CLOTHINGS</span>
          <Rise as="h1" lines={['Fewer pieces,', 'better made']} immediate />
          <p>
            ST CLOTHINGS started with a simple frustration: everyday clothes that looked tired after a handful of
            washes. So we began with the basics everyone owns — the tee, the shirt, the hoodie — and made them heavier,
            cleaner and more carefully cut.
          </p>
          <p>
            Our ladies wear follows the same rule. Fabrics that fall properly, shapes drawn for real days, and finishing
            you notice the longer you wear it.
          </p>
        </div>
      </section>
      <section className="section container">
        <div className="values">
          {[
            ['Honest cloth', 'Dense cotton jersey, two-ply poplin, brushed fleece and real linen. We tell you the weight and the blend, every time.'],
            ['Considered cuts', 'Every pattern is fitted on real bodies across sizes, then refined until shoulders, collars and hems sit right.'],
            ['Made to last', 'Taped seams, tight ribbing and pre-shrunk fabrics, so the piece you buy is the piece you keep.'],
          ].map(([h, p], i) => (
            <FadeUp key={h} delay={i * 0.1}><div><h3>{h}</h3><p>{p}</p></div></FadeUp>
          ))}
        </div>
      </section>
      <section className="section--tight container" style={{ background: 'var(--bone)', paddingInline: 'var(--gutter)', maxWidth: 'none' }}>
        <div className="stats container">
          {[['34', 'Signature styles'], ['4', 'Collections'], ['7-day', 'Easy returns'], ['₹1,999', 'Free shipping from']].map(([b, s]) => (
            <div key={s}><b>{b}</b><span>{s}</span></div>
          ))}
        </div>
      </section>
      <Marquee text="Built to stay" plain />
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
        <p>Questions about sizing, an order, or a bulk enquiry? We reply within one working day.</p>
      </div>
      <div className="container contact">
        <div className="contact__info">
          <div><h3>Customer care</h3><p>hello@stclothings.in</p><p className="muted">Mon – Sat, 10am – 7pm IST</p></div>
          <div><h3>Orders & returns</h3><p>Track an order any time on the <Link to="/track" className="link-u">order tracking page</Link>. Returns are free within 7 days of delivery.</p></div>
          <div><h3>Wholesale</h3><p>For corporate and bulk orders, choose “Wholesale” as the subject and tell us what you need.</p></div>
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
            <p>All prices are in Indian Rupees and include GST. Shipping is free on orders of ₹1,999 or more; a ₹99 fee applies below that.</p>
            <h2>Returns & exchanges</h2>
            <p>Unworn items with tags attached can be returned or exchanged within 7 days of delivery. Refunds for cash-on-delivery orders are made to your bank account or UPI ID.</p>
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
