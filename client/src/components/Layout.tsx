import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Heart, Menu, MessageCircle, Search, ShoppingBag } from 'lucide-react';
import { BRAND } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img } from '../lib/format';
import { useAsync, useStore } from '../lib/store';
import { greeting, waLink } from '../lib/whatsapp';
import { CartDrawer, MobileMenu, QuickView, SearchOverlay, Toast } from './Overlays';

const MESSAGES = [
  'Free shipping over ₹999',
  'Gifting sets from ₹799',
  'Order on WhatsApp · 80562 21231',
];

function Announcement() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % MESSAGES.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="announce" role="region" aria-label="Announcements">
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          className="announce__track"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -18, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {MESSAGES[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Header() {
  const { cartCount, wishlist, setCartOpen } = useStore();
  const { data: categories } = useAsync(() => api.categories(), []);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMegaOpen(false), [location]);

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container header__inner">
          <nav className="header__nav" aria-label="Primary">
            <div onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
              <button aria-expanded={megaOpen} aria-haspopup="true" onClick={() => setMegaOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 'inherit', textTransform: 'inherit', fontWeight: 'inherit' }}>
                Categories <ChevronDown size={13} style={{ transform: megaOpen ? 'rotate(180deg)' : undefined, transition: 'transform .3s' }} />
              </button>
              <AnimatePresence>
                {megaOpen && categories && (
                  <motion.div
                    className="mega"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {categories.map((c) => (
                      <Link key={c.slug} to={`/category/${c.slug}`}>
                        <figure><img src={img(c.image, 360, 480)} alt="" loading="lazy" /></figure>
                        <strong>{c.name}</strong>
                        <span>{c.count} styles</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/category/sleep-sets">Sleep Sets</NavLink>
            <NavLink to="/category/gifting-sets">Gifting Sets</NavLink>
            <NavLink to="/shop?sale=1" className={() => (location.search.includes('sale=1') ? 'active' : '')}>Sale</NavLink>
          </nav>

          <button className="icon-btn header__burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={21} strokeWidth={1.5} />
          </button>

          <Link to="/" className="logo" aria-label="STYLE HEAVEN home">
            STYLE HEAVEN
          </Link>

          <div className="header__actions">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={19} strokeWidth={1.5} />
            </button>
            <Link to="/wishlist" className="icon-btn hide-sm" aria-label={`Wishlist, ${wishlist.length} items`}>
              <Heart size={19} strokeWidth={1.5} />
              <span className="count-dot">{wishlist.length}</span>
            </Link>
            <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag size={19} strokeWidth={1.5} />
              <span className="count-dot">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories ?? []} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'ok' | 'error'; msg?: string }>({ kind: 'idle' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState({ kind: 'busy' });
    try {
      const r = await api.subscribe(email);
      setState({ kind: 'ok', msg: r.message });
      setEmail('');
    } catch (err) {
      setState({ kind: 'error', msg: (err as Error).message });
    }
  };
  return (
    <div className="footer__news">
      <h4>Join the STYLE HEAVEN list</h4>
      <p>Hear first about new colours, restocks and combo offers.</p>
      <form onSubmit={submit} noValidate>
        <label className="sr-only" htmlFor="news-email">Email address</label>
        <input id="news-email" type="email" required placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn--light" style={{ justifySelf: 'start' }} disabled={state.kind === 'busy'}>
          {state.kind === 'busy' ? 'Subscribing…' : 'Subscribe'}
        </button>
        <p className="fine" role="status" style={state.kind === 'ok' ? { color: '#bfe3c9' } : state.kind === 'error' ? { color: '#f0b4aa' } : undefined}>
          {state.msg ?? (
            <>By signing up you accept our <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.</>
          )}
        </p>
      </form>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">Shop all</Link></li>
              <li><Link to="/category/scrunchies">Scrunchies</Link></li>
              <li><Link to="/category/sleep-sets">Sleep Sets</Link></li>
              <li><Link to="/category/pillow-covers">Pillow Covers</Link></li>
              <li><Link to="/category/eye-masks">Eye Masks</Link></li>
              <li><Link to="/category/bow-clips">Bow Clips</Link></li>
              <li><Link to="/category/gifting-sets">Gifting Sets</Link></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><a href={waLink('Hi STYLE HEAVEN! I would like an update on my order.')} target="_blank" rel="noreferrer">Order updates on WhatsApp</a></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/cart">Your cart</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4>STYLE HEAVEN</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/contact">Contact & wholesale</Link></li>
              <li><a href={waLink(greeting())} target="_blank" rel="noreferrer">WhatsApp {BRAND.phone}</a></li>
              <li><a href={BRAND.instagramUrl} target="_blank" rel="noreferrer">Instagram @{BRAND.instagram}</a></li>
              <li><span className="footer__plain">{BRAND.email}</span></li>
              <li><span className="footer__plain">{BRAND.location}</span></li>
            </ul>
          </div>
          <Newsletter />
        </div>
        <div className="footer__bar">
          <span>© {new Date().getFullYear()} STYLE HEAVEN · {BRAND.location} · All rights reserved</span>
          <div className="pay" aria-label="Payment methods">
            <span>UPI</span><span>Cash on delivery</span>
          </div>
        </div>
      </div>
      <div className="footer__mark" aria-hidden>STYLE HEAVEN</div>
    </footer>
  );
}

function WhatsAppFab() {
  return (
    <a className="wa-fab" href={waLink(greeting())} target="_blank" rel="noreferrer" aria-label="Chat with STYLE HEAVEN on WhatsApp">
      <MessageCircle size={24} strokeWidth={1.8} />
      <span>Chat on WhatsApp</span>
    </a>
  );
}

export function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Announcement />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
      <QuickView />
      <Toast />
      <ScrollRestoration />
    </>
  );
}
