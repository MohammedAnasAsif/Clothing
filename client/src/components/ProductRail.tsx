import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductQuery } from '../../../shared/types';
import { api } from '../lib/api';
import { useAsync } from '../lib/store';
import { ProductCard } from './ProductCard';
import { CardSkeleton } from './ui';

export interface RailTab {
  label: string;
  query: ProductQuery;
}

/** Tabbed, snapping product carousel with arrows and a progress bar. */
export function ProductRail({ title, tabs, id }: { title: string; tabs: RailTab[]; id: string }) {
  const [active, setActive] = useState(0);
  const { data, loading, error, reload } = useAsync(() => api.products({ limit: 10, ...tabs[active].query }), [active]);
  const ref = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ left: 0, width: 1, atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScroll({
      left: max > 0 ? el.scrollLeft / el.scrollWidth : 0,
      width: el.scrollWidth ? el.clientWidth / el.scrollWidth : 1,
      atStart: el.scrollLeft < 4,
      atEnd: el.scrollLeft > max - 4,
    });
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [data, measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section className="section container" aria-labelledby={`${id}-title`}>
      <div className="section-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <div className="tabs" role="tablist" aria-label={`${title} filters`}>
          {tabs.map((t, i) => (
            <button key={t.label} role="tab" aria-selected={i === active} aria-controls={`${id}-panel`} onClick={() => setActive(i)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rail" id={`${id}-panel`} role="tabpanel" style={{ ['--img-h' as string]: '36%' }}>
        {error ? (
          <div className="notice notice--error">
            {error.message}
            <button className="btn btn--sm btn--ghost" onClick={reload}>Try again</button>
          </div>
        ) : (
          <>
            <button className="rail__arrow rail__arrow--prev" aria-label="Previous products" disabled={scroll.atStart} onClick={() => page(-1)}>
              <ChevronLeft size={18} />
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={active + (loading ? '-l' : '')}
                ref={ref}
                className="rail__viewport"
                onScroll={measure}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {loading && !data
                  ? Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)
                  : data?.items.map((p, i) => <ProductCard key={p.slug} p={p} eager={i < 4} />)}
              </motion.div>
            </AnimatePresence>
            <button className="rail__arrow rail__arrow--next" aria-label="More products" disabled={scroll.atEnd} onClick={() => page(1)}>
              <ChevronRight size={18} />
            </button>
            <div className="rail__progress" aria-hidden>
              <span style={{ left: `${scroll.left * 100}%`, width: `${scroll.width * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
