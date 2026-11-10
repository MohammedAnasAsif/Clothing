import { motion } from 'motion/react';
import { Star, StarHalf } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Product } from '../../../shared/types';
import { money } from '../lib/format';

export function Stars({ rating, count, size = 13 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="stars" aria-label={`Rated ${rating} out of 5${count != null ? `, ${count} reviews` : ''}`}>
      <span className="stars__row" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) =>
          rating >= i - 0.25 ? (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
          ) : rating >= i - 0.75 ? (
            <span key={i} style={{ position: 'relative', display: 'inline-flex' }}>
              <Star size={size} fill="#e3ded6" strokeWidth={0} />
              <StarHalf size={size} fill="currentColor" strokeWidth={0} style={{ position: 'absolute', inset: 0 }} />
            </span>
          ) : (
            <Star key={i} size={size} fill="#e3ded6" strokeWidth={0} />
          ),
        )}
      </span>
      <span aria-hidden>{rating.toFixed(1)}</span>
      {count != null && <span className="stars__count" aria-hidden>({count})</span>}
    </span>
  );
}

export function Price({ p, large }: { p: Pick<Product, 'price' | 'compareAt'>; large?: boolean }) {
  return (
    <span className={`price${large ? ' price--lg' : ''}`}>
      <span>{money(p.price)}</span>
      {p.compareAt && (
        <s>
          <span className="sr-only">was </span>
          {money(p.compareAt)}
        </s>
      )}
    </span>
  );
}

const riseEase = [0.22, 1, 0.36, 1] as const;

/**
 * Headline whose lines rise from behind their baseline as they enter view.
 * The in-view trigger sits on the heading itself: the line spans start clipped by their mask,
 * so observing them directly would never report them as visible.
 */
export function Rise({
  lines,
  as: Tag = 'h2',
  className,
  delay = 0,
  immediate,
}: {
  lines: ReactNode[];
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const M = motion[Tag];
  return (
    <M
      className={className}
      initial="hidden"
      {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-8% 0px' } })}
    >
      {lines.map((line, i) => (
        <span className="rise" key={i}>
          <motion.span
            variants={{
              hidden: { y: '105%' },
              show: { y: '0%', transition: { duration: 1.05, ease: riseEase, delay: delay + i * 0.09 } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </M>
  );
}

export function FadeUp({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function Marquee({ text, plain }: { text: string; plain?: boolean }) {
  const items = Array.from({ length: 8 });
  return (
    <div className={`marquee${plain ? ' marquee--plain' : ''}`} aria-hidden>
      <div className="marquee__track">
        {items.map((_, i) => (
          <span key={i}>
            {text} <i>·</i>
          </span>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card" aria-hidden>
      <div className="card__media skeleton" />
      <div className="card__body">
        <div className="skeleton" style={{ height: 14, width: '70%' }} />
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
      </div>
    </div>
  );
}
