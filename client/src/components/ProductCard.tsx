import { Link } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import type { Product } from '../../../shared/types';
import { discountPct } from '../../../shared/query';
import { img, srcSet } from '../lib/format';
import { useStore } from '../lib/store';
import { Price, Stars } from './ui';

export function ProductCard({ p, eager }: { p: Product; eager?: boolean }) {
  const { addToCart, toggleWishlist, inWishlist, setQuickView } = useStore();
  const off = discountPct(p);
  const saved = inWishlist(p.slug);
  const sizes = '(max-width: 760px) 72vw, (max-width: 1100px) 33vw, 25vw';

  return (
    <article className="card">
      <div className="card__media">
        <img
          src={img(p.images[0], 640, 853)}
          srcSet={srcSet(p.images[0], [360, 520, 720], 4 / 3)}
          sizes={sizes}
          alt={`${p.name} in ${p.colors[0].name}`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        {p.images[1] && (
          <img
            className="alt"
            src={img(p.images[1], 640, 853)}
            srcSet={srcSet(p.images[1], [360, 520, 720], 4 / 3)}
            sizes={sizes}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
        {off > 0 && <span className="card__badge">{off}%</span>}
        {p.badge && <span className="card__badge card__badge--tag" style={{ marginTop: off ? 30 : 0 }}>{p.badge}</span>}
        <div className="card__tools">
          <button
            type="button"
            className={`card__tool${saved ? ' is-on' : ''}`}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
            onClick={() => toggleWishlist(p.slug)}
          >
            <Heart size={17} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button type="button" className="card__tool" aria-label={`Quick view ${p.name}`} onClick={() => setQuickView(p)}>
            <Eye size={17} strokeWidth={1.5} />
          </button>
        </div>
        <button type="button" className="card__add" onClick={() => addToCart(p)} aria-label={`Add ${p.name} to cart`}>
          Add to cart
        </button>
      </div>
      <div className="card__body">
        <h3 className="card__name">
          <Link to={`/product/${p.slug}`}>{p.name}</Link>
        </h3>
        <Price p={p} />
        <Stars rating={p.rating} count={p.reviewCount} />
        <p className="card__desc">{p.description}</p>
      </div>
    </article>
  );
}
