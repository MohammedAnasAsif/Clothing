import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { IMAGES } from '../../../shared/catalog';
import { api } from '../lib/api';
import { img, srcSet } from '../lib/format';
import { useAsync } from '../lib/store';
import { ProductRail } from '../components/ProductRail';
import { FadeUp, Marquee, Rise } from '../components/ui';

const ease = [0.22, 1, 0.36, 1] as const;

function Hero() {
  return (
    <section className="hero" aria-label="New season">
      <div className="hero__media">
        <img
          src={img(IMAGES.hero, 1800)}
          srcSet={srcSet(IMAGES.hero, [800, 1200, 1800, 2400])}
          sizes="100vw"
          alt="A rail of neutral-toned garments in the ST CLOTHINGS studio"
          fetchPriority="high"
        />
      </div>
      <div className="hero__content">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
          Just in for the season
        </motion.p>
        <Rise as="h1" className="hero__title" lines={['ST CLOTHINGS']} immediate delay={0.15} />
        <motion.p className="hero__copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1, ease }}>
          Everyday clothing made properly. Honest fabric, considered proportions, and a finish that keeps its shape
          wash after wash.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1, ease }}>
          <Link to="/shop" className="btn btn--light">Shop the edit</Link>
        </motion.div>
      </div>
    </section>
  );
}

function Split() {
  const items = [
    { to: '/shop?gender=women', title: 'WOMEN', copy: 'Soft lines, sure shapes, and pieces drawn for the way you actually dress.', image: IMAGES.women },
    { to: '/shop?gender=men', title: 'MEN', copy: 'Clean cuts, easy confidence, and hard-wearing basics built for every day.', image: IMAGES.men },
  ];
  return (
    <section className="split" aria-label="Shop by department">
      {items.map((it, i) => (
        <Link key={it.title} to={it.to} className="split__item">
          <motion.img
            src={img(it.image, 1100, 1375)}
            srcSet={srcSet(it.image, [600, 900, 1300], 1.25)}
            sizes="(max-width: 760px) 100vw, 50vw"
            alt=""
            loading="lazy"
            initial={{ scale: 1.12 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, ease, delay: i * 0.1 }}
          />
          <div className="split__label">
            <Rise as="h3" lines={[it.title]} />
            <FadeUp delay={0.2}><p>{it.copy}</p></FadeUp>
          </div>
        </Link>
      ))}
    </section>
  );
}

function Word({ children, progress, range }: { children: React.ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span className="w" style={{ opacity }}>{children}</motion.span>;
}

/** Statement whose words light up as you scroll through it, with small image pills set into the line. */
function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] });
  const tokens: Array<string | { pill: string }> = [
    'Elevate', 'your', 'style', { pill: '1554568218-0f1715e72254' }, 'with', 'pieces', 'made', 'to', 'be', 'worn', '—',
    { pill: '1556821840-3a63f95609a7' }, 'season', 'after', 'season,', 'year', 'after', { pill: '1618932260643-eee4a2f652a6' }, 'year.',
  ];
  return (
    <section className="statement container" aria-label="Our approach">
      <p ref={ref}>
        {tokens.map((t, i) => {
          const range: [number, number] = [i / tokens.length, Math.min(1, (i + 2) / tokens.length)];
          if (typeof t === 'string')
            return (
              <Word key={i} progress={scrollYProgress} range={range}>
                {t === 'style' || t === 'year.' ? <em>{t}</em> : t}
              </Word>
            );
          return (
            <Word key={i} progress={scrollYProgress} range={range}>
              <span className="pill" style={{ margin: 0 }}><img src={img(t.pill, 200, 100)} alt="" loading="lazy" /></span>
            </Word>
          );
        })}
      </p>
    </section>
  );
}

/** Editorial band that assembles from vertical slices when it scrolls into view. */
function SliceBanner() {
  const n = 6;
  const url = img(IMAGES.store, 2000);
  return (
    <section className="slice-banner" aria-label="The edit">
      <div className="slices" style={{ ['--n' as string]: n }} aria-hidden>
        {Array.from({ length: n }, (_, i) => (
          <div key={i}>
            <motion.div
              style={{ left: `${-i * 100}%`, backgroundImage: `url(${url})` }}
              initial={{ y: i % 2 ? '100%' : '-100%' }}
              whileInView={{ y: '0%' }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 1.3, ease, delay: 0.06 * i }}
            />
          </div>
        ))}
      </div>
      <div className="slice-banner__content">
        <div className="container">
          <div className="inner">
            <FadeUp><span className="eyebrow">The edit</span></FadeUp>
            <Rise lines={['Looks Worth', 'Keeping']} delay={0.3} />
            <FadeUp delay={0.5}><p>Dressing that feels like yours. Considered design, honest cloth and shapes made to last longer than a trend.</p></FadeUp>
            <FadeUp delay={0.6}><Link to="/shop?sort=rating" className="link-u">See the edit</Link></FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}

function Story({ index, slug, title, copy, image, label }: { index: number; slug: string; title: string[]; copy: string; image: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  const { data } = useAsync(() => api.products({ category: slug, limit: 3, sort: 'rating' }), [slug]);
  return (
    <article className="story">
      <div className="story__media" ref={ref}>
        <motion.img style={{ y }} src={img(image, 1100, 1375)} srcSet={srcSet(image, [600, 900, 1300], 1.25)} sizes="(max-width: 860px) 100vw, 52vw" alt="" loading="lazy" />
      </div>
      <div className="story__body">
        <FadeUp><span className="story__num">{String(index + 1).padStart(2, '0')} — {label}</span></FadeUp>
        <Rise as="h3" lines={title} />
        <FadeUp delay={0.15}><p>{copy}</p></FadeUp>
        {data && (
          <FadeUp delay={0.2}>
            <div className="story__thumbs">
              {data.items.map((p) => (
                <Link key={p.slug} to={`/product/${p.slug}`} aria-label={p.name}>
                  <img src={img(p.images[0], 300, 400)} alt="" loading="lazy" />
                </Link>
              ))}
            </div>
          </FadeUp>
        )}
        <FadeUp delay={0.25}><Link to={`/category/${slug}`} className="btn">Shop {label.toLowerCase()}</Link></FadeUp>
      </div>
    </article>
  );
}

const STORIES = [
  { slug: 't-shirts', label: 'T-Shirts', title: ['The tee,', 'taken seriously'], copy: 'Heavyweight jersey that holds a collar, cuts that sit right tucked or loose, and colour that fades slowly and evenly.', image: '1503341504253-dff4815485f1' },
  { slug: 'shirts', label: 'Shirts', title: ['Pressed,', 'never rigid'], copy: 'Oxford, poplin, linen and denim with soft structure. Shirts that look sharp at nine and still feel easy at nine.', image: '1588359348347-9bc6cbbb689e' },
  { slug: 'hoodies', label: 'Hoodies', title: ['Made for the', 'in-between'], copy: 'Brushed fleece and loopback cotton in real weights, for evenings that cool and mornings that start slow.', image: '1556821840-3a63f95609a7' },
  { slug: 'ladies-wear', label: 'Ladies Wear', title: ['Soft, but', 'structured'], copy: 'Fluid shapes cut with intent. Dresses, co-ords and tailoring that travel with you and still fall right at the end of the day.', image: '1566174053879-31528523f8ae' },
];

function Tread() {
  return (
    <section className="tread" aria-label="Our promise">
      <img src={img(IMAGES.heroAlt, 2000)} srcSet={srcSet(IMAGES.heroAlt, [900, 1400, 2000])} sizes="100vw" alt="" loading="lazy" />
      <div className="container">
        <Rise lines={['Clothes', 'built to', 'stay']} />
        <FadeUp delay={0.3}><p>Made with care for the long run. Simple shapes, natural cloth, and pieces you will still reach for in five years.</p></FadeUp>
        <FadeUp delay={0.4}><Link to="/shop" className="btn btn--light">Shop now</Link></FadeUp>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee text="Find your season edit" plain />
      <ProductRail
        id="wardrobe"
        title="Rethink Your Wardrobe"
        tabs={[
          { label: 'T-Shirts', query: { category: 't-shirts' } },
          { label: 'Shirts', query: { category: 'shirts' } },
          { label: 'Hoodies', query: { category: 'hoodies' } },
          { label: 'Ladies Wear', query: { category: 'ladies-wear' } },
        ]}
      />
      <Split />
      <Statement />
      <SliceBanner />
      <ProductRail
        id="selected"
        title="Selected Pieces"
        tabs={[
          { label: 'New In', query: { sort: 'newest' } },
          { label: 'Bestsellers', query: { sort: 'rating' } },
          { label: 'On Sale', query: { sale: true } },
          { label: 'For Her', query: { gender: 'women', sort: 'rating' } },
        ]}
      />
      <section className="section container" aria-label="Collections">
        <div className="stories">
          {STORIES.map((s, i) => <Story key={s.slug} index={i} {...s} />)}
        </div>
      </section>
      <Tread />
      <Marquee text="Find your season edit" plain />
    </>
  );
}
