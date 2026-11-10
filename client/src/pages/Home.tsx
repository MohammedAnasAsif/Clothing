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
    <section className="hero" aria-label="STYLE HEAVEN">
      <div className="hero__media">
        <img
          src={img(IMAGES.hero, 1800)}
          srcSet={srcSet(IMAGES.hero, [800, 1200, 1800, 2400])}
          sizes="100vw"
          alt="A woman asleep on satin bedding wearing a satin eye mask"
          fetchPriority="high"
        />
      </div>
      <div className="hero__content">
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 1 }}>
          Satin for hair &amp; sleep
        </motion.p>
        <Rise as="h1" className="hero__title hero__title--brand" lines={['STYLE HEAVEN']} immediate delay={0.15} />
        <motion.p className="hero__copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1, ease }}>
          Satin scrunchies, sleep sets, pillow covers, eye masks, bow clips and gifting sets. Softer on your hair, softer
          on your skin, and made in colours you will want in every size.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1, ease }}>
          <Link to="/shop" className="btn btn--light">Shop the collection</Link>
        </motion.div>
      </div>
    </section>
  );
}

function Split() {
  const items = [
    { to: '/category/scrunchies', title: 'HAIR', copy: 'Satin scrunchies and bow clips, from everyday ponytails to party braids.', image: IMAGES.hair },
    { to: '/category/pillow-covers', title: 'SLEEP', copy: 'Sleep sets, pillow covers and eye masks for softer nights and smoother mornings.', image: IMAGES.sleep },
  ];
  return (
    <section className="split" aria-label="Shop hair or sleep">
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
    'Treat', 'your', 'hair', { pill: '1606772016409-d4a55e32be6e' }, 'and', 'skin', 'to', 'satin', '—',
    { pill: '1687435703153-88f6bc0cdcff' }, 'softer', 'nights,', 'smoother', { pill: '1559051668-9024c9b5e84b' }, 'mornings.',
  ];
  return (
    <section className="statement container" aria-label="Why satin">
      <p ref={ref}>
        {tokens.map((t, i) => {
          const range: [number, number] = [i / tokens.length, Math.min(1, (i + 2) / tokens.length)];
          if (typeof t === 'string')
            return (
              <Word key={i} progress={scrollYProgress} range={range}>
                {t === 'satin' || t === 'mornings.' ? <em>{t}</em> : t}
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
  const url = img(IMAGES.combo, 2000);
  return (
    <section className="slice-banner" aria-label="Combos">
      <motion.div
        className="slices"
        style={{ ['--n' as string]: n }}
        aria-hidden
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-15% 0px' }}
      >
        {Array.from({ length: n }, (_, i) => (
          <div key={i}>
            <motion.div
              style={{ left: `${-i * 100}%`, backgroundImage: `url(${url})` }}
              custom={i}
              variants={{
                hidden: (k: number) => ({ y: k % 2 ? '100%' : '-100%' }),
                show: (k: number) => ({ y: '0%', transition: { duration: 1.3, ease, delay: 0.06 * k } }),
              }}
            />
          </div>
        ))}
      </motion.div>
      <div className="slice-banner__content">
        <div className="container">
          <div className="inner">
            <FadeUp><span className="eyebrow">Gifting sets</span></FadeUp>
            <Rise lines={['One Colour,', 'The Whole Set']} delay={0.3} />
            <FadeUp delay={0.5}><p>A satin pillow cover, eye mask and scrunchie in Lemon, Lilac, Onion Pink, Pistachio or Classic Black. Ready to gift.</p></FadeUp>
            <FadeUp delay={0.6}><Link to="/category/gifting-sets" className="link-u">Shop gifting sets</Link></FadeUp>
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
  const { data } = useAsync(() => api.products({ category: slug, limit: 3 }), [slug]);
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
  { slug: 'scrunchies', label: 'Scrunchies', title: ['Hold,', 'without the dent'], copy: 'Smooth satin that slides out without tugging. Mini, regular and XL, in every colour of the range.', image: '1777795530508-005312461d00' },
  { slug: 'eye-masks', label: 'Eye Masks', title: ['Lights out,', 'softly'], copy: 'A satin mask that blocks the light without pressing on your eyes, with a band that stays put all night.', image: '1666934209593-25b6aa02ab4e' },
  { slug: 'pillow-covers', label: 'Pillow Covers', title: ['Satin where', 'you sleep'], copy: 'Hidden envelope closure, three sizes, and a surface your hair glides over instead of rubbing against.', image: '1698746043955-42b03ddedfcb' },
  { slug: 'sleep-sets', label: 'Sleep Sets', title: ['Sleepwear that', 'feels like satin'], copy: 'Soft piping, an easy fit and fabric that stays cool against your skin. In solids and prints.', image: '1793930300711-883df7f0e835' },
];

const BENEFITS = [
  ['Gentle on hair', 'Satin glides instead of gripping, so there is less tugging when a scrunchie comes out.'],
  ['No sharp dents', 'A satin scrunchie holds your hair without the crease a tight elastic leaves.'],
  ['Less frizz overnight', 'Hair slides over a satin pillow cover instead of rubbing against cotton.'],
  ['Kind to skin', 'A smooth, cool surface against your face from lights out to alarm.'],
];

function Benefits() {
  return (
    <section className="section container benefits" aria-labelledby="benefits-title">
      <div className="section-head">
        <h2 id="benefits-title" className="serif-h">Why <em>satin</em></h2>
        <Link to="/shop" className="link-u">Shop all satin</Link>
      </div>
      <div className="benefits__grid">
        {BENEFITS.map(([h, p], i) => (
          <FadeUp key={h} delay={i * 0.08}>
            <div className="benefit">
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

function Tread() {
  return (
    <section className="tread" aria-label="Wholesale">
      <img src={img(IMAGES.satin, 2000)} srcSet={srcSet(IMAGES.satin, [900, 1400, 2000])} sizes="100vw" alt="" loading="lazy" />
      <div className="container">
        <Rise lines={['Softer', 'nights start', 'here']} />
        <FadeUp delay={0.3}><p>Order online, or send us a DM on Instagram. Bulk and wholesale orders welcome for boutiques, salons and gifting.</p></FadeUp>
        <FadeUp delay={0.4}><Link to="/contact" className="btn btn--light">Wholesale enquiries</Link></FadeUp>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee text="Sleep pretty · Wake up smooth" plain />
      <ProductRail
        id="satin"
        title="The Satin Edit"
        tabs={[
          { label: 'Scrunchies', query: { category: 'scrunchies' } },
          { label: 'Eye Masks', query: { category: 'eye-masks' } },
          { label: 'Pillow Covers', query: { category: 'pillow-covers' } },
          { label: 'Bow Clips', query: { category: 'bow-clips' } },
        ]}
      />
      <Split />
      <Statement />
      <SliceBanner />
      <ProductRail
        id="selected"
        title="Selected Pieces"
        tabs={[
          { label: 'Gifting Sets', query: { category: 'gifting-sets' } },
          { label: 'New In', query: { sort: 'newest' } },
          { label: 'On Sale', query: { sale: true } },
          { label: 'Sleep Sets', query: { category: 'sleep-sets' } },
        ]}
      />
      <section className="section container" aria-label="Collections">
        <div className="stories">
          {STORIES.map((s, i) => <Story key={s.slug} index={i} {...s} />)}
        </div>
      </section>
      <Benefits />
      <Tread />
      <Marquee text="Sleep pretty · Wake up smooth" plain />
    </>
  );
}
