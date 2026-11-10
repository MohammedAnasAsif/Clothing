import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, IMAGES, categories, products } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img } from '../lib/format';
import { greeting, waLink } from '../lib/whatsapp';
import { MessageCircle } from 'lucide-react';
import { FadeUp, Marquee, Rise } from '../components/ui';

export function About() {
  return (
    <>
      <section className="about-hero">
        <div className="about-hero__img"><img src={img(IMAGES.pastels, 1400, 1600)} alt="Pastel satin scrunchies" /></div>
        <div className="about-hero__text">
          <span className="eyebrow muted">About STYLE HEAVEN · {BRAND.location}</span>
          <Rise as="h1" lines={['Little luxuries,', 'every day']} immediate />
          <p>
            STYLE HEAVEN is a satin accessories label from {BRAND.location}. We make scrunchies, sleep sets, pillow
            covers, eye masks, bow clips and gifting sets in a palette of soft colours you can mix and match, and ship
            them across India.
          </p>
          <p>
            Every piece is chosen to feel a little special without being precious. Wear the scrunchie to work, sleep on
            the pillow cover tonight, and gift the combo to someone who deserves softer nights.
          </p>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
            <a className="btn btn--wa btn--sm" href={waLink(greeting())} target="_blank" rel="noreferrer"><MessageCircle size={15} strokeWidth={1.8} /> WhatsApp us</a>
            <a className="link-u" href={BRAND.instagramUrl} target="_blank" rel="noreferrer">Follow @{BRAND.instagram}</a>
          </div>
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
        <p>Questions about an order, colours or a wholesale enquiry? WhatsApp us, email, or send a message below.</p>
      </div>
      <div className="container contact">
        <div className="contact__info">
          <div>
            <h3>WhatsApp</h3>
            <p><a className="btn btn--wa btn--sm" href={waLink(greeting())} target="_blank" rel="noreferrer"><MessageCircle size={15} strokeWidth={1.8} /> Chat on WhatsApp</a></p>
            <p className="muted">Fastest way to order or ask about colours. Number: <span style={{ userSelect: 'all' }}>{BRAND.phone}</span></p>
          </div>
          <div>
            <h3>Email</h3>
            <p style={{ userSelect: 'all' }}>{BRAND.email}</p>
          </div>
          <div>
            <h3>Instagram</h3>
            <p><a className="link-u" href={BRAND.instagramUrl} target="_blank" rel="noreferrer">@{BRAND.instagram}</a></p>
            <p className="muted">You can also order by DM. Send the product name, colour and size.</p>
          </div>
          <div>
            <h3>Location</h3>
            <p>{BRAND.location}. We ship across India.</p>
          </div>
          <div>
            <h3>Wholesale & bulk</h3>
            <p>Boutiques, salons, return gifts and corporate gifting: message us on WhatsApp with quantities and colours, or choose “Wholesale” as the subject below.</p>
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
            <h2>Contact</h2>
            <p>Questions about your data: {BRAND.email}</p>
          </>
        )}
      </div>
    </>
  );
}
